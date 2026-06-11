import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const state = mongoose.connection.readyState;
    const states = ["غير متصل", "متصل", "جاري الاتصال", "جاري الإغلاق"];

    return NextResponse.json({
      status: "ok",
      database: {
        connected: state === 1,
        state: states[state] || "غير معروف",
        name: mongoose.connection.name,
        host: mongoose.connection.host,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: {
          connected: false,
          message: error instanceof Error ? error.message : "فشل الاتصال بقاعدة البيانات",
        },
      },
      { status: 503 }
    );
  }
}
