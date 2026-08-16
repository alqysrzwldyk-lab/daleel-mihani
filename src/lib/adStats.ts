import { AdDailyStat } from "@/models/AdDailyStat";

export type AdStatMetric = "views" | "contacts" | "shares" | "favorites";

// مفتاح اليوم الحالي بصيغة YYYY-MM-DD (بالتوقيت المحلي للمستخدم بدلاً من UTC)
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// إضافة/خصم قيمة من سجل اليوم للإعلان (إنشاء السجل إن لم يوجد)
// لا يُفشل العملية الرئيسية عند فشل التتبع حتى لا يتأثر المستخدم
export async function incrementAdStat(
  adId: unknown,
  metric: AdStatMetric,
  amount = 1
): Promise<void> {
  try {
    await AdDailyStat.updateOne(
      { adId, date: todayKey() },
      { $inc: { [metric]: amount } },
      { upsert: true }
    );
  } catch {
    // تجاهل فشل التتبع
  }
}
