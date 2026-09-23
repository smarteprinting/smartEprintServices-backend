import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { isAdminRequest } from "@/lib/adminAuth";

export async function POST(request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    }
    const contentType = request.headers.get("content-type") || "";

    // 1. Multipart Form Data (file upload from input type="file")
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("files");
      const file = formData.get("file") || formData.get("image");

      if (files.length > 0) {
        if (files.length > 8) return NextResponse.json({ success: false, message: "You can upload up to 8 images." }, { status: 400 });
        const urls = [];
        for (const item of files) {
          if (!item || typeof item.arrayBuffer !== "function") continue;
          if (item.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: "Each image must be 5MB or smaller." }, { status: 400 });
          if (!String(item.type || "").startsWith("image/")) return NextResponse.json({ success: false, message: "Only image files are allowed." }, { status: 400 });
          urls.push(await uploadToCloudinary(Buffer.from(await item.arrayBuffer()), "smarteprint_products"));
        }
        return NextResponse.json({ success: true, urls, url: urls[0] || "" });
      }

      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided in form data" },
          { status: 400 }
        );
      }

      if (typeof file === "object" && "arrayBuffer" in file) {
        if (file.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: "Image must be 5MB or smaller." }, { status: 400 });
        const buffer = Buffer.from(await file.arrayBuffer());
        const secureUrl = await uploadToCloudinary(buffer, "smarteprint_products");
        return NextResponse.json({ success: true, url: secureUrl });
      }

      if (typeof file === "string") {
        const secureUrl = await uploadToCloudinary(file, "smarteprint_products");
        return NextResponse.json({ success: true, url: secureUrl });
      }
    }

    // 2. JSON Body (Base64 data:image/... or remote image URL)
    const json = await request.json();
    const image = json.image || json.file || json.url;

    if (!image) {
      return NextResponse.json(
        { success: false, message: "No image URL or base64 data provided" },
        { status: 400 }
      );
    }

    const secureUrl = await uploadToCloudinary(image, "smarteprint_products");
    return NextResponse.json({ success: true, url: secureUrl });
  } catch (error) {
    console.error("Cloudinary upload API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}
