import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateToken } from "@/lib/jwt";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.isBlocked || !(await user.matchPassword(password))) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await generateToken(user._id.toString(), user.email, user.isAdmin);
    const response = NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });

    response.cookies.set("auth_token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set("admin-auth", user.isAdmin ? "true" : "false", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("User login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication service error." },
      { status: 500 }
    );
  }
}
