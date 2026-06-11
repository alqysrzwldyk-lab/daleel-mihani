import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ user: null });
    }

    await connectDB();
    const user = await User.findById(auth.userId).select("-password");
    if (!user) {
      return NextResponse.json({ user: null });
    }

    type ProfileType = { _id?: { toString: () => string } | string; password?: string } & Record<string, unknown>;

    let profile: ProfileType | null = null;

    // إذا كان المستخدم محترف، نجلب بياناته من موديل المحترفين (lean للحصول على كائن عادي)
    if (user.role === "professional") {
      profile = (await Professional.findOne({ userId: user._id }).lean()) as ProfileType | null;
    }
    // إذا كان المستخدم شركة، نجلب بياناته من موديل المستخدم نفسه
    else if (user.role === "company") {
      profile = user.toObject();
    }

    // إزالة أي حقول حساسة إن وجدت
    if (profile && profile.password) {
      delete profile.password;
    }

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const profilePayload = profile
      ? {
          id: profile._id ? profile._id.toString() : undefined,
          ...profile,
        }
      : null;

    return NextResponse.json({ user: userPayload, profile: profilePayload });
  } catch (err) {
    console.error("/api/auth/me error:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}