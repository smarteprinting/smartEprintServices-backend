import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { isAdminRequest } from "@/lib/adminAuth";

export async function PATCH(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!name || !email) return NextResponse.json({ success: false, message: "Name and email are required" }, { status: 400 });

    await connectDB();
    const duplicate = await User.findOne({ email, _id: { $ne: params.id } }).select("_id").lean();
    if (duplicate) return NextResponse.json({ success: false, message: "That email is already in use" }, { status: 409 });
    const [firstName = "", ...lastParts] = name.split(/\s+/);
    const user = await User.findOneAndUpdate(
      { _id: params.id, isAdmin: false },
      { $set: { name, email, firstName, lastName: lastParts.join(" ") } },
      { new: true, runValidators: true },
    ).select("-password").lean();
    if (!user) return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    return NextResponse.json({ success: true, customer: { ...user, stats: { orders: 0, spent: 0, items: 0 } } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const customer = await User.findOneAndDelete({ _id: params.id, isAdmin: false });
    if (!customer) return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Customer deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to delete customer" }, { status: 500 });
  }
}
