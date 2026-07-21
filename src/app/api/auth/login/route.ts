import { NextResponse } from "next/server";
import { users } from "@/lib/data";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken({
    id: user.id,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({ success: true, name: user.name, role: user.role });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}

export async function GET() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("token");
  return response;
}
