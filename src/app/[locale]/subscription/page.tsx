"use client";

import { useEffect, useState } from "react";
import { Star, Check, X as XIcon, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

const PLANS = [
  {
    id: "free",
    name: "مجاني",
    price: 0,
    color: "gray",
    features: [
      "ملف شخصي أساسي",
      "ظهور في نتائج البحث",
      "إعلان واحد مجاني",
    ],
  },
  {
    id: "premium",
    name: "بريميوم",
    price: 5000,
    color: "amber",
    popular: true,
    features: [
      "شارة موثق ✓",
      "أولوية الظهور في البحث",
      "ظهور في الصفحة الرئيسية",
      "إعلانات غير محدودة",
      "تعزيز إعلان مجاني كل شهر",
      "دعم فني مخصص",
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => {
        if (d.subscription) {
          setCurrent(d.subscription.plan || "free");
          if (d.subscription.endDate) {
            setEndDate(new Date(d.subscription.endDate).toLocaleDateString("ar"));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubscribe(plan: string) {
    if (plan === "free") return;
    setSubscribing(true);
    setMessage("");
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("تم تفعيل الباقة المميزة بنجاح!");
        setCurrent("premium");
      } else {
        setMessage(data.error || "حدث خطأ");
      }
    } catch {
      setMessage("فشل الاتصال");
    }
    setSubscribing(false);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Star className="w-6 h-6 text-amber-500" />
        <h1>الباقة المميزة</h1>
      </div>

      {current === "premium" && (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 fill-white" />
            <span className="font-extrabold">أنت مشترك في الباقة المميزة</span>
          </div>
          {endDate && <p className="text-amber-100 text-sm">تنتهي في: {endDate}</p>}
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl mb-4 text-sm font-bold ${
          message.includes("نجاح") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = current === plan.id;
          const isPremium = plan.id === "premium";
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 p-6 relative ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : plan.popular
                  ? "border-amber-200 bg-[var(--card)]"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-4 py-1 rounded-full">
                  الأكثر طلباً
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-full">
                  {isPremium ? "مشترك الآن" : "الحالية"}
                </div>
              )}

              <h3 className="text-xl font-extrabold mb-1">{plan.name}</h3>
              <p className="text-3xl font-extrabold mb-4">
                {plan.price === 0 ? "مجاني" : `${plan.price.toLocaleString()} ﷼`}
                {plan.price > 0 && <span className="text-sm font-normal text-muted"> / شهرياً</span>}
              </p>

              <div className="flex flex-col gap-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || subscribing}
                className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                isCurrent
                  ? "bg-[var(--border-light)] text-[var(--muted-light)] cursor-default"
                  : isPremium
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200"
                  : "bg-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--border)]"
                }`}
              >
                {subscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : isCurrent ? (
                  "مشترك حالياً"
                ) : (
                  `اشترك الآن ${plan.price > 0 ? `- ${plan.price.toLocaleString()} ﷼` : ""}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-gray-50 rounded-2xl p-5">
        <h3 className="font-extrabold mb-2">مزايا الباقة المميزة</h3>
        <ul className="text-sm text-muted space-y-2">
          <li>• شارة "موثق" تظهر بجانب اسمك في كل مكان</li>
          <li>• أولوية الظهور في نتائج البحث عن المهنيين</li>
          <li>• ظهور ملفك في قسم "مميز" بالصفحة الرئيسية</li>
          <li>• إعلانات غير محدودة</li>
          <li>• تعزيز إعلان مجاني كل شهر</li>
          <li>• دعم فني مخصص وأولوية في المعالجة</li>
        </ul>
      </div>
    </div>
  );
}
