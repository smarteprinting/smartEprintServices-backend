import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const token = await verifyToken(getTokenFromRequest(request));
    if (!token?.id) {
      return NextResponse.json({ success: false, user: null }, { status: 200 });
    }

    await connectDB();
    const user = await User.findById(token.id).select("-password").lean();
    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        avatar: user.avatar || null,
        isAdmin: Boolean(user.isAdmin),
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ success: false, user: null }, { status: 200 });
  }
}
