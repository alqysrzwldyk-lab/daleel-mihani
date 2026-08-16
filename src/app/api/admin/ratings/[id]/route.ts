import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminFromRequest, logAdminAction } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Rating } from "@/models/Rating";
import { CompanyRating } from "@/models/CompanyRating";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalidId" }, { status: 400 });
  }
  const type = req.nextUrl.searchParams.get("type") === "company" ? "company" : "professional";

  try {
    await connectDB();
    const Model = type === "company" ? CompanyRating : Rating;
    const removed = await Model.findByIdAndDelete(id);
    if (!removed) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    await logAdminAction({
      admin: auth,
      action: "deleteRating",
      resource: type === "company" ? "CompanyRating" : "Rating",
      resourceId: id,
      details: { score: type === "company" ? (removed as unknown as { rating: number }).rating : (removed as unknown as { score: number }).score },
      req,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin rating delete error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
