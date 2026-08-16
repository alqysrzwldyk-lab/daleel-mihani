import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAdminFromRequest } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  let dbStatus: "connected" | "disconnected" | "unavailable" = "unavailable";
  let dbError: string | null = null;
  try {
    await connectDB();
    dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  } catch (error) {
    dbStatus = "disconnected";
    dbError = error instanceof Error ? error.message.slice(0, 120) : "unknown";
  }

  let appVersion = "unknown";
  try {
    const pkg = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "package.json"), "utf8")
    ) as { version?: string };
    appVersion = pkg.version || "unknown";
  } catch {
    // تجاهل — الإصدار غير متاح
  }

  return NextResponse.json({
    database: { status: dbStatus, error: dbError },
    api: { status: "ok" },
    environment: process.env.NODE_ENV || "development",
    appVersion,
    nodeVersion: process.version,
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}
