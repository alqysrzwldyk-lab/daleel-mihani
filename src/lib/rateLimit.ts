// ذكرة مؤقتة لتخزين الـ IPs وعدد طلباتهم
const limiterMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // المدة الزمنية بالميللي ثانية (مثلاً دقيقة)
  maxRequests: number; // أقصى عدد طلبات مسموح به خلال هذه المدة
}

export function isRateLimited(ip: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const userRequests = limiterMap.get(ip);

  // إذا كان المستخدم يرسل لأول مرة أو انتهت المدة الزمنية السابقة
  if (!userRequests || now > userRequests.resetTime) {
    limiterMap.set(ip, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return false;
  }

  // زيادة عدد الطلبات
  userRequests.count += 1;

  // إذا تجاوز الحد المسموح
  if (userRequests.count > options.maxRequests) {
    return true;
  }

  return false;
}