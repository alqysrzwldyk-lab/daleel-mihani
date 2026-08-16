"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, Users, Eye, UserCheck } from "lucide-react";
import { useT } from "@/lib/useT";
import type { CompanyStats as Stats } from "@/lib/companyTypes";

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

// بطاقات إحصائيات الشركة بأرقام متحركة
export default function CompanyStats({ stats }: { stats: Stats }) {
  const T = useT();
  const jobs = useCountUp(stats.jobsCount);
  const applications = useCountUp(stats.applicationsCount);
  const views = useCountUp(stats.views);
  const hired = useCountUp(stats.hiredCount);

  const items = [
    {
      icon: Briefcase,
      label: "وظيفة مفتوحة",
      value: jobs,
      color: "text-[var(--primary)] bg-[var(--primary)]/10",
    },
    {
      icon: Users,
      label: "متقدم للوظائف",
      value: applications,
      color: "text-[var(--accent)] bg-[var(--accent)]/10",
    },
    {
      icon: Eye,
      label: "مشاهدة الملف",
      value: views,
      color: "text-[var(--warning)] bg-[var(--warning)]/10",
    },
    {
      icon: UserCheck,
      label: "تم توظيفهم",
      value: hired,
      color: "text-[var(--success)] bg-[var(--success)]/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-5 flex items-center gap-4"
        >
          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${item.color}`}>
            <item.icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-[var(--foreground)] tabular-nums">{item.value.toLocaleString("ar-EG")}</p>
            <p className="text-[11px] text-[var(--muted)] font-bold">{T(item.label)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
