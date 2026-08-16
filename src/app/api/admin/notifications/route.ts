import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, logAdminAction } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

const TYPES = ["info", "success", "warning", "alert"];

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

  try {
    await connectDB();
    const [total, notifications] = await Promise.all([
      Notification.countDocuments(),
      Notification.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: String(n._id),
        recipientId: String(n.recipientId),
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        link: n.link || null,
        createdAt: n.createdAt,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Admin notifications error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  let body: {
    title?: unknown;
    message?: unknown;
    type?: unknown;
    link?: unknown;
    role?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const type = TYPES.includes(body.type as string) ? (body.type as string) : "info";
  const link = typeof body.link === "string" && body.link.startsWith("/") ? body.link : undefined;
  const role =
    body.role === "professional" || body.role === "employer" || body.role === "admin"
      ? (body.role as string)
      : undefined;

  if (!title || !message) {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  try {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select("_id").lean();
    if (!users.length) {
      return NextResponse.json({ error: "noRecipients" }, { status: 400 });
    }

    const docs = users.map((u) => ({
      recipientId: u._id,
      title: title.slice(0, 200),
      message: message.slice(0, 2000),
      type,
      link,
      isRead: false,
    }));
    await Notification.insertMany(docs);

    await logAdminAction({
      admin: auth,
      action: "broadcastNotification",
      resource: "Notification",
      details: { title, recipients: docs.length, role: role || "all", type },
      req,
    });

    return NextResponse.json({ ok: true, recipients: docs.length });
  } catch (error) {
    console.error("Admin notification broadcast error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
