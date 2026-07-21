import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode("pms-secret-key-2026-very-secure");

export async function createToken(payload: { id: string; name: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; name: string; role: string };
  } catch {
    return null;
  }
}

export function getUserFromCookie(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

export async function requireAuth(request: Request) {
  const token = getUserFromCookie(request);
  if (!token) return null;
  return verifyToken(token);
}
