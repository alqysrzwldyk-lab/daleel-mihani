import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signToken, attachAuthCookie } from "@/lib/auth";
import { loginSchema, validationMessageKey } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit"; // 💡 استيراد نظام الحماية

const ip = (req: NextRequest) =>
  req.headers.get("x-forwarded-for") || "127.0.0.1";

export async function POST(req: NextRequest) {
  try {
    // 1. استقبال وتحليل البيانات المرسلة
    const body = await req.json();
    const data = loginSchema.parse(body);

    await connectDB();

    // 2. البحث عن المستخدم في قاعدة البيانات
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      if (isRateLimited(ip(req), { windowMs: 60 * 1000, maxRequests: 5 })) {
        return NextResponse.json({ error: "tooManyAttempts" }, { status: 429 });
      }
      return NextResponse.json({ error: "invalidCredentials" }, { status: 401 });
    }

    // 3. مطابقة كلمة المرور المشفرة
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      if (isRateLimited(ip(req), { windowMs: 60 * 1000, maxRequests: 5 })) {
        return NextResponse.json({ error: "tooManyAttempts" }, { status: 429 });
      }
      return NextResponse.json({ error: "invalidCredentials" }, { status: 401 });
    }

    // 3.1 منع دخول الحسابات المعطّلة من الإدارة
    if (user.status === "disabled") {
      return NextResponse.json({ error: "accountDisabled" }, { status: 403 });
    }

    // 4. إنشاء الـ Token وحفظه في الكوكيز الآمنة
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // 5. 💡 إنشاء الاستجابة مع الكوكي وترويسات تمنع الكاش
    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    attachAuthCookie(response, token);
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;

  } catch (error) {
    // التعامل مع أخطاء التحقق المدخلات (Zod)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "validation", field: validationMessageKey(error) },
        { status: 400 }
      );
    }

    // التعامل مع حالات انقطاع قاعدة البيانات المفاجئة
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("ECONNREFUSED") ||
      message.includes("connect") ||
      message.includes("MongoServerSelectionError")
    ) {
      return NextResponse.json({ error: "databaseUnavailable" }, { status: 503 });
    }

    console.error("Login error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}