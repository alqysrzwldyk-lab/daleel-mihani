"use client";

import { useState } from "react";
import { useFetch } from "../_components/useFetch";
import { DataTable, Pagination, dateStr } from "../_components/ui";
import { Search } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
};

type Data = { logs: Row[]; total: number; page: number; totalPages: number };

export default function AdminAuditLogsPage() {
  const T = useT();
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [admin, setAdmin] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [page, setPage] = useState(1);

  const url = `/api/admin/audit-logs?q=${encodeURIComponent(appliedQ)}&admin=${encodeURIComponent(admin)}&action=${encodeURIComponent(action)}&resource=${encodeURIComponent(resource)}&from=${appliedFrom}&to=${appliedTo}&page=${page}`;
  const { data, loading, error } = useFetch<Data>(url);

  return (
    <div>
      <h1 className="admin-page-title">{T("سجل التدقيق")}</h1>
      <p className="admin-page-subtitle">{T("كل عملية إدارية تُسجَّل هنا بشكل دائم")}</p>

      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث بالبريد أو العملية أو المورد...")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setAppliedQ(q);
                setPage(1);
              }
            }}
          />
        </div>
        <input
          className="admin-input"
          placeholder={T("بريد المسؤول...")}
          value={admin}
          onChange={(e) => { setAdmin(e.target.value); setPage(1); }}
        />
        <input
          className="admin-input"
          placeholder={T("العملية (action)...")}
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
        />
        <input
          className="admin-input"
          placeholder={T("المورد (resource)...")}
          value={resource}
          onChange={(e) => { setResource(e.target.value); setPage(1); }}
        />
        <input
          type="date"
          className="admin-input"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          onBlur={() => setAppliedFrom(from)}
        />
        <input
          type="date"
          className="admin-input"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          onBlur={() => setAppliedTo(to)}
        />
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "admin", label: T("المسؤول") },
            { key: "action", label: T("العملية") },
            { key: "resource", label: T("المورد") },
            { key: "resourceId", label: T("المعرف") },
            { key: "details", label: T("التفاصيل") },
            { key: "ip", label: "IP" },
            { key: "created", label: T("الوقت") },
          ]}
        >
          {data.logs.map((l) => (
            <tr key={l.id}>
              <td className="font-bold">{l.adminEmail}</td>
              <td>
                <span className="admin-pill admin-pill-blue">{l.action}</span>
              </td>
              <td className="text-muted">{l.resource}</td>
              <td className="text-muted text-xs">{l.resourceId || "—"}</td>
              <td className="text-muted text-xs max-w-[180px]">
                {l.details ? JSON.stringify(l.details).slice(0, 60) : "—"}
              </td>
              <td className="text-muted text-xs">{l.ip || "—"}</td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(l.createdAt)}</td>
            </tr>
          ))}
          {!data.logs.length && (
            <tr>
              <td colSpan={7} className="text-center text-muted py-6">
                {T("لا توجد سجلات")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}
