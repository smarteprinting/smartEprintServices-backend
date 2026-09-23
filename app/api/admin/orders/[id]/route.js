import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { isAdminRequest } from "@/lib/adminAuth";

const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export async function PATCH(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    const { status, trackingNumber, paymentStatus } = await request.json();
    if (status && !statuses.includes(status)) return NextResponse.json({ success: false, message: "Invalid order status" }, { status: 400 });
    if (paymentStatus && !["pending", "paid", "failed", "refunded"].includes(paymentStatus)) return NextResponse.json({ success: false, message: "Invalid payment status" }, { status: 400 });
    await connectDB();
    const order = await Order.findByIdAndUpdate(params.id, { ...(status ? { status } : {}), ...(trackingNumber !== undefined ? { trackingNumber: String(trackingNumber).trim() } : {}), ...(paymentStatus ? { paymentStatus } : {}) }, { new: true, runValidators: true });
    if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const order = await Order.findByIdAndDelete(params.id);
    if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to delete order" }, { status: 500 });
  }
}
