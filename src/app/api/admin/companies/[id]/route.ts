import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminFromRequest, logAdminAction } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";

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
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    let updated = false;
    if (typeof body.verified === "boolean" && body.verified !== company.verified) {
      company.verified = body.verified;
      updated = true;
    }

    if (updated) {
      await company.save();
      await logAdminAction({
        admin: auth,
        action: company.verified ? "verifyCompany" : "unverifyCompany",
        resource: "Company",
        resourceId: id,
        details: { name: company.name },
        req,
      });
    }

    return NextResponse.json({ ok: true, verified: company.verified });
  } catch (error) {
    console.error("Admin company update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
