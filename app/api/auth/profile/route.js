import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function PATCH(request) {
  try {
    const token = await verifyToken(getTokenFromRequest(request));
    if (!token?.id) {
      return NextResponse.json({ success: false, message: "Please sign in first." }, { status: 401 });
    }

    const body = await request.json();
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const name = `${firstName} ${lastName}`.trim() || (typeof body.name === "string" ? body.name.trim() : "");
    if (!name) {
      return NextResponse.json({ success: false, message: "Enter your name." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      token.id,
      { $set: { name, firstName, lastName } },
      { new: true, runValidators: true },
    ).select("-password").lean();

    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: { id: String(user._id), name: user.name, firstName: user.firstName || "", lastName: user.lastName || "", email: user.email, avatar: user.avatar || null, isAdmin: Boolean(user.isAdmin) },
    });
  } catch (error) {
    console.error("PATCH /api/auth/profile error:", error);
    return NextResponse.json({ success: false, message: "Could not update your profile." }, { status: 500 });
  }
}
