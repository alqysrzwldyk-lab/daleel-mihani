import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuthFromRequest } from "@/lib/auth";

// مسار رفع عام آمن لمكونات نظام التوظيف:
// - logo    : شعار الشركة (صورة، 2MB)
// - banner  : صورة إعلان الوظيفة (صورة، 5MB)
// - photo   : صورة شخصية للمتقدم (صورة، 2MB)
// - cv      : السيرة الذاتية PDF (PDF، 5MB)
// لا يمس المسار الحالي /api/upload الخاص بصور ملفات المهنيين إطلاقاً

const KIND_RULES: Record<
  string,
  { maxBytes: number; accept: (type: string) => boolean; ext: string }
> = {
  logo: { maxBytes: 2 * 1024 * 1024, accept: (t) => t.startsWith("image/"), ext: "jpg" },
  banner: { maxBytes: 5 * 1024 * 1024, accept: (t) => t.startsWith("image/"), ext: "jpg" },
  photo: { maxBytes: 2 * 1024 * 1024, accept: (t) => t.startsWith("image/"), ext: "jpg" },
  cv: {
    maxBytes: 5 * 1024 * 1024,
    accept: (t) => t === "application/pdf",
    ext: "pdf",
  },
};

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kind = (formData.get("kind") as string | null) || "photo";

    const rules = KIND_RULES[kind];
    if (!file) {
      return NextResponse.json({ error: "noFile" }, { status: 400 });
    }
    if (!rules) {
      return NextResponse.json({ error: "invalidKind" }, { status: 400 });
    }
    if (!rules.accept(file.type)) {
      return NextResponse.json({ error: "invalidType" }, { status: 400 });
    }
    if (file.size > rules.maxBytes) {
      return NextResponse.json({ error: "tooLarge" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalExt = (file.name.split(".").pop() || "").toLowerCase();
    const ext =
      rules.ext === "pdf" ? "pdf" : originalExt && originalExt.length <= 5 ? originalExt : "jpg";
    const filename = `${auth.userId}-${kind}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", kind);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${kind}/${filename}` });
  } catch (error) {
    console.error("Asset upload error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
