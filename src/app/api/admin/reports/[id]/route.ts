import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminFromRequest, logAdminAction } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { AdReport } from "@/models/AdReport";
import { UserReport } from "@/models/UserReport";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalidId" }, { status: 400 });
  }
  const type = req.nextUrl.searchParams.get("type") === "user" ? "user" : "ad";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "pending" && status !== "reviewed" && status !== "removed") {
    return NextResponse.json({ error: "invalidStatus" }, { status: 400 });
  }

  try {
    await connectDB();
    const Model = type === "user" ? UserReport : AdReport;
    const report = await Model.findById(id).lean() as unknown as {
      _id: unknown;
      reason: string;
      status: string;
    } | null;
    if (!report) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const updateResult = await Model.updateOne(
      { _id: id },
      { $set: { status } }
    );
    if (!updateResult.matchedCount) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    await logAdminAction({
      admin: auth,
      action: `report:${status}`,
      resource: type === "user" ? "UserReport" : "AdReport",
      resourceId: id,
      details: { reason: report.reason },
      req,
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Admin report update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
