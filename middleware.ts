import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const publicRoutes = ["/login", "/register"];

  // Allow public routes (No redirect)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirect if not authenticated
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
