"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { DataTable, Pagination, StatusPill, dateStr } from "../_components/ui";
import ConfirmModal from "../_components/ConfirmModal";
import { Search } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  companyId: string;
  companyName: string;
  jobTitle: string;
  department: string;
  city: string;
  workType: string;
  status: string;
  views: number;
  applicationsCount: number;
  createdAt: Date;
};

type Data = { jobs: Row[]; total: number; page: number; totalPages: number };

export default function AdminJobsPage() {
  const T = useT();
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<Row | null>(null);

  const url = `/api/admin/jobs?q=${encodeURIComponent(appliedQ)}&status=${status}&page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function confirmToggle() {
    if (!pending) return;
    setBusyId(pending.id);
    setMsg("");
    const next = pending.status === "open" ? "closed" : "open";
    const res = await apiSend(`/api/admin/jobs/${pending.id}`, "PATCH", { status: next });
    if (res.error) setMsg(T("حدث خطأ أثناء الحفظ"));
    else reload();
    setBusyId(null);
    setPending(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("الوظائف")}</h1>
      <p className="admin-page-subtitle">{T("فتح أو إغلاق إعلانات التوظيف")}</p>

      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث بالمسمى أو الشركة...")}
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
        <select className="admin-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{T("كل الحالات")}</option>
          <option value="open">{T("مفتوحة")}</option>
          <option value="closed">{T("مغلقة")}</option>
        </select>
      </div>

      {msg && <p className="text-sm text-danger mb-3">{msg}</p>}

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "job", label: T("الوظيفة") },
            { key: "company", label: T("الشركة") },
            { key: "department", label: T("القسم") },
            { key: "city", label: T("المدينة") },
            { key: "stats", label: T("مشاهدات/متقدمون") },
            { key: "status", label: T("الحالة") },
            { key: "created", label: T("التاريخ") },
            { key: "actions", label: T("إجراء") },
          ]}
        >
          {data.jobs.map((j) => (
            <tr key={j.id}>
              <td>
                <p className="font-bold">{j.jobTitle}</p>
                <p className="text-[11px] text-muted-light">{j.workType}</p>
              </td>
              <td className="text-muted">{j.companyName}</td>
              <td className="text-muted">{j.department}</td>
              <td className="text-muted">{j.city}</td>
              <td className="text-muted whitespace-nowrap">{j.views} / {j.applicationsCount}</td>
              <td>
                <StatusPill value={j.status} />
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(j.createdAt)}</td>
              <td>
                <button
                  className={`admin-action-btn ${j.status === "open" ? "danger" : ""}`}
                  disabled={busyId === j.id}
                  onClick={() => setPending(j)}
                >
                  {j.status === "open" ? T("إغلاق") : T("فتح")}
                </button>
              </td>
            </tr>
          ))}
          {!data.jobs.length && (
            <tr>
              <td colSpan={8} className="text-center text-muted py-6">
                {T("لا توجد نتائج")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />

      <ConfirmModal
        open={pending !== null}
        title={pending?.status === "open" ? T("إغلاق الوظيفة") : T("فتح الوظيفة")}
        message={
          pending
            ? T("هل تريد {action} وظيفة «{title}»؟", {
                action: pending.status === "open" ? T("إغلاق") : T("فتح"),
                title: pending.jobTitle,
              })
            : ""
        }
        danger={pending?.status === "open"}
        busy={busyId !== null}
        confirmLabel={pending?.status === "open" ? T("إغلاق") : T("فتح")}
        onConfirm={confirmToggle}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
