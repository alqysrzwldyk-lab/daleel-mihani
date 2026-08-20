"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  Megaphone,
  FileText,
  Star,
  Flag,
  Bell,
  CreditCard,
  Wallet,
  Crown,
  BarChart3,
  ScrollText,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";

const items = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/professionals", label: "المهنيون", icon: Briefcase },
  { href: "/admin/companies", label: "الشركات", icon: Building2 },
  { href: "/admin/ads", label: "الإعلانات", icon: Megaphone },
  { href: "/admin/jobs", label: "الوظائف", icon: FileText },
  { href: "/admin/ratings", label: "التقييمات", icon: Star },
  { href: "/admin/reports", label: "البلاغات", icon: Flag },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
  { href: "/admin/transactions", label: "المعاملات", icon: CreditCard },
  { href: "/admin/wallet", label: "المحفظة", icon: Wallet },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: Crown },
  { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "سجل التدقيق", icon: ScrollText },
  { href: "/admin/security", label: "مركز الأمان", icon: ShieldCheck },
  { href: "/admin/system", label: "صحة النظام", icon: HeartPulse },
  { href: "/admin/settings/payments", label: "إعدادات الدفع", icon: CreditCard },
];

export default function AdminNav() {
  const T = useT();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <div className="admin-nav">
      <div className="flex items-center gap-2 px-2 pb-2 mb-2 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-extrabold leading-tight">{T("لوحة مدير النظام")}</p>
          <p className="text-[10px] text-muted">{T("إدارة كاملة وآمنة")}</p>
        </div>
      </div>
      <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${active ? "active" : ""}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{T(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
