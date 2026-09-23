import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import mongoose from "mongoose";
import { isAdminRequest } from "@/lib/adminAuth";
import { products as fallbackCatalog } from "@/lib/productsData";

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function parseSpecificationTable(value = "") {
  const rows = [];
  const pattern = /<tr[^>]*>[\s\S]*?<t[dh][^>]*>([\s\S]*?)<\/t[dh]>[\s\S]*?<t[dh][^>]*>([\s\S]*?)<\/t[dh]>[\s\S]*?<\/tr>/gi;
  let match;
  while ((match = pattern.exec(String(value)))) {
    const label = stripHtml(match[1]);
    const rowValue = stripHtml(match[2]);
    if (label && rowValue) rows.push({ label, value: rowValue });
  }
  return rows;
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    let product = null;

    try {
      await connectDB();
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id).lean();
      }
      if (!product) {
        product = await Product.findOne({ slug: id }).lean();
      }
    } catch (dbErr) {
      console.warn("DB lookup error in GET /api/products/[id]:", dbErr.message);
    }

    if (!product) {
      const fb = fallbackCatalog.find(
        (p) => String(p.id) === String(id) || String(p.slug) === String(id)
      );
      if (fb) {
        return NextResponse.json({
          success: true,
          product: {
            ...fb,
            id: fb.id,
            name: fb.name || fb.title,
            title: fb.name || fb.title,
            image: fb.image || fb.images?.[0] || "",
            price: fb.price,
            salePrice: fb.price,
            oldPrice: fb.originalPrice || fb.price,
            originalPrice: fb.originalPrice || fb.price,
            images: Array.from(new Set([...(fb.images || []), fb.image].filter(Boolean))),
            shortDesc: fb.shortDesc || "",
            highlights: fb.highlights || fb.shortDesc || "",
            overview: fb.overview || fb.shortDesc || "",
            countInStock: fb.stockCount || 10,
            inStock: fb.inStock !== false,
            technicalSpecificationRows: fb.specs
              ? Object.entries(fb.specs).map(([label, value]) => ({ label, value: String(value) }))
              : [],
            specs: fb.specs || {},
          },
        });
      }

      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        id: product._id.toString(),
        name: product.title || product.name,
        image: product.image || product.images?.[0] || "",
        price: product.salePrice || product.price,
        originalPrice: product.salePrice ? product.price : (product.oldPrice || product.originalPrice || product.price),
        images: Array.from(new Set([...(product.images || []), product.image].filter(Boolean))),
        shortDesc: product.shortDesc || stripHtml(product.shortDetails || ""),
        highlights: product.highlights || product.shortDetails || "",
        overview: product.overview || product.description || "",
        technicalSpecificationRows: product.technicalSpecificationRows?.length
          ? product.technicalSpecificationRows
          : parseSpecificationTable(product.technicalSpecification || product.shortSpecification || ""),
        specs: product.specifications || {},
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const { id } = params;
    const data = await request.json();

    const updatePayload = { ...data, source: "admin" };
    if (data.title) updatePayload.title = data.title.trim();
    if (data.brand) updatePayload.brand = data.brand.trim();
    if (data.price !== undefined) updatePayload.price = Number(data.price);
    if (data.salePrice !== undefined) updatePayload.salePrice = Number(data.salePrice);
    if (data.oldPrice !== undefined) updatePayload.oldPrice = Number(data.oldPrice);
    if (data.countInStock !== undefined) {
      updatePayload.countInStock = Number(data.countInStock);
      updatePayload.inStock = Number(data.countInStock) > 0;
    }

    const updated = await Product.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product not found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const { id } = params;

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Product not found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully from inventory",
    });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
