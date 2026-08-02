import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";

export async function GET(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim()?.toLowerCase();
    const role = searchParams.get("role")?.trim();

    const nameFilter = q
      ? { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
      : {};

    const professionals = await Professional.find({
      ...nameFilter,
      isActive: true,
    })
      .select("userId name professions location photo")
      .sort({ averageRating: -1 })
      .limit(50)
      .lean();

    const profUserIds = professionals.map((p) => p.userId);

    const employerFilter: Record<string, unknown> = {
      role: "employer",
      _id: { $nin: profUserIds },
    };
    if (q) employerFilter.name = { $regex: q, $options: "i" };

    const employers = await User.find(employerFilter)
      .select("name email role avatar")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const professionalUsers = await User.find({
      _id: { $in: profUserIds },
    })
      .select("name email role avatar")
      .lean();

    const userMap = new Map(
      professionalUsers.map((u) => [String(u._id), u])
    );

    const profList = professionals
      .filter((p) => {
        const u = userMap.get(String(p.userId));
        return u && String(u._id) !== String(auth.userId);
      })
      .map((p) => {
        const u = userMap.get(String(p.userId))!;
        return {
          _id: String(u._id),
          name: u.name,
          role: "professional",
          avatar: u.avatar || null,
          profession: p.professions?.[0] || "other",
          location: p.location || null,
          refType: "professional",
          refId: String(p._id),
        };
      });

    const employerList = employers
      .filter((u) => String(u._id) !== String(auth.userId))
      .map((u) => ({
        _id: String(u._id),
        name: u.name,
        role: "employer",
        avatar: u.avatar || null,
        profession: null,
        location: null,
        refType: null,
        refId: null,
      }));

    let users = [...profList, ...employerList];

    if (role === "professional") {
      users = users.filter((u) => u.role === "professional");
    } else if (role === "employer") {
      users = users.filter((u) => u.role === "employer");
    }

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Messages users error:", error);
    return NextResponse.json({ error: "فشل جلب المستخدمين" }, { status: 500 });
  }
}
