"use client";

import { useFetch } from "../_components/useFetch";
import { dateStr } from "../_components/ui";
import { ShieldCheck, ShieldOff, Database, Users, ScrollText, Ban, Activity } from "lucide-react";
import { useT } from "@/lib/useT";

type LogItem = {
  id: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
};

type Data = {
  jwtConfigured: boolean;
  environment: string;
  totalAdmins: number;
  disabledAccounts: number;
  totalLogs: number;
  unauthorizedLogsAvailable: boolean;
  recentActivity: LogItem[];
  sensitiveActions: LogItem[];
};

export default function AdminSecurityPage() {
  const T = useT();
  const { data, loading, error } = useFetch<Data>("/api/admin/security");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>;
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("مركز الأمان")}</h1>
      <p className="admin-page-subtitle">{T("معلومات أمنية عامة دون كشف أي أسرار")}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="admin-stat-card">
          <div className={`admin-stat-icon ${data.jwtConfigured ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-danger"}`}>
            {data.jwtConfigured ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">
              {data.jwtConfigured ? T("مفعّل") : T("غير مفعّل")}
            </p>
            <p className="text-[11px] text-muted">{T("حماية التوكن (JWT)")}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-blue-50 text-blue-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">{T("متصل")}</p>
            <p className="text-[11px] text-muted">{T("قاعدة البيانات")}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">{data.totalAdmins}</p>
            <p className="text-[11px] text-muted">{T("حسابات المديرين")}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-amber-50 text-amber-600">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">{data.disabledAccounts}</p>
            <p className="text-[11px] text-muted">{T("حسابات معطلة")}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="admin-table-wrap !rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <ScrollText className="w-4 h-4" /> {T("آخر العمليات الحساسة")}
          </h3>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <tbody>
                {data.sensitiveActions.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="admin-pill admin-pill-red">{l.action}</span>
                    </td>
                    <td className="text-muted text-xs">{l.adminEmail}</td>
                    <td className="text-muted text-xs whitespace-nowrap">{dateStr(l.createdAt)}</td>
                  </tr>
                ))}
                {!data.sensitiveActions.length && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-6">{T("لا توجد عمليات بعد")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-table-wrap !rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Activity />
            <span>{T("النشاط الإداري الأخير")}</span>
          </h3>
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
                    <td colSpan={3} className="text-center text-muted py-6">{T("لا توجد عمليات بعد")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap !rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">{T("معلومات عامة")}</h3>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-muted">{T("البيئة")}</p>
            <p className="font-bold">{data.environment}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted">{T("إجمالي سجلات التدقيق")}</p>
            <p className="font-bold">{data.totalLogs}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted">{T("محاولات الوصول غير المصرح بها")}</p>
            <p className="font-bold">
              {data.unauthorizedLogsAvailable ? T("متاحة") : T("غير مسجّلة")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
