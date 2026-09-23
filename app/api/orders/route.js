import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

function makeOrderId() {
  return `SEP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function POST(request) {
  try {
    const token = await verifyToken(getTokenFromRequest(request));
    if (!token?.id || token.isAdmin) {
      return NextResponse.json({ success: false, message: "Please sign in before purchasing." }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, email, phone, address, city, state, zipCode, items, paymentMethod = "delivery", includeSetup = false, cloverToken } = body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !state?.trim() || !zipCode?.trim()) {
      return NextResponse.json({ success: false, message: "Complete customer and delivery details are required." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "Your cart is empty." }, { status: 400 });
    }
    if (!["card", "delivery"].includes(paymentMethod)) {
      return NextResponse.json({ success: false, message: "Unsupported payment method." }, { status: 400 });
    }

    await connectDB();
    const productIds = items.map((item) => item.id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds }, source: "admin" }).lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(String(item.id));
      const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
      if (!product) return NextResponse.json({ success: false, message: "One of the products is no longer available." }, { status: 409 });
      if (product.countInStock < quantity) return NextResponse.json({ success: false, message: `${product.title} has insufficient stock.` }, { status: 409 });
      orderItems.push({ product: product._id, name: product.title, quantity, price: product.salePrice || product.price });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const requestedShippingFee = Number(body.shippingFee);
    if (!Number.isFinite(requestedShippingFee) || requestedShippingFee < 0) {
      return NextResponse.json({ success: false, message: "Calculate shipping before placing your order." }, { status: 400 });
    }
    const shippingFee = requestedShippingFee;
    const setupFee = includeSetup ? 49 : 0;
    const total = subtotal + shippingFee + setupFee;
    let paymentStatus = "pending";
    let paymentReference = "";

    if (paymentMethod === "card") {
      if (!cloverToken || !process.env.CLOVER_PRIVATE_KEY || !process.env.CLOVER_ENV) {
        return NextResponse.json({ success: false, message: "Secure card payment is not configured." }, { status: 503 });
      }
      const cloverBaseUrl = process.env.CLOVER_ENV === "production" ? "https://scl.clover.com" : "https://scl-sandbox.dev.clover.com";
      const paymentResponse = await fetch(`${cloverBaseUrl}/v1/charges`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${process.env.CLOVER_PRIVATE_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: "usd", source: cloverToken, ecomind: "ecom", receipt_email: token.email }),
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok || paymentData.status === "failed" || paymentData.paid === false) {
        return NextResponse.json({ success: false, message: paymentData.message || "Card payment was declined." }, { status: 402 });
      }
      paymentStatus = "paid";
      paymentReference = paymentData.id || "";
    }
    const order = await Order.create({
      orderId: makeOrderId(),
      customer: token.id,
      customerName: token.name || fullName.trim(),
      customerEmail: token.email,
      items: orderItems,
      subtotal,
      shippingFee,
      setupFee,
      total,
      paymentMethod,
      paymentStatus,
      paymentReference,
      status: "Pending",
      shippingAddress: address.trim(),
      shippingCity: city.trim(),
      shippingState: state.trim(),
      shippingZipCode: zipCode.trim(),
    });

    await Promise.all(orderItems.map((item) => Product.updateOne({ _id: item.product }, { $inc: { countInStock: -item.quantity } })));

    return NextResponse.json({ success: true, order: { id: order._id, orderId: order.orderId, total: order.total, paymentStatus: order.paymentStatus } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ success: false, message: "We could not place your order. Please try again." }, { status: 500 });
  }
}