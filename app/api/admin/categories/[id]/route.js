import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/lib/models/Category";
import { isAdminRequest } from "@/lib/adminAuth";

export async function PUT(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    await connectDB();
    const category = await Category.findByIdAndUpdate(params.id, { name: name.trim(), slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }, { new: true, runValidators: true });
    if (!category) return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const category = await Category.findByIdAndUpdate(params.id, { isActive: false }, { new: true });
    if (!category) return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to delete category" }, { status: 500 });
  }
}
