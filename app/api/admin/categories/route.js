import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/lib/models/Category";
import { isAdminRequest } from "@/lib/adminAuth";
import { categories as defaultCategories } from "@/lib/productsData";

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    // Older category records may not have isActive. Promote them before seeding defaults.
    await Category.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    for (const category of defaultCategories.filter((item) => item.id !== "all")) {
      await Category.findOneAndUpdate(
        { slug: category.id },
        { $setOnInsert: { name: category.label, slug: category.id, isActive: true } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    await connectDB();
    const category = await Category.create({ name: name.trim(), slug: slugify(name) });
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    const duplicate = error.code === 11000;
    return NextResponse.json({ success: false, message: duplicate ? "This category already exists" : error.message || "Failed to create category" }, { status: duplicate ? 409 : 500 });
  }
}
