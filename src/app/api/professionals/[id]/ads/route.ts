import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { Professional } from "@/models/Professional";
import { Ad } from "@/models/Ad";

export const dynamic = "force-dynamic";

// إعلانات المهني: تظهر للجميع (النشطة فقط)، ولصاحب الملف تظهر جميع إعلاناته
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const professionalId = resolvedParams.id;

    const professional = (await Professional.findById(professionalId)
      .select("userId name")
      .lean()) as unknown as { userId: unknown; name: string } | null;
    if (!professional) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const auth = getAuthFromRequest(req);
    const isOwner = auth?.userId && String(professional.userId) === String(auth.userId);

    const query = isOwner
      ? { userId: professional.userId }
      : { userId: professional.userId, status: "active" };

    const ads = await Ad.find(query).sort({ createdAt: -1 }).limit(30);

    return NextResponse.json({ success: true, ads }, { status: 200 });
  } catch (error) {
    console.error("Professional ads error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
