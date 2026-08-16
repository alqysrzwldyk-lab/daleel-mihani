"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { DataTable, Pagination, StatusPill, dateStr } from "../_components/ui";
import ConfirmModal from "../_components/ConfirmModal";
import { Flag, Search, Eye } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  type: "ad" | "user";
  targetId: string;
  targetLabel: string;
  reporterName: string;
  sellerName: string;
  reason: string;
  note: string;
  status: string;
  createdAt: Date;
};

type Data = { reports: Row[]; total: number; adTotal: number; userTotal: number; page: number; totalPages: number };

const STATUS_OPTIONS = ["pending", "reviewed", "removed"];

export default function AdminReportsPage() {
  const T = useT();
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [pending, setPending] = useState<{ row: Row; next: string } | null>(null);

  const url = `/api/admin/reports?status=${status}&type=${type}&q=${encodeURIComponent(appliedQ)}&page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function confirmStatus() {
    if (!pending) return;
    const { row, next } = pending;
    setBusyId(row.id);
    setMsg("");
    const res = await apiSend(`/api/admin/reports/${row.id}?type=${row.type}`, "PATCH", { status: next });
    if (res.error) setMsg(T("حدث خطأ أثناء الحفظ"));
    else reload();
    setBusyId(null);
    setPending(null);
    setDetail(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("البلاغات")}</h1>
      <p className="admin-page-subtitle">{T("معالجة بلاغات الإعلانات والمستخدمين")}</p>

      <div className="admin-toolbar">
        <div className="flex gap-2">
          {(["pending", "reviewed", "removed"] as const).map((s) => (
            <button key={s} className={`chip ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
              {s === "pending" ? T("معلّقة") : s === "reviewed" ? T("تمت المراجعة") : T("تم الحذف")}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all", "ad", "user"] as const).map((t) => (
            <button key={t} className={`chip ${type === t ? "active" : ""}`} onClick={() => setType(t)}>
              {t === "all" ? T("الكل") : t === "ad" ? T("إعلانات") : T("مستخدمون")}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث بالسبب أو الملاحظة...")}
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
      </div>

      {msg && <p className="text-sm text-danger mb-3">{msg}</p>}

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "target", label: T("الهدف") },
            { key: "reporter", label: T("المُبلّغ") },
            { key: "reason", label: T("السبب") },
            { key: "status", label: T("الحالة") },
            { key: "created", label: T("التاريخ") },
            { key: "actions", label: T("إجراء") },
          ]}
        >
          {data.reports.map((r) => (
            <tr key={`${r.type}-${r.id}`}>
              <td>
                <p className="font-bold flex items-center gap-1">
                  {r.type === "ad" && <Flag className="w-3 h-3 text-muted-light" />}
                  {r.targetLabel}
                </p>
                <p className="text-[11px] text-muted-light">{T("المُبلّغ عنه: {name}", { name: r.sellerName })}</p>
              </td>
              <td className="text-muted">{r.reporterName}</td>
              <td className="text-muted">{r.reason}</td>
              <td>
                <StatusPill value={r.status} />
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(r.createdAt)}</td>
              <td>
                <div className="flex gap-2">
                  <button className="admin-action-btn flex items-center gap-1" onClick={() => setDetail(r)}>
                    <Eye className="w-3 h-3" /> {T("تفاصيل")}
                  </button>
                  {STATUS_OPTIONS.filter((s) => s !== r.status).map((s) => (
                    <button
                      key={s}
                      className={`admin-action-btn ${s === "removed" ? "danger" : ""}`}
                      disabled={busyId === r.id}
                      onClick={() => setPending({ row: r, next: s })}
                    >
                      {s === "pending" ? T("إعادة للمعلّقة") : s === "reviewed" ? T("مراجعة") : T("حذف")}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
          {!data.reports.length && (
            <tr>
              <td colSpan={6} className="text-center text-muted py-6">
                {T("لا توجد بلاغات")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />

      {detail && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
          <div className="admin-modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body space-y-3">
              <h3 className="admin-modal-title">{T("تفاصيل البلاغ")}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted">{T("الهدف")}</p>
                  <p className="font-bold">{detail.targetLabel}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">{T("المُبلّغ")}</p>
                  <p className="font-bold">{detail.reporterName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">{T("المُبلّغ عنه")}</p>
                  <p className="font-bold">{detail.sellerName || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">{T("النوع")}</p>
                  <p className="font-bold">{detail.type === "ad" ? T("إعلان") : T("مستخدم")}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">{T("الحالة")}</p>
                  <StatusPill value={detail.status} />
                </div>
                <div>
                  <p className="text-[11px] text-muted">{T("التاريخ")}</p>
                  <p className="font-bold">{dateStr(detail.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted mb-1">{T("السبب")}</p>
                <p className="text-sm bg-[var(--border-light)] rounded-lg p-3">{detail.reason}</p>
              </div>
              {detail.note && (
                <div>
                  <p className="text-[11px] text-muted mb-1">{T("ملاحظة")}</p>
                  <p className="text-sm bg-[var(--border-light)] rounded-lg p-3">{detail.note}</p>
                </div>
              )}
              <p className="text-[11px] text-muted-light break-all">{detail.targetId}</p>
            </div>
            <div className="admin-modal-actions flex-wrap">
              <button className="admin-action-btn" onClick={() => setDetail(null)}>
                {T("إغلاق")}
              </button>
              {STATUS_OPTIONS.filter((s) => s !== detail.status).map((s) => (
                <button
                  key={s}
                  className={`admin-action-btn ${s === "removed" ? "danger" : "primary"}`}
                  disabled={busyId !== null}
                  onClick={() => setPending({ row: detail, next: s })}
                >
                  {s === "pending" ? T("إعادة للمعلّقة") : s === "reviewed" ? T("مراجعة") : T("حذف")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pending !== null}
        title={pending?.next === "removed" ? T("حذف البلاغ") : T("تحديث حالة البلاغ")}
        message={
          pending
            ? pending.next === "removed"
              ? T("هل تريد حذف هذا البلاغ؟ هذه العملية لا يمكن التراجع عنها.")
              : pending.next === "reviewed"
              ? T("هل تريد وضع علامة تمت المراجعة على هذا البلاغ؟")
              : T("هل تريد إعادة هذا البلاغ إلى الحالة المعلّقة؟")
            : ""
        }
        danger={pending?.next === "removed"}
        busy={busyId !== null}
        onConfirm={confirmStatus}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
