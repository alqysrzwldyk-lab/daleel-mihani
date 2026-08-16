"use client";

import { useState } from "react";
import { useFetch } from "../_components/useFetch";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useT } from "@/lib/useT";

type Point = { date: string; count: number };

type Data = {
  days: number;
  series: { users: Point[]; ads: Point[]; jobs: Point[]; transactions: Point[] };
  roleDistribution: { role: string; count: number }[];
  adStatusDistribution: { status: string; count: number }[];
  topCategories: { category: string; count: number }[];
  reportStatusDistribution: {
    ad: { status: string; count: number }[];
    user: { status: string; count: number }[];
  };
  jobStatusDistribution: { status: string; count: number }[];
  totals: {
    users: number;
    ads: number;
    jobs: number;
    companies: number;
    professionals: number;
    totalViews: number;
  };
  growth: {
    usersWeek: number;
    usersMonth: number;
    adminActivity: number;
  };
};

const DAYS_OPTIONS = [7, 14, 30, 90, 365];

function GrowthBadge({ value, label, T }: { value: number; label: string; T: (k: string) => string }) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${value >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-danger"}`}>
        {value >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
      </div>
      <div>
        <p className="text-xl font-extrabold leading-tight">
          {value > 0 ? "+" : ""}{value}%
        </p>
        <p className="text-[11px] text-muted">{T(label)}</p>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const T = useT();
  const [days, setDays] = useState(14);
  const url = `/api/admin/analytics?days=${days}`;
  const { data, loading, error } = useFetch<Data>(url);

  const combined = data?.series.users.map((u, i) => ({
    date: u.date.slice(5),
    users: u.count,
    ads: data.series.ads[i]?.count ?? 0,
    jobs: data.series.jobs[i]?.count ?? 0,
  }));

  const roleLabels: Record<string, string> = {
    professional: "مهني",
    employer: "صاحب عمل",
    admin: "مدير",
  };
  const statusLabels: Record<string, string> = {
    active: "متوفر",
    paused: "موقوف",
    sold: "مباع",
    reserved: "محجوز",
    expired: "منتهي",
    coming_soon: "قريباً",
    archived: "مؤرشف",
    open: "مفتوحة",
    closed: "مغلقة",
    pending: "معلّق",
    reviewed: "تمت المراجعة",
    removed: "تم الحذف",
  };

  return (
    <div>
      <h1 className="admin-page-title">{T("التحليلات")}</h1>
      <p className="admin-page-subtitle">{T("بيانات حقيقية من قاعدة البيانات — لا بيانات وهمية")}</p>

      <div className="admin-toolbar">
        <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                days === d ? "bg-primary text-white shadow" : "text-muted hover:bg-[var(--border-light)]"
              }`}
            >
              {d === 365 ? T("سنة") : T("{count} يوم", { count: d })}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "المستخدمون", value: data.totals.users },
              { label: "المهنيون", value: data.totals.professionals },
              { label: "الشركات", value: data.totals.companies },
              { label: "الإعلانات", value: data.totals.ads },
              { label: "الوظائف", value: data.totals.jobs },
              { label: "إجمالي المشاهدات", value: data.totals.totalViews },
            ].map((s) => (
              <div key={s.label} className="admin-stat-card !flex-col !items-start gap-1">
                <p className="text-xl font-extrabold leading-tight">{s.value.toLocaleString()}</p>
                <p className="text-[11px] text-muted">{T(s.label)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <GrowthBadge value={data.growth.usersWeek} label="نمو المستخدمين الأسبوعي" T={T} />
            <GrowthBadge value={data.growth.usersMonth} label="نمو المستخدمين الشهري" T={T} />
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-purple-50 text-purple-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-extrabold leading-tight">{data.growth.adminActivity.toLocaleString()}</p>
                <p className="text-[11px] text-muted">{T("عمليات إدارية خلال الفترة")}</p>
              </div>
            </div>
          </div>

          <div className="admin-table-wrap !rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">{T("النمو اليومي (مستخدمون / إعلانات / وظائف)")}</h3>
            <div dir="ltr" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={combined} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-light)" }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-light)" }} />
                  <Tooltip cursor={{ fill: "var(--border-light)" }} />
                  <Legend wrapperStyle={{ direction: "rtl" }} />
                  <Bar dataKey="users" fill="#2563eb" radius={[3, 3, 0, 0]} name={T("مستخدمون")} />
                  <Bar dataKey="ads" fill="#f43f5e" radius={[3, 3, 0, 0]} name={T("إعلانات")} />
                  <Bar dataKey="jobs" fill="#f59e0b" radius={[3, 3, 0, 0]} name={T("وظائف")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-table-wrap !rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">{T("المعاملات اليومية")}</h3>
            <div dir="ltr" className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series.transactions.map((t) => ({ ...t, date: t.date.slice(5) }))} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-light)" }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-light)" }} />
                  <Tooltip cursor={{ stroke: "var(--border-light)" }} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} name={T("معاملات")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="admin-table-wrap !rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3">{T("توزيع الأدوار")}</h3>
              <div dir="ltr" className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.roleDistribution.map((r) => ({ name: T(roleLabels[r.role] ?? r.role), count: r.count }))} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-light)" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--muted)" }} width={80} />
                    <Tooltip cursor={{ fill: "var(--border-light)" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name={T("العدد")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-table-wrap !rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3">{T("أشهر الأقسام")}</h3>
              <div dir="ltr" className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topCategories.map((c) => ({ name: c.category, count: c.count }))} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-light)" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--muted)" }} width={90} />
                    <Tooltip cursor={{ fill: "var(--border-light)" }} />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} name={T("الإعلانات")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="admin-table-wrap !rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3">{T("حالة الإعلانات")}</h3>
              <div className="flex flex-wrap gap-2">
                {data.adStatusDistribution.map((s) => (
                  <span key={s.status} className="admin-pill admin-pill-gray">
                    {T(statusLabels[s.status] ?? s.status)}: {s.count}
                  </span>
                ))}
                {!data.adStatusDistribution.length && (
                  <span className="text-muted text-sm">{T("لا توجد إعلانات")}</span>
                )}
              </div>
            </div>

            <div className="admin-table-wrap !rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3">{T("حالة الوظائف")}</h3>
              <div className="flex flex-wrap gap-2">
                {data.jobStatusDistribution.map((s) => (
                  <span key={s.status} className="admin-pill admin-pill-gray">
                    {T(statusLabels[s.status] ?? s.status)}: {s.count}
                  </span>
                ))}
                {!data.jobStatusDistribution.length && (
                  <span className="text-muted text-sm">{T("لا توجد وظائف")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="admin-table-wrap !rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">{T("حالة البلاغات")}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-muted mb-2">{T("بلاغات الإعلانات")}</p>
                <div className="flex flex-wrap gap-2">
                  {data.reportStatusDistribution.ad.map((s) => (
                    <span key={s.status} className="admin-pill admin-pill-gray">
                      {T(statusLabels[s.status] ?? s.status)}: {s.count}
                    </span>
                  ))}
                  {!data.reportStatusDistribution.ad.length && (
                    <span className="text-muted text-sm">{T("لا توجد بلاغات")}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted mb-2">{T("بلاغات المستخدمين")}</p>
                <div className="flex flex-wrap gap-2">
                  {data.reportStatusDistribution.user.map((s) => (
                    <span key={s.status} className="admin-pill admin-pill-gray">
                      {T(statusLabels[s.status] ?? s.status)}: {s.count}
                    </span>
                  ))}
                  {!data.reportStatusDistribution.user.length && (
                    <span className="text-muted text-sm">{T("لا توجد بلاغات")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
