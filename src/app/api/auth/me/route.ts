import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";

export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth) {
    return NextResponse.json({ user: null });
  }

  await connectDB();
  const user = await User.findById(auth.userId).select("-password");
  if (!user) {
    return NextResponse.json({ user: null });
  }

  let profile = null;
  
  // إذا كان المستخدم "محترف"، نجلب بياناته من موديل المحترفين
  if (user.role === "professional") {
    profile = await Professional.findOne({ userId: user._id });
  } 
  // إذا كان "شركة"، البيانات موجودة في نفس موديل User (أو أنك لا تحتاج لجلب موديل إضافي)
  else if (user.role === "company") {
    profile = user; // نستخدم بيانات المستخدم كأنها ملف تعريف للشركة
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    profile: profile
      ? {
          id: profile._id.toString(),
          ...profile.toObject(),
        }
      : null,
  });
}