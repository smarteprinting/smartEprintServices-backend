import { NextResponse } from "next/server";
import { generateToken, setAuthCookies } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const envAdminUser = process.env.ADMIN_USERNAME || "admin";
    const envAdminPass = process.env.ADMIN_PASSWORD || "admin123";

    // 1. Check default environment admin
    if (
      (username === envAdminUser || username === "admin@smarteprintservices.com") &&
      password === envAdminPass
    ) {
      const token = await generateToken("admin-super", "admin@smarteprintservices.com", true);

      const response = NextResponse.json(
        {
          success: true,
          message: "Admin login successful",
          user: {
            id: "admin-super",
            name: "SmartEprint Admin",
            email: "admin@smarteprintservices.com",
            isAdmin: true,
          },
          token,
        },
        { status: 200 }
      );

      // Set cookie on response
      response.cookies.set("auth_token", token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
      });

      response.cookies.set("admin-auth", "true", {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 2. Check MongoDB users
    try {
      await connectDB();
      const user = await User.findOne({ email: username.toLowerCase().trim() });
      if (user && user.isAdmin && (await user.matchPassword(password))) {
        const token = await generateToken(user._id.toString(), user.email, true);

        const response = NextResponse.json(
          {
            success: true,
            message: "Admin login successful",
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              isAdmin: true,
            },
            token,
          },
          { status: 200 }
        );

        response.cookies.set("auth_token", token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
        });

        response.cookies.set("admin-auth", "true", {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
        });

        return response;
      }
    } catch (dbErr) {
      console.warn("Database lookup fallback during admin login:", dbErr.message);
    }

    return NextResponse.json(
      { success: false, message: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication service error" },
      { status: 500 }
    );
  }
}
