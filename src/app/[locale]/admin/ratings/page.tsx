"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { DataTable, Pagination, dateStr } from "../_components/ui";
import ConfirmModal from "../_components/ConfirmModal";
import { Star, Trash2, Search } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  type: string;
  targetId: string;
  targetName: string;
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  score: number;
  comment?: string;
  createdAt: Date;
};

type Data = { ratings: Row[]; total: number; page: number; totalPages: number };

export default function AdminRatingsPage() {
  const T = useT();
  const [type, setType] = useState<"professional" | "company">("professional");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<Row | null>(null);

  const url = `/api/admin/ratings?type=${type}&q=${encodeURIComponent(appliedQ)}&page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function confirmDelete() {
    if (!pending) return;
    setBusyId(pending.id);
    setMsg("");
    const res = await apiSend(`/api/admin/ratings/${pending.id}?type=${pending.type}`, "DELETE");
    if (res.error) setMsg(T("حدث خطأ أثناء الحذف"));
    else reload();
    setBusyId(null);
    setPending(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("التقييمات")}</h1>
      <p className="admin-page-subtitle">{T("مراجعة وحذف التقييمات المخالفة")}</p>

      <div className="admin-toolbar">
        <div className="flex gap-2">
          {(["professional", "company"] as const).map((t) => (
            <button
              key={t}
              className={`chip ${type === t ? "active" : ""}`}
              onClick={() => { setType(t); setPage(1); }}
            >
              {t === "professional" ? T("تقييمات المهنيين") : T("تقييمات الشركات")}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث في التعليق...")}
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
            { key: "score", label: T("التقييم") },
            { key: "comment", label: T("التعليق") },
            { key: "reviewer", label: T("المقيِّم") },
            { key: "target", label: T("المستهدف") },
            { key: "created", label: T("التاريخ") },
            { key: "actions", label: T("إجراء") },
          ]}
        >
          {data.ratings.map((r) => (
            <tr key={r.id}>
              <td>
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  {r.score} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
              </td>
              <td className="text-muted max-w-[260px]">
                <p className="truncate">{r.comment || "—"}</p>
              </td>
              <td>
                <p className="font-bold max-w-[160px] truncate">{r.reviewerName || "—"}</p>
                <p className="text-[11px] text-muted-light">{r.reviewerEmail || r.reviewerId}</p>
              </td>
              <td>
                <p className="font-bold max-w-[160px] truncate">{r.targetName}</p>
                <p className="text-[11px] text-muted-light">{r.targetId}</p>
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(r.createdAt)}</td>
              <td>
                <button
                  className="admin-action-btn danger flex items-center gap-1"
                  disabled={busyId === r.id}
                  onClick={() => setPending(r)}
                >
                  <Trash2 className="w-3 h-3" /> {T("حذف")}
                </button>
              </td>
            </tr>
          ))}
          {!data.ratings.length && (
            <tr>
              <td colSpan={6} className="text-center text-muted py-6">
                {T("لا توجد تقييمات")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />

      <ConfirmModal
        open={pending !== null}
        title={T("حذف التقييم")}
        message={T("هل تريد حذف هذا التقييم؟ لا يمكن التراجع عن هذه العملية.")}
        danger
        busy={busyId !== null}
        confirmLabel={T("حذف")}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
