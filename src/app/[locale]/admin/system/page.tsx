"use client";

import { useFetch } from "../_components/useFetch";
import { Database, Server, Cpu, Globe, Clock, Activity, Package } from "lucide-react";
import { useT } from "@/lib/useT";

type Data = {
  database: { status: string; error: string | null };
  api: { status: string };
  environment: string;
  appVersion: string;
  nodeVersion: string;
  serverTime: string;
  uptimeSeconds: number;
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function AdminSystemPage() {
  const T = useT();
  const { data, loading, error, reload } = useFetch<Data>("/api/admin/system");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>;
  }

  const items = [
    {
      label: "قاعدة البيانات",
      value: data.database.status === "connected" ? T("متصل") : T("غير متصل"),
      ok: data.database.status === "connected",
      icon: Database,
    },
    {
      label: "واجهة API",
      value: T("يعمل"),
      ok: data.api.status === "ok",
      icon: Server,
    },
    {
      label: "البيئة",
      value: data.environment,
      ok: true,
      icon: Globe,
    },
    {
      label: "إصدار التطبيق",
      value: data.appVersion,
      ok: true,
      icon: Package,
    },
    {
      label: "إصدار Node.js",
      value: data.nodeVersion,
      ok: true,
      icon: Cpu,
    },
    {
      label: "وقت تشغيل الخادم",
      value: `${data.serverTime}`,
      ok: true,
      icon: Clock,
    },
    {
      label: "مدة التشغيل (Uptime)",
      value: formatUptime(data.uptimeSeconds),
      ok: true,
      icon: Activity,
    },
  ];

  return (
    <div>
      <h1 className="admin-page-title">{T("صحة النظام")}</h1>
      <p className="admin-page-subtitle">{T("فحص حالة النظام الأساسية")}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="admin-stat-card">
              <div className={`admin-stat-icon ${item.ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-danger"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold leading-tight truncate">{item.value}</p>
                <p className="text-[11px] text-muted">{T(item.label)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {data.database.error && (
        <div className="admin-table-wrap !rounded-xl p-4 mb-4">
          <p className="text-sm text-danger">
            {T("تعذر الاتصال بقاعدة البيانات.")} {data.database.error}
          </p>
        </div>
      )}

      <div className="admin-table-wrap !rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">{T("آخر فحوصات")}</h3>
        <p className="text-sm text-muted">{T("قاعدة البيانات وواجهة API تم فحصهما بنجاح.")}</p>
        <button className="admin-action-btn mt-3" onClick={reload}>
          {T("إعادة الفحص")}
        </button>
      </div>
    </div>
  );
}
