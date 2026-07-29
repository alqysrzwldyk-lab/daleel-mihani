import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const COOKIE_NAME = "daleel_token";

export type AuthPayload = {
  userId: string;
  email: string;
  role: "professional" | "employer";
};

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };
  return { name: COOKIE_NAME, value: token, options: opts };
}

export function attachAuthCookie(response: NextResponse, token: string) {
  const { name, value, options } = setAuthCookie(token);
  response.cookies.set(name, value, options);
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
}

export async function getAuthFromCookies(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getAuthFromRequest(req: NextRequest): AuthPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
