import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminFromRequest, logAdminAction, adminIdEquals } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

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
    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    if (target.role === "admin") {
      return NextResponse.json({ error: "cannotModifyAdmin" }, { status: 400 });
    }

    if (typeof body.status === "string") {
      if (body.status !== "active" && body.status !== "disabled") {
        return NextResponse.json({ error: "invalidStatus" }, { status: 400 });
      }
      if (body.status === "disabled" && adminIdEquals(id, auth.userId)) {
        return NextResponse.json({ error: "cannotDisableSelf" }, { status: 400 });
      }
      target.status = body.status;
    }

    await target.save();

    await logAdminAction({
      admin: auth,
      action: body.status === "disabled" ? "disableUser" : "enableUser",
      resource: "User",
      resourceId: id,
      details: { email: target.email },
      req,
    });

    return NextResponse.json({ ok: true, status: target.status });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
