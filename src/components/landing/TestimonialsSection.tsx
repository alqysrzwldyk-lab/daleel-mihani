"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "أحمد محمد",
    role: "مهندس معماري",
    avatar: "AM",
    color: "bg-blue-500",
    text: "منصة رائعة! خلال شهر واحد فقط حصلت على أكثر من 20 عميلاً. ساعدتني في بناء هويتي المهنية وعرض أعمالي بشكل احترافي.",
    rating: 5,
  },
  {
    name: "سارة عبدالله",
    role: "مصممة جرافيك",
    avatar: "س",
    color: "bg-purple-500",
    text: "الدليل المهني غير مسيرتي المهنية تماماً. وجدت أول وظيفة لي من خلال المنصة والآن لدي عملاء مستمرون.",
    rating: 5,
  },
  {
    name: "خالد العنزي",
    role: "صاحب شركة مقاولات",
    avatar: "خ",
    color: "bg-emerald-500",
    text: "تمكنت شركتنا من توظيف مهندسين وفنيين متميزين في وقت قياسي. التقييمات الموثوقة ساعدتنا في اختيار أفضل الكفاءات.",
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
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
    <section id="success-stories" className="py-16 md:py-20" ref={ref}>
      <div className="page-container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">قصص نجاح</h2>
          <p className="text-muted max-w-xl mx-auto">ماذا يقول المستخدمون عن الدليل المهني؟</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <Stars count={t.rating} />
              <p className="text-sm text-gray-600 mt-3 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-muted text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}