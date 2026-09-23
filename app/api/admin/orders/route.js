import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).populate("customer", "name email").lean();
    return NextResponse.json({ success: true, orders, total: orders.length });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    const payload = await request.json();
    if (!payload.customerName || !payload.customerEmail) return NextResponse.json({ success: false, message: "Customer name and email are required" }, { status: 400 });
    await connectDB();
    const order = await Order.create({ ...payload, orderId: payload.orderId || `ORD-${Date.now()}` });
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to create order" }, { status: 500 });
  }
}
