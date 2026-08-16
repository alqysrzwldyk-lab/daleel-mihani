"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { DataTable, Pagination, StatusPill, dateStr } from "../_components/ui";
import ConfirmModal from "../_components/ConfirmModal";
import { Search, BadgeCheck } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  userId: string;
  ownerName: string;
  ownerEmail: string;
  title: string;
  category: string;
  type: string;
  location: string;
  price: number | null;
  currency: string;
  status: string;
  verified: boolean;
  views: number;
  createdAt: Date;
};

type Data = { ads: Row[]; total: number; page: number; totalPages: number };

const STATUS_OPTIONS = ["active", "paused", "sold", "reserved", "expired", "coming_soon", "archived"];

type PendingAction = {
  row: Row;
  kind: "status" | "verified";
  value: string;
};

export default function AdminAdsPage() {
  const T = useT();
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [owner, setOwner] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);

  const url = `/api/admin/ads?q=${encodeURIComponent(appliedQ)}&status=${status}&category=${category}&owner=${owner}&page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function confirmAction() {
    if (!pending) return;
    const { row, kind, value } = pending;
    setBusyId(row.id);
    setMsg("");
    const body = kind === "verified" ? { verified: value === "true" } : { status: value };
    const res = await apiSend(`/api/admin/ads/${row.id}`, "PATCH", body);
    if (res.error) setMsg(T("حدث خطأ أثناء الحفظ"));
    else reload();
    setBusyId(null);
    setPending(null);
  }

  const pendingTitle = pending
    ? pending.kind === "verified"
      ? pending.row.verified
        ? T("إلغاء التوثيق")
        : T("توثيق")
      : T("تغيير حالة الإعلان")
    : "";

  const pendingMessage = pending
    ? pending.kind === "verified"
      ? T("هل تريد {action} إعلان «{title}»؟", {
          action: pending.row.verified ? T("إلغاء توثيق") : T("توثيق"),
          title: pending.row.title,
        })
      : T("هل تريد تغيير حالة الإعلان «{title}» إلى {status}؟", {
          title: pending.row.title,
          status: pending.value,
        })
    : "";

  return (
    <div>
      <h1 className="admin-page-title">{T("الإعلانات")}</h1>
      <p className="admin-page-subtitle">{T("مراقبة الإعلانات وتغيير حالتها وتوثيقها")}</p>

      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث بالعنوان أو القسم أو المدينة...")}
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
          placeholder={T("معرّف المالك...")}
          value={owner}
          onChange={(e) => { setOwner(e.target.value); setPage(1); }}
        />
        <input
          className="admin-input"
          placeholder={T("فلترة حسب القسم...")}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        />
        <select className="admin-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{T("كل الحالات")}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
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
            { key: "title", label: T("الإعلان") },
            { key: "owner", label: T("المالك") },
            { key: "category", label: T("القسم") },
            { key: "price", label: T("السعر") },
            { key: "status", label: T("الحالة") },
            { key: "views", label: T("المشاهدات") },
            { key: "verified", label: T("التوثيق") },
            { key: "created", label: T("التاريخ") },
            { key: "actions", label: T("إجراء") },
          ]}
        >
          {data.ads.map((a) => (
            <tr key={a.id}>
              <td>
                <p className="font-bold max-w-[220px] truncate">{a.title}</p>
                <p className="text-[11px] text-muted-light">{a.location}</p>
              </td>
              <td>
                <p className="font-bold max-w-[160px] truncate">{a.ownerName || "—"}</p>
                <p className="text-[11px] text-muted-light">{a.ownerEmail || a.userId}</p>
              </td>
              <td className="text-muted">{a.category}</td>
              <td className="text-muted whitespace-nowrap">
                {a.price != null ? `${a.price.toLocaleString()} ${a.currency}` : "—"}
              </td>
              <td>
                <StatusPill value={a.status} />
              </td>
              <td className="text-muted">{a.views}</td>
              <td>
                {a.verified ? (
                  <span className="admin-pill admin-pill-green">
                    <BadgeCheck className="w-3 h-3" /> {T("موثّق")}
                  </span>
                ) : (
                  <span className="admin-pill admin-pill-gray">{T("غير موثّق")}</span>
                )}
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(a.createdAt)}</td>
              <td>
                <div className="flex flex-col gap-2">
                  <button
                    className="admin-action-btn"
                    disabled={busyId === a.id}
                    onClick={() => setPending({ row: a, kind: "verified", value: String(!a.verified) })}
                  >
                    {a.verified ? T("إلغاء التوثيق") : T("توثيق")}
                  </button>
                  <select
                    className="admin-input !py-1 !text-[11px]"
                    value={a.status}
                    disabled={busyId === a.id}
                    onChange={(e) => setPending({ row: a, kind: "status", value: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </td>
            </tr>
          ))}
          {!data.ads.length && (
            <tr>
              <td colSpan={9} className="text-center text-muted py-6">
                {T("لا توجد نتائج")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />

      <ConfirmModal
        open={pending !== null}
        title={pendingTitle}
        message={pendingMessage}
        busy={busyId !== null}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
