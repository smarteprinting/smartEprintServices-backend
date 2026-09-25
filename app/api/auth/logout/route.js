import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieOptions = {
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  response.cookies.set("auth_token", "", { ...cookieOptions, httpOnly: true });
  response.cookies.set("admin-auth", "", { ...cookieOptions, httpOnly: true });
  return response;
}
