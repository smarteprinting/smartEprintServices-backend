import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (payload.id === "admin-super") {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: "admin-super",
          name: "SmartEprint Admin",
          email: "admin@smarteprintservices.com",
          isAdmin: true,
        },
      });
    }

    try {
      await connectDB();
      const user = await User.findById(payload.id).select("-password");
      if (user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
          },
        });
      }
    } catch {
      // fallback to token payload if db temp unavailable
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        email: payload.email,
        isAdmin: payload.isAdmin,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
