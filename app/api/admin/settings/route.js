import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/lib/models/SiteSettings";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    await connectDB();
    const settings = (await SiteSettings.findOne({ key: "company" }).lean()) || { key: "company", companyName: "SmartEprint Services", email: "support@smarteprintservices.com", currency: "USD" };
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!(await isAdminRequest(request))) return NextResponse.json({ success: false, message: "Admin authentication required" }, { status: 401 });
    const data = await request.json();
    await connectDB();
    const settings = await SiteSettings.findOneAndUpdate({ key: "company" }, { ...data, key: "company" }, { new: true, upsert: true, runValidators: true });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || "Failed to save settings" }, { status: 500 });
  }
}
