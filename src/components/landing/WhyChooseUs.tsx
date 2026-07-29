"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, BadgeCheck, Search, MessageCircle, UserCheck, Lock } from "lucide-react";

const reasons = [
  { icon: BadgeCheck, title: "ملفات موثقة", desc: "جميع الحسابات المهنية موثقة لضمان المصداقية والجودة" },
  { icon: Search, title: "بحث سهل وسريع", desc: "تصفح آلاف المهنيين وابحث حسب التخصص والموقع والتقييم" },
  { icon: MessageCircle, title: "تواصل مباشر", desc: "تواصل مع المهنيين وأصحاب العمل بسهولة عبر المنصة" },
  { icon: UserCheck, title: "هوية مهنية متكاملة", desc: "بناء هوية مهنية رقمية تعكس خبراتك ومهاراتك" },
  { icon: Lock, title: "منصة آمنة", desc: "بيئة آمنة وموثوقة للتواصل والتعامل بين جميع الأطراف" },
  { icon: ShieldCheck, title: "دعم فني متواصل", desc: "فريق دعم جاهز لمساعدتك في أي وقت" },
];

export default function WhyChooseUs() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white" ref={ref}>
      <div className="page-container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">لماذا الدليل المهني؟</h2>
          <p className="text-muted max-w-xl mx-auto">نوفر لك كل الأدوات التي تحتاجها لبناء مسيرتك المهنية</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              className={`flex gap-4 p-5 rounded-xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-md transition-all duration-500 ${
                visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <r.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">{r.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}