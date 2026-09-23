import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const getSecretKey = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "supersecretkey54321_smarteprint");

export async function generateToken(userId, email, isAdmin = false) {
  const secret = getSecretKey();
  const token = await new SignJWT({
    id: String(userId),
    email,
    isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  // Authorization header: Bearer <token>
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Cookie fallback
  const cookieHeader = request.headers.get("cookie") || "";
  const cookiesList = cookieHeader.split(";").map((c) => c.trim());
  const tokenCookie = cookiesList.find((c) => c.startsWith("auth_token="));
  if (tokenCookie) {
    return decodeURIComponent(tokenCookie.split("=")[1]);
  }

  return null;
}

export async function setAuthCookies(token) {
  const cookieStore = cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  cookieStore.set("admin-auth", "true", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function removeAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("admin-auth");
}
