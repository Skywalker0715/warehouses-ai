import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Auth pages (should not be accessed when logged in)
const AUTH_ROUTES = ["/login", "/register"];
// Protected app routes (require authentication)
const PROTECTED_ROUTES_PREFIX = ["/dashboard"];
// Protected API routes (require authentication)
const API_PROTECTED_PREFIX = ["/api/products", "/api/warehouses", "/api/stock"];

const isPathMatch = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix));

const isLoggedIn = (token?: string) => {
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET ?? "");
    return true;
  } catch {
    return false;
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const loggedIn = isLoggedIn(token);

  // If logged in and visiting auth pages, redirect to dashboard
  if (loggedIn && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If not logged in and visiting protected pages, redirect to login
  if (!loggedIn && isPathMatch(pathname, PROTECTED_ROUTES_PREFIX)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If not logged in and visiting protected API routes, return 401 JSON
  if (!loggedIn && isPathMatch(pathname, API_PROTECTED_PREFIX)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Otherwise allow the request
  return NextResponse.next();
}

export const config = {
  matcher:
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
};
