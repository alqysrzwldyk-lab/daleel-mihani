import { connectDB } from "@/lib/mongodb";
import { Company, type ICompany } from "@/models/Company";

// إرجاع حساب الشركة المرتبط بمستخدم صاحب الشركة أو null إذا لم يوجد
export async function getCompanyForUser(userId: string): Promise<ICompany | null> {
  await connectDB();
  return Company.findOne({ userId });
}

// إنشاء حساب شركة تلقائياً (Lazy) عند أول استخدام لصاحب الشركة، مع مزامنة الاسم والشعار
export async function getOrCreateCompanyForUser(
  userId: string,
  companyName?: string,
  logo?: string
): Promise<ICompany> {
  await connectDB();
  let company = await Company.findOne({ userId });

  if (!company) {
    company = await Company.create({
      userId,
      name: companyName?.trim() || "شركة غير محددة",
      logo: logo || undefined,
    });
  } else if (companyName?.trim() && company.name !== companyName.trim()) {
    company.name = companyName.trim();
    if (logo) company.logo = logo;
    await company.save();
  } else if (logo && company.logo !== logo) {
    company.logo = logo;
    await company.save();
  }

  return company;
}
