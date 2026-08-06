import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { Company } from "@/models/Company";
import { getOrCreateCompanyForUser } from "@/lib/company";

export const dynamic = "force-dynamic";

const companySchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name").optional(),
  logo: z.string().optional(),
  cover: z.string().optional(),
  tagline: z.string().trim().max(300).optional(),
  industry: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  mission: z.string().trim().max(2000).optional(),
  vision: z.string().trim().max(2000).optional(),
  values: z.array(z.string().trim().max(80)).max(20).optional(),
  specializations: z.array(z.string().trim().max(80)).max(30).optional(),
  businessActivities: z.array(z.string().trim().max(120)).max(30).optional(),
  services: z.array(z.string().trim().max(120)).max(30).optional(),
  foundedYear: z.number().min(1500).max(new Date().getFullYear()).optional(),
  employeesCount: z.number().int().min(1).max(1000000).optional(),
  companySize: z.string().trim().max(40).optional(),
  website: z.string().trim().max(200).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  address: z.string().trim().max(300).optional(),
  workingHours: z.string().trim().max(200).optional(),
  gallery: z.array(z.string()).max(12).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  social: z
    .object({
      facebook: z.string().trim().max(200).optional(),
      instagram: z.string().trim().max(200).optional(),
      linkedin: z.string().trim().max(200).optional(),
      whatsapp: z.string().trim().max(200).optional(),
      telegram: z.string().trim().max(200).optional(),
      twitter: z.string().trim().max(200).optional(),
    })
    .optional(),
});

// تحديث ملف الشركة المرتبط بمستخدم صاحب الشركة
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 });
    }
    if (auth.role !== "employer") {
      return NextResponse.json({ error: "حسابات الشركات فقط يمكنها تعديل الملف" }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();
    const data = companySchema.parse(body);

    const company = await getOrCreateCompanyForUser(auth.userId, data.name);

    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      const value = data[key];
      if (value === undefined) continue;
      if (key === "name" && value && company.name !== value) {
        updates.name = value;
      } else if (key !== "name") {
        updates[key] = value === "" ? undefined : value;
      }
    }
    updates.social = data.social || {};

    const updated = await Company.findByIdAndUpdate(
      company._id,
      { $set: updates },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, company: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", field: error.issues[0]?.path?.[0] || "generic" }, { status: 400 });
    }
    console.error("Company update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
