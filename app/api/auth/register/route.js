import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createSignupVerification } from "@/lib/signupOtp";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 400 }
      );
    }

    await createSignupVerification({
      name: name.trim(),
      email: normalizedEmail,
      password,
      isAdmin: false,
    });

    return NextResponse.json(
      { success: true, message: "A verification code was sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register account" },
      { status: 500 }
    );
  }
}
