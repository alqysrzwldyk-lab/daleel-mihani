import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminFromRequest, logAdminAction } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Professional } from "@/models/Professional";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalidId" }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  try {
    await connectDB();
    const prof = await Professional.findById(id);
    if (!prof) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const updated: string[] = [];
    if (typeof body.verified === "boolean" && body.verified !== prof.verified) {
      prof.verified = body.verified;
      updated.push(body.verified ? "verified" : "unverified");
    }
    if (typeof body.isActive === "boolean" && body.isActive !== prof.isActive) {
      prof.isActive = body.isActive;
      updated.push(body.isActive ? "activated" : "deactivated");
    }

    if (updated.length) {
      await prof.save();
      await logAdminAction({
        admin: auth,
        action: updated.join("|"),
        resource: "Professional",
        resourceId: id,
        details: { name: prof.name },
        req,
      });
    }

    return NextResponse.json({
      ok: true,
      verified: prof.verified,
      isActive: prof.isActive,
    });
  } catch (error) {
    console.error("Admin professional update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
