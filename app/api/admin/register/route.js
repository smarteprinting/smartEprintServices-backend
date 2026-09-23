import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createSignupVerification } from "@/lib/signupOtp";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!name?.trim() || !normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectDB();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    await createSignupVerification({
      name: name.trim(),
      email: normalizedEmail,
      password,
      isAdmin: true,
    });

    return NextResponse.json(
      { success: true, message: "A verification code was sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin signup request error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Could not send verification code." },
      { status: 500 }
    );
  }
}
