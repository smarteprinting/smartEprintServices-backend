import { NextResponse } from "next/server";
import { generateToken } from "@/lib/jwt";
import User from "@/lib/models/User";
import { verifySignupCode } from "@/lib/signupOtp";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const normalizedOtp = typeof otp === "string" ? otp.trim() : "";

    if (!normalizedEmail || !/^\d{6}$/.test(normalizedOtp)) {
      return NextResponse.json(
        { success: false, message: "Enter the six-digit verification code." },
        { status: 400 }
      );
    }

    const result = await verifySignupCode(normalizedEmail, normalizedOtp);
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    const { pending } = result;
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    await User.collection.insertOne({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      isAdmin: pending.isAdmin,
      isBlocked: false,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await pending.deleteOne();
    const user = await User.findOne({ email: normalizedEmail });
    const token = await generateToken(user._id.toString(), user.email, user.isAdmin);
    const response = NextResponse.json(
      {
        success: true,
        message: "Account verified successfully.",
        user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      },
      { status: 201 }
    );

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
    console.error("Signup verification error:", error);
    return NextResponse.json(
      { success: false, message: "Could not verify the account. Please try again." },
      { status: 500 }
    );
  }
}
