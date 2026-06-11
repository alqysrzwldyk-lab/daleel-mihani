import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً لإضافة إعلان" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { type, category, title, description, price, location, specifications, images } = body;

    // التحقق من الحقول الأساسية
    if (!type || !category || !title || !description || !location) {
      return NextResponse.json({ error: "جميع الحقول الأساسية مطلوبة" }, { status: 400 });
    }

    // إنشاء الإعلان وحفظه في محفظة المستخدم
    const newAd = await Ad.create({
      userId: new mongoose.Types.ObjectId(auth.userId),
      type,
      category,
      title,
      description,
      price: price ? Number(price) : null,
      location,
      specifications: specifications || {},
      images: images || [],
    });

    return NextResponse.json({ success: true, message: "تم نشر إعلانك بنجاح وحفظه في محفظتك!", ad: newAd }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الإعلان";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// مسار GET إضافي لجلب إعلانات المستخدم الحالي فقط (المحفظة الخاصة)
export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }

    await connectDB();
    const userAds = await Ad.find({ userId: new mongoose.Types.ObjectId(auth.userId) }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, ads: userAds }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "فشل جلب الإعلانات من المحفظة" }, { status: 500 });
  }
}