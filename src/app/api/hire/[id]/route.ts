import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { HireRequest } from "@/models/HireRequest";
import { User } from "@/models/User";
import { Conversation } from "@/models/Conversation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const hire = await HireRequest.findById(id);
    if (!hire) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const isEmployer = String(hire.employerId) === String(auth.userId);
    const isProfessional = String(hire.professionalId) === String(auth.userId);
    if (!isEmployer && !isProfessional) {
      return NextResponse.json({ error: "لا يمكنك الوصول إلى هذا الطلب" }, { status: 403 });
    }

    const [employer, professional] = await Promise.all([
      User.findById(hire.employerId).select("name email role avatar"),
      User.findById(hire.professionalId).select("name email role avatar"),
    ]);

    let conversationId: string | null = null;
    if (hire.status === "accepted") {
      const conv = await Conversation.findOne({
        participants: { $all: [hire.employerId, hire.professionalId], $size: 2 },
      });
      conversationId = conv ? String(conv._id) : null;
    }

    return NextResponse.json({
      success: true,
      hire: {
        _id: String(hire._id),
        companyName: hire.companyName,
        title: hire.title,
        message: hire.message,
        status: hire.status,
        createdAt: hire.createdAt,
        employer: employer
          ? { _id: String(employer._id), name: employer.name, email: employer.email }
          : null,
        professional: professional
          ? { _id: String(professional._id), name: professional.name, email: professional.email }
          : null,
        conversationId,
      },
    });
  } catch (error) {
    console.error("Hire detail error:", error);
    return NextResponse.json({ error: "حدث خطأ ما" }, { status: 500 });
  }
}
