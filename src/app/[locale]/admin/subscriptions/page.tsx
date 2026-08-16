"use client";

import { useState } from "react";
import { useFetch } from "../_components/useFetch";
import { DataTable, Pagination, StatusPill, dateStr } from "../_components/ui";
import { Search } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
};

type Data = { subscriptions: Row[]; total: number; page: number; totalPages: number };

export default function AdminSubscriptionsPage() {
  const T = useT();
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [user, setUser] = useState("");
  const [appliedUser, setAppliedUser] = useState("");
  const [page, setPage] = useState(1);

  const url = `/api/admin/subscriptions?status=${status}&plan=${plan}&user=${encodeURIComponent(appliedUser)}&page=${page}`;
  const { data, loading, error } = useFetch<Data>(url);

  return (
    <div>
      <h1 className="admin-page-title">{T("الاشتراكات")}</h1>
      <p className="admin-page-subtitle">{T("متابعة اشتراكات المستخدمين")}</p>

      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث باسم المستخدم...")}
            value={user}
            onChange={(e) => setUser(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setAppliedUser(user);
                setPage(1);
              }
            }}
          />
        </div>
        <select className="admin-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{T("كل الحالات")}</option>
          <option value="active">{T("نشط")}</option>
          <option value="expired">{T("منتهي")}</option>
          <option value="cancelled">{T("ملغي")}</option>
        </select>
        <select className="admin-input" value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }}>
          <option value="">{T("كل الخطط")}</option>
          <option value="free">{T("مجاني")}</option>
          <option value="premium">{T("مميز")}</option>
        </select>
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "user", label: T("المستخدم") },
            { key: "plan", label: T("الخطة") },
            { key: "status", label: T("الحالة") },
            { key: "period", label: T("الفترة") },
            { key: "created", label: T("تاريخ الاشتراك") },
          ]}
        >
          {data.subscriptions.map((s) => (
            <tr key={s.id}>
              <td>
                <p className="font-bold">{s.userName || "—"}</p>
                <p className="text-[11px] text-muted-light">{s.userEmail}</p>
              </td>
              <td>
                <StatusPill value={s.plan} />
              </td>
              <td>
                <StatusPill value={s.status} />
              </td>
              <td className="text-muted text-xs whitespace-nowrap">
                {s.startDate ? dateStr(s.startDate) : "—"} {T("إلى")} {s.endDate ? dateStr(s.endDate) : "—"}
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(s.createdAt)}</td>
            </tr>
          ))}
          {!data.subscriptions.length && (
            <tr>
              <td colSpan={5} className="text-center text-muted py-6">
                {T("لا توجد اشتراكات")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}
