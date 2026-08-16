"use client";

import { useFetch } from "./_components/useFetch";
import { StatusPill, dateStr } from "./_components/ui";
import { Link } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import {
  Users,
  Briefcase,
  Building2,
  Megaphone,
  FileText,
  CreditCard,
  Crown,
  Flag,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Star,
  Bell,
} from "lucide-react";

type Stats = {
  totalUsers: number;
  totalProfessionals: number;
  totalCompanies: number;
  totalAds: number;
  totalJobs: number;
  totalApplications: number;
  totalTransactions: number;
  activeSubscriptions: number;
  pendingAdReports: number;
  pendingUserReports: number;
  totalCommissions: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  growthRate: number;
  openJobs: number;
  totalRatings: number;
};

type RecentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

type RecentActivity = {
  id: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: Date;
};

type Alerts = {
  pendingReports: number;
  unverifiedCompanies: number;
  unverifiedProfessionals: number;
  unverifiedAds: number;
  openJobs: number;
};

type Data = {
  stats: Stats;
  alerts: Alerts;
  recentActivity: RecentActivity[];
  recentUsers: RecentUser[];
  recentReports: { id: string; reason: string; createdAt: Date }[];
};

const QUICK_ACTIONS = [
  { href: "/admin/users", label: "إدارة المستخدمين", icon: Users },
  { href: "/admin/professionals", label: "إدارة المهنيين", icon: Briefcase },
  { href: "/admin/companies", label: "إدارة الشركات", icon: Building2 },
  { href: "/admin/reports", label: "مراجعة البلاغات", icon: Flag },
  { href: "/admin/ads", label: "إدارة الإعلانات", icon: Megaphone },
  { href: "/admin/notifications", label: "إرسال إشعار", icon: Bell },
] as const;

export default function AdminHomePage() {
  const T = useT();
  const { data, loading, error } = useFetch<Data>("/api/admin/stats");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>;
  }

  const s = data.stats;

  const cards = [
    { label: "المستخدمون", value: s.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "المهنيون", value: s.totalProfessionals, icon: Briefcase, color: "bg-emerald-50 text-emerald-600" },
    { label: "الشركات", value: s.totalCompanies, icon: Building2, color: "bg-indigo-50 text-indigo-600" },
    { label: "الإعلانات", value: s.totalAds, icon: Megaphone, color: "bg-rose-50 text-rose-600" },
    { label: "الوظائف", value: s.totalJobs, icon: FileText, color: "bg-amber-50 text-amber-600" },
    { label: "المعاملات", value: s.totalTransactions, icon: CreditCard, color: "bg-cyan-50 text-cyan-600" },
    { label: "اشتراكات نشطة", value: s.activeSubscriptions, icon: Crown, color: "bg-purple-50 text-purple-600" },
    { label: "بلاغات معلّقة", value: s.pendingAdReports + s.pendingUserReports, icon: Flag, color: "bg-orange-50 text-orange-600" },
  ];

  const alerts = [
    { label: "بلاغات معلّقة", value: data.alerts.pendingReports, href: "/admin/reports", icon: Flag, danger: data.alerts.pendingReports > 0 },
    { label: "شركات غير موثّقة", value: data.alerts.unverifiedCompanies, href: "/admin/companies", icon: Building2, danger: false },
    { label: "مهنيون غير موثّقين", value: data.alerts.unverifiedProfessionals, href: "/admin/professionals", icon: Briefcase, danger: false },
    { label: "إعلانات غير موثّقة", value: data.alerts.unverifiedAds, href: "/admin/ads", icon: Megaphone, danger: false },
    { label: "وظائف مفتوحة", value: data.alerts.openJobs, href: "/admin/jobs", icon: FileText, danger: false },
  ];

  return (
    <div>
      <h1 className="admin-page-title">{T("نظرة عامة")}</h1>
      <p className="admin-page-subtitle">{T("أهم المؤشرات عبر المنصة")}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="admin-stat-card">
              <div className={`admin-stat-icon ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-extrabold leading-tight">{c.value}</p>
                <p className="text-[11px] text-muted">{T(c.label)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-emerald-50 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold leading-tight">{s.totalCommissions.toLocaleString()}</p>
            <p className="text-[11px] text-muted">{T("إجمالي العمولات المكتملة")}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-sky-50 text-sky-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold leading-tight">{s.totalApplications}</p>
            <p className="text-[11px] text-muted">{T("طلبات التوظيف")}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-lime-50 text-lime-600">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold leading-tight">{s.totalRatings}</p>
            <p className="text-[11px] text-muted">{T("التقييمات")}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-teal-50 text-teal-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold leading-tight">
              {s.growthRate > 0 ? "+" : ""}{s.growthRate}%
            </p>
            <p className="text-[11px] text-muted">{T("معدل نمو المستخدمين اليوم")}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="admin-table-wrap">
          <div className="px-4 py-3 font-extrabold text-sm border-b border-border">{T("أحدث المستخدمين")}</div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <tbody>
                {data.recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-[11px] text-muted-light">{u.email}</p>
                    </td>
                    <td>
                      <StatusPill value={u.role} />
                    </td>
                    <td className="text-muted text-xs whitespace-nowrap">{dateStr(u.createdAt)}</td>
                  </tr>
                ))}
                {!data.recentUsers.length && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-6">{T("لا يوجد مستخدمون بعد")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-table-wrap">
          <div className="px-4 py-3 font-extrabold text-sm border-b border-border">{T("أحدث البلاغات المعلّقة")}</div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <tbody>
                {data.recentReports.map((r, i) => (
                  <tr key={r.id || i}>
                    <td>
                      <p className="font-bold">{r.reason}</p>
                      <p className="text-[11px] text-muted-light">{dateStr(r.createdAt)}</p>
                    </td>
                  </tr>
                ))}
                {!data.recentReports.length && (
                  <tr>
                    <td className="text-center text-muted py-6">{T("لا توجد بلاغات معلّقة")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="admin-table-wrap">
          <div className="px-4 py-3 font-extrabold text-sm border-b border-border flex items-center justify-between">
            <span>{T("إجراءات سريعة")}</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href} className="admin-action-btn flex items-center gap-2 justify-start py-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {T(a.label)}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="admin-table-wrap">
          <div className="px-4 py-3 font-extrabold text-sm border-b border-border flex items-center justify-between">
            <span>{T("أحدث الأنشطة الإدارية")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <tbody>
                {data.recentActivity.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="admin-pill admin-pill-blue">{l.action}</span>
                    </td>
                    <td className="text-muted text-xs">{l.adminEmail}</td>
                    <td className="text-muted text-xs whitespace-nowrap">{dateStr(l.createdAt)}</td>
                  </tr>
                ))}
                {!data.recentActivity.length && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-6">{T("لا توجد أنشطة بعد")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="px-4 py-3 font-extrabold text-sm border-b border-border flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>{T("تنبيهات تحتاج تدخلك")}</span>
        </div>
        <div className="p-3 grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {alerts.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href={a.href} className="admin-action-btn flex flex-col items-start gap-1 py-3">
                <span className="flex items-center gap-1.5 font-extrabold">
                  <Icon className={`w-4 h-4 ${a.danger ? "text-danger" : "text-primary"}`} />
                  {T(a.label)}
                </span>
                <span className="text-base font-extrabold">{a.value}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
