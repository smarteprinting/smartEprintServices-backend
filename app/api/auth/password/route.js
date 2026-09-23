import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function PATCH(request) {
  try {
    const token = await verifyToken(getTokenFromRequest(request));
    if (!token?.id) {
      return NextResponse.json({ success: false, message: "Please sign in first." }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: "Complete all password fields." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "New password must be at least 6 characters." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: "New passwords do not match." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(token.id);
    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 });
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
    }

    user.password = newPassword;
    await user.save();
    return NextResponse.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("PATCH /api/auth/password error:", error);
    return NextResponse.json({ success: false, message: "Could not change your password." }, { status: 500 });
  }
}
