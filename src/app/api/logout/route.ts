import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Clear the "token" cookie
  // cookies() is async in Next.js 15, so we must await it
  const cookieStore = await cookies();
  cookieStore.delete("token");

  // Redirect to the login page after logout
  const url = request.nextUrl.clone();
  url.pathname = "/login";

  return NextResponse.redirect(url, { status: 303 });
}