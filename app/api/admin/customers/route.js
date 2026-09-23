import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const [users, orderTotals] = await Promise.all([
      User.find({ isAdmin: false }).select("-password").sort({ createdAt: -1 }).lean(),
      Order.aggregate([{ $group: { _id: "$customer", spent: { $sum: "$total" }, items: { $sum: { $sum: "$items.quantity" } }, orders: { $sum: 1 } } }]),
    ]);
    const totals = new Map(orderTotals.map((item) => [String(item._id), item]));
    const customers = users.map((user) => ({ ...user, stats: totals.get(String(user._id)) || { spent: 0, items: 0, orders: 0 } }));
    return NextResponse.json({ success: true, customers, total: customers.length });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to load customers" }, { status: 500 });
  }
}
