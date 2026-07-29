"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus, Edit3, Eye, Briefcase } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "أنشئ حساباً", desc: "سجل بسهولة عبر بريدك الإلكتروني أو عبر Google" },
  { icon: Edit3, title: "أكمل ملفك المهني", desc: "أضف مهاراتك، شهاداتك، خبراتك، وأعمالك السابقة" },
  { icon: Eye, title: "اعرض مهاراتك", desc: "ظهور ملفك للآلاف من أصحاب العمل والعملاء المحتملين" },
  { icon: Briefcase, title: "احصل على الفرص", desc: "استقبل عروض العمل والمشاريع المناسبة لتخصصك" },
];

export default function HowItWorks() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-20" ref={ref}>
      <div className="page-container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">كيف يعمل الدليل المهني؟</h2>
          <p className="text-muted max-w-xl mx-auto">أربع خطوات بسيطة لبدء رحلتك المهنية</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`text-center relative transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 relative z-10 border-2 border-white shadow-md">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16">
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-1">{step.title}</h3>
              <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}