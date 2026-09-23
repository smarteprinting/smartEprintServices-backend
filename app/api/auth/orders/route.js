import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const token = await verifyToken(getTokenFromRequest(request));
    if (!token?.id || token.isAdmin) {
      return NextResponse.json({ success: false, message: "Please sign in first." }, { status: 401 });
    }

    await connectDB();
    const orders = await Order.find({ customer: token.id })
      .sort({ createdAt: -1 })
      .select("orderId items total status paymentStatus createdAt shippingCity shippingState")
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("GET /api/auth/orders error:", error);
    return NextResponse.json({ success: false, message: "Could not load your order history." }, { status: 500 });
  }
}
