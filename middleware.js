import { NextResponse } from "next/server";

const allowedOrigins = (process.env.CORS_ORIGINS ||
  "https://smarteprintservices.com,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const isApiRequest = pathname.startsWith("/api/");
  const origin = request.headers.get("origin");
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  if (isApiRequest && request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    applyCorsHeaders(response, origin, isAllowedOrigin);
    return response;
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname === "/admin/signup";

  if (isAdminRoute && !isPublicAdminRoute) {
    const token = request.cookies.get("auth_token")?.value;
    const adminFlag = request.cookies.get("admin-auth")?.value;

    if (!token || adminFlag !== "true") {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname !== "/admin/dashboard" && pathname !== "/admin") {
      const dashboardUrl = new URL("/admin/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (isApiRequest) {
    applyCorsHeaders(response, origin, isAllowedOrigin);
  }

  return response;
}

function applyCorsHeaders(response, origin, isAllowedOrigin) {
  if (!isAllowedOrigin) return;

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set("Vary", "Origin");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
