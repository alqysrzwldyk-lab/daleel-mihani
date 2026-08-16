"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Eye, MessageSquare, Share2, Heart, TrendingUp, TrendingDown,
  Minus, Loader2,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
} from "recharts";
import { useT } from "@/lib/useT";

type StatsPoint = {
  date: string;
  label: string;
  views: number;
  contacts: number;
  shares: number;
  favorites: number;
};

type StatsData = {
  ad: { _id: string; title: string; status: string };
  days: number;
  totals: { views: number; contacts: number; shares: number; favorites: number };
  deltas: { views: number | null; contacts: number | null; shares: number | null; favorites: number | null };
  series: StatsPoint[];
};

const DAYS_OPTIONS = [7, 14, 30];

const METRICS = [
  { key: "views", label: "المشاهدات", color: "#0ea5e9", icon: Eye },
  { key: "contacts", label: "مرات التواصل", color: "#10b981", icon: MessageSquare },
  { key: "shares", label: "المشاركات", color: "#8b5cf6", icon: Share2 },
  { key: "favorites", label: "مرات الحفظ", color: "#f59e0b", icon: Heart },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

function DeltaBadge({ value }: { value: number | null }) {
  const T = useT();
  if (value === null) {
    return (
      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">
        {T("جديد")}
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
        <TrendingUp className="w-3 h-3" /> {value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
        <TrendingDown className="w-3 h-3" /> {value}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; color?: string }[];
  label?: string;
}) {
  const T = useT();
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div dir="rtl" className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p) => {
        const meta = METRICS.find((m) => m.key === p.dataKey);
        return (
          <p key={String(p.dataKey)} className="flex items-center gap-2 py-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted">{meta?.label ? T(meta.label) : p.dataKey}</span>
            <span className="font-bold">{p.value}</span>
          </p>
        );
      })}
    </div>
  );
}

export default function AdStatsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const T = useT();
  const [days, setDays] = useState(14);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ads/${id}/stats?days=${d}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.error || "حدث خطأ في تحميل الإحصائيات");
      }
    } catch {
      setError("فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load(days);
  }, [id, days, load]);

  const switchDays = (d: number) => {
    if (d !== days) {
      setDays(d);
    }
  };

  if (loading && !data) {
    return (
      <div className="page-container max-w-4xl mx-auto">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-container max-w-4xl mx-auto">
        <div className="page-header">
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1>{T("إحصائيات الإعلان")}</h1>
        </div>
        <div className="empty-state">
          <h3>{T("تعذر تحميل الإحصائيات")}</h3>
          <p>{T(error)}</p>
          <button onClick={() => load(days)} className="btn btn-primary mt-4">
            {T("إعادة المحاولة")}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="page-header">
        <button onClick={() => router.back()} className="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg">{T("إحصائيات الإعلان")}</h1>
          <p className="text-[11px] text-muted truncate">{data.ad.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 mb-4 w-fit">
        {DAYS_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => switchDays(d)}
            disabled={loading}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 ${
              days === d ? "bg-primary text-white shadow" : "text-muted hover:bg-[var(--border-light)]"
            }`}
          >
            {T("{count} يوم", { count: d })}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> {T("جاري التحديث...")}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const total = data.totals[m.key];
          const delta = data.deltas[m.key];
          return (
            <div key={m.key} className="app-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}1a`, color: m.color }}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[11px] text-muted font-bold">{T(m.label)}</span>
              </div>
              <p className="text-2xl font-extrabold">{total.toLocaleString("ar-EG")}</p>
              <div className="mt-1.5"><DeltaBadge value={delta} /></div>
            </div>
          );
        })}
      </div>

      <div className="app-card p-4 mb-4">
        <h3 className="text-sm font-bold mb-3">{T("المشاهدات اليومية")}</h3>
        <div dir="ltr" className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-light)" }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-light)" }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--border-light)" }} />
              <Bar dataKey="views" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={36} name={T("المشاهدات")} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="app-card p-4">
        <h3 className="text-sm font-bold mb-3">{T("مقارنة المؤشرات")}</h3>
        <div dir="ltr" className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-light)" }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-light)" }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                formatter={(value: string) => <span style={{ fontSize: 12 }}>{value}</span>}
                wrapperStyle={{ direction: "rtl" }}
              />
              <Line type="monotone" dataKey="views" stroke="#0ea5e9" strokeWidth={2} dot={false} name={T("المشاهدات")} />
              <Line type="monotone" dataKey="contacts" stroke="#10b981" strokeWidth={2} dot={false} name={T("مرات التواصل")} />
              <Line type="monotone" dataKey="shares" stroke="#8b5cf6" strokeWidth={2} dot={false} name={T("المشاركات")} />
              <Line type="monotone" dataKey="favorites" stroke="#f59e0b" strokeWidth={2} dot={false} name={T("مرات الحفظ")} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
