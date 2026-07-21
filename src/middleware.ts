import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

const protectedPaths = ["/dashboard", "/projects", "/attendance", "/team"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/login" || path === "/") return NextResponse.next();

  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const cookie = request.cookies.get("token")?.value;
  if (!cookie) return NextResponse.redirect(new URL("/login", request.url));

  const user = await verifyToken(cookie);
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
