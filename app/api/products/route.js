import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { isAdminRequest } from "@/lib/adminAuth";

function generateSlug(text) {
  const base = String(text || "product")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${randomSuffix}`;
}

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return NextResponse.json({
        success: true,
        source: "fallback",
        products: [],
        total: 0,
      });
    }

    await connectDB();
    // Older admin-created records predate the source field. Treat them as catalog records once.
    await Product.updateMany(
      { $or: [{ source: { $exists: false } }, { source: null }] },
      { $set: { source: "admin" } }
    );

    const query = { source: "admin" };
    if (category && category !== "all") {
      query.category = category;
    }
    if (brand && brand !== "All Brands") {
      query.brand = { $regex: new RegExp(`^${brand}$`, "i") };
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { shortDesc: { $regex: q, $options: "i" } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    const normalized = products.map((p) => ({
      ...p,
      id: p._id.toString(),
      name: p.title || p.name,
      image: p.image || p.images?.[0] || "",
      images: Array.from(new Set([...(p.images || []), p.image].filter(Boolean))),
      price: p.salePrice || p.price,
      originalPrice: p.salePrice ? p.price : (p.oldPrice || p.originalPrice || p.price),
      stockCount: p.countInStock ?? 10,
      specs: p.specifications || {},
      shortDesc: p.shortDesc || stripHtml(p.shortDetails || ""),
      highlights: p.highlights || p.shortDetails || "",
      overview: p.overview || p.description || "",
      technicalSpecificationRows: p.technicalSpecificationRows?.length
        ? p.technicalSpecificationRows
        : parseSpecificationTable(p.technicalSpecification || p.shortSpecification || ""),
    }));

    function isHpPrinter(p) {
      const name = (p.title || p.name || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const isHp = brand === "hp" || name.includes("hp");
      if (!isHp) return false;
      const cat = String(p.category || "").toLowerCase();
      const isSupplies =
        name.includes("cartridge") ||
        name.includes("toner") ||
        name.includes("ink bottle") ||
        name.includes("cable") ||
        name.includes("cord") ||
        name.includes("drum") ||
        name.includes("yield") ||
        cat.includes("supplies") ||
        cat.includes("accessories") ||
        cat === "698238e1aafc80955cc50c4a" ||
        cat === "6aa5d0fa035a474cc5e0c719" ||
        cat === "6aa5d0fa035a474cc5e0c71a";
      if (isSupplies) return false;
      return (
        name.includes("printer") ||
        name.includes("laserjet") ||
        name.includes("deskjet") ||
        name.includes("officejet") ||
        name.includes("smart tank") ||
        name.includes("envy") ||
        name.includes("all-in-one") ||
        name.includes("mfp") ||
        name.includes("pagewide") ||
        name.includes("designjet") ||
        cat === "laser" ||
        cat === "inkjet" ||
        cat === "all-in-one" ||
        cat === "698238c9aafc80955cc50c40" ||
        cat === "698238b9aafc80955cc50c3b" ||
        cat === "6982389caafc80955cc50c31"
      );
    }

    normalized.sort((a, b) => {
      const aHpPrinter = isHpPrinter(a) ? 1 : 0;
      const bHpPrinter = isHpPrinter(b) ? 1 : 0;
      return bHpPrinter - aHpPrinter;
    });

    return NextResponse.json({
      success: true,
      source: "database",
      products: normalized,
      total: normalized.length,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({
      success: true,
      source: "fallback",
      products: [],
      total: 0,
      message: "Products temporarily unavailable",
    });
  }
}

export async function POST(request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    }
    await connectDB();

    const data = await request.json();

    if (!data.title || !data.price || !data.brand) {
      return NextResponse.json(
        { success: false, message: "Title, brand, and price are required" },
        { status: 400 }
      );
    }

    const slug = data.slug ? data.slug.trim() : generateSlug(data.title);

    // Normalize features and specs
    const features = Array.isArray(data.features)
      ? data.features.filter(Boolean)
      : typeof data.features === "string"
      ? data.features.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

    const technicalSpecificationRows = Array.isArray(data.technicalSpecificationRows)
      ? data.technicalSpecificationRows.filter((r) => r && (r.label || r.value))
      : [];

    const specifications = data.specifications || {};
    technicalSpecificationRows.forEach((r) => {
      if (r.label) {
        specifications[r.label] = r.value;
      }
    });

    const productPayload = {
      title: data.title.trim(),
      brand: data.brand.trim(),
      slug,
      source: "admin",
      category: data.category || "all",
      technology: data.technology || "",
      usageCategory: data.usageCategory || "",
      allInOneType: data.allInOneType || "",
      wireless: data.wireless || "",
      mainFunction: data.mainFunction || "",
      price: Number(data.price),
      salePrice: Number(data.salePrice || 0),
      oldPrice: Number(data.oldPrice || data.originalPrice || 0),
      countInStock: Number(data.countInStock ?? 15),
      inStock: Number(data.countInStock ?? 15) > 0,
      badge: data.badge || "",
      image: data.image || (data.images && data.images[0]) || "",
      images: data.images || (data.image ? [data.image] : []),
      shortDesc: data.shortDesc || "",
      overview: data.overview || data.description || "",
      features,
      highlights: data.highlights || "",
      keywords: Array.isArray(data.keywords) ? data.keywords.filter(Boolean) : [],
      specifications,
      technicalSpecificationRows,
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
      rating: Number(data.rating || 4.8),
      reviewsCount: Number(data.reviewsCount || 12),
    };

    const newProduct = await Product.create(productPayload);

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully in catalog",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
