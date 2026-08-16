"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/useT";

const professions = [
  { icon: "👨‍⚕️", name: "أطباء", slug: "doctor" },
  { icon: "⚙️", name: "مهندسون", slug: "engineer" },
  { icon: "👨‍🏫", name: "معلمون", slug: "teacher" },
  { icon: "👨‍🎓", name: "طلاب", slug: "student" },
  { icon: "👷", name: "حرفيون", slug: "craftsman" },
  { icon: "⚡", name: "كهربائيون", slug: "electrician" },
  { icon: "🔧", name: "سباكون", slug: "plumber" },
  { icon: "🔩", name: "ميكانيكيون", slug: "mechanic" },
  { icon: "⚖️", name: "محامون", slug: "lawyer" },
  { icon: "🎨", name: "مصممون", slug: "designer" },
  { icon: "💻", name: "مبرمجون", slug: "programmer" },
  { icon: "📷", name: "مصورون", slug: "photographer" },
  { icon: "🏢", name: "شركات", slug: "company" },
  { icon: "👨‍🍳", name: "طهاة", slug: "chef" },
  { icon: "🛠", name: "فنيون", slug: "technician" },
  { icon: "📊", name: "محاسبون", slug: "accountant" },
];

export default function ProfessionsGrid() {
  const T = useT();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-[var(--surface)]" ref={ref}>
      <div className="page-container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">{T("جميع التخصصات المهنية")}</h2>
          <p className="text-muted max-w-xl mx-auto">{T("الدليل المهني يرحب بجميع المهن والتخصصات بدون استثناء")}</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 md:gap-3">
          {professions.map((prof, i) => (
            <Link
              key={prof.slug}
              href={`/search?profession=${prof.slug}`}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--border-light)] bg-[var(--card)] hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-500 ${
                visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <span className="text-2xl md:text-3xl mb-2">{prof.icon}</span>
              <span className="text-xs font-semibold text-center">{T(prof.name)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}