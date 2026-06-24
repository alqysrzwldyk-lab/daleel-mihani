import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuthFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "professional") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "noFile" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "invalidType" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "tooLarge" }, { status: 400 });
    }

    // استخراج الامتداد وإنشاء اسم فريد للملف بناءً على معرف المستخدم والوقت
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${auth.userId}-${Date.now()}.${ext}`;

    // الرفع المباشر إلى مخزن فيرسل بدلاً من الحفظ المحلي المقيد
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
    });

    // إرجاع الرابط السحابي الجديد ليعمل تلقائياً مع واجهتك الأمامية وقاعدة البيانات
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}