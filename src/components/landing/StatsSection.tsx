"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Building2, Briefcase, Star } from "lucide-react";
import { useT } from "@/lib/useT";

const stats = [
  { icon: Users, label: "محترف", value: 10000, suffix: "+" },
  { icon: Building2, label: "شركة", value: 250, suffix: "+" },
  { icon: Briefcase, label: "مهنة", value: 150, suffix: "+" },
  { icon: Star, label: "خدمة مكتملة", value: 5000, suffix: "+" },
];

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 1500;
          const steps = 40;
          const increment = Math.ceil(target / steps);
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="text-3xl md:text-4xl font-extrabold">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const T = useT();
  return (
    <section className="py-16 md:py-20 relative">
      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 md:p-8 rounded-2xl bg-[var(--card)] border border-[var(--border-light)] shadow-sm hover:shadow-md transition-shadow">
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              <p className="text-muted text-sm mt-1">{T(stat.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}