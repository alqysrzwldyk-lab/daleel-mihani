"use client";

import { Link } from "@/i18n/navigation";
import {
  Users, Megaphone, GraduationCap, Star, Briefcase, Building2,
  Award, Newspaper, UserCheck, MessageSquare
} from "lucide-react";

const cards = [
  {
    href: "/search",
    icon: Users,
    color: "purple",
    title: "المهنيون",
    desc: "تصفح جميع المهنيين والحرفيين",
  },
  {
    href: "/search?type=ad",
    icon: Megaphone,
    color: "orange",
    title: "الإعلانات",
    desc: "أحدث الإعلانات والعروض",
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
];

export default function QuickAccess() {
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
                <div className="quick-card-title">{card.title}</div>
                <div className="quick-card-desc">{card.desc}</div>
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
