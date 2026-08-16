"use client";

import { Link } from "@/i18n/navigation";
import {
  Users, Megaphone, GraduationCap, Star, Briefcase,
  Award, Building2, ClipboardList, PlusCircle, FileText
} from "lucide-react";
import { useT } from "@/lib/useT";

const cards = [
  {
    href: "/search",
    icon: Users,
    color: "purple",
    title: "المهنيون",
    desc: "تصفح جميع المهنيين",
  },
  {
    href: "/ads",
    icon: Megaphone,
    color: "orange",
    title: "الإعلانات",
    desc: "تصفح جميع الإعلانات",
  },
  {
    href: "/search",
    icon: GraduationCap,
    color: "green",
    title: "التخصصات المهنية",
    desc: "تصفح حسب التخصص والمهنة",
  },
  {
    href: "/#success-stories",
    icon: Award,
    color: "rose",
    title: "قصص نجاح",
    desc: "تعرف على تجارب المستخدمين",
  },
  {
    href: "/search",
    icon: Star,
    color: "blue",
    title: "الأعلى تقييماً",
    desc: "أفضل المهنيين بتقييمات العملاء",
  },
  {
    href: "/register?role=professional",
    icon: Briefcase,
    color: "teal",
    title: "انضم كمحترف",
    desc: "أنشئ ملفك المهني الآن",
  },
  {
    href: "/jobs",
    icon: ClipboardList,
    color: "violet",
    title: "إعلانات التوظيف",
    desc: "ابحث عن وظيفة تناسبك",
  },
  {
    href: "/my-applications",
    icon: FileText,
    color: "green",
    title: "طلباتي",
    desc: "تابع حالة طلبات التوظيف",
  },
  {
    href: "/dashboard/jobs",
    icon: Building2,
    color: "blue",
    title: "لوحة الشركة",
    desc: "إدارة إعلاناتك الوظيفية",
  },
  {
    href: "/dashboard/jobs/new",
    icon: PlusCircle,
    color: "amber",
    title: "إعلان توظيف جديد",
    desc: "انشر فرصة عمل جديدة",
  },
];

export default function QuickAccess() {
  const T = useT();
  return (
    <section className="quick-access">
      <div className="page-container">
        <div className="quick-access-inner">
          {cards.map((card) => {
            const isHash = card.href.startsWith("/#");
            const Content = (
              <>
                <div className={`quick-card-icon quick-card-icon-${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="quick-card-title">{T(card.title)}</div>
                <div className="quick-card-desc">{T(card.desc)}</div>
              </>
            );
            if (isHash) {
              return (
                <a key={card.title} href={card.href} className="quick-card">
                  {Content}
                </a>
              );
            }
            return (
              <Link key={card.title} href={card.href} className="quick-card">
                {Content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
