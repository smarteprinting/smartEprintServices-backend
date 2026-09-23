import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const [orders, customers, products, revenue, byStatus] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ isAdmin: false }),
      Product.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    return NextResponse.json({ success: true, analytics: { orders, customers, products, revenue: revenue[0]?.total || 0, byStatus } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to load analytics" }, { status: 500 });
  }
}
