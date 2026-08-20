import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminFromRequest, logAdminAction } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Ad } from "@/models/Ad";

export const dynamic = "force-dynamic";

const AD_STATUSES = ["active", "paused", "sold", "reserved", "expired", "coming_soon", "archived"];

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
    const ad = await Ad.findById(id);
    if (!ad) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const updated: string[] = [];
    if (typeof body.status === "string") {
      if (!AD_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "invalidStatus" }, { status: 400 });
      }
      if (body.status !== ad.status) {
        ad.status = body.status;
        updated.push(`status:${body.status}`);
      }
    }
    if (typeof body.verified === "boolean" && body.verified !== ad.verified) {
      ad.verified = body.verified;
      updated.push(body.verified ? "verified" : "unverified");
    }

    if (updated.length) {
      await ad.save();
      await logAdminAction({
        admin: auth,
        action: "updateAd",
        resource: "Ad",
        resourceId: id,
        details: { title: ad.title, changes: updated },
        req,
      });
    }

    return NextResponse.json({ ok: true, status: ad.status, verified: ad.verified });
  } catch (error) {
    console.error("Admin ad update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
