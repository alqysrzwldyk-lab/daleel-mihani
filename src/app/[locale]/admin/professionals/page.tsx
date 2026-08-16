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
  name: string;
  email: string;
  profession: string;
  location: string;
  isActive: boolean;
  verified: boolean;
  averageRating: number;
  ratingCount: number;
  createdAt: Date;
};

type Data = { professionals: Row[]; total: number; page: number; totalPages: number };

type PendingAction = {
  row: Row;
  type: "verified" | "isActive";
};

export default function AdminProfessionalsPage() {
  const T = useT();
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [verified, setVerified] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);

  const url = `/api/admin/professionals?q=${encodeURIComponent(appliedQ)}&verified=${verified}&active=${active}&page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function confirmAction() {
    if (!pending) return;
    const { row, type } = pending;
    const next = type === "verified" ? { verified: !row.verified } : { isActive: !row.isActive };
    setBusyId(row.id);
    setMsg("");
    const res = await apiSend(`/api/admin/professionals/${row.id}`, "PATCH", next);
    if (res.error) setMsg(T("حدث خطأ أثناء الحفظ"));
    else reload();
    setBusyId(null);
    setPending(null);
  }

  const pendingTitle =
    pending?.type === "verified"
      ? pending.row.verified
        ? T("إلغاء التوثيق")
        : T("توثيق")
      : pending?.row.isActive
      ? T("تعطيل")
      : T("تفعيل");

  const pendingMessage = pending
    ? pending.type === "verified"
      ? T("هل تريد {action} المهني {name}؟", {
          action: pending.row.verified ? T("إلغاء توثيق") : T("توثيق"),
          name: pending.row.name,
        })
      : T("هل تريد {action} المهني {name}؟", {
          action: pending.row.isActive ? T("تعطيل") : T("تفعيل"),
          name: pending.row.name,
        })
    : "";

  return (
    <div>
      <h1 className="admin-page-title">{T("المهنيون")}</h1>
      <p className="admin-page-subtitle">{T("توثيق ملفات المهنيين أو تعطيلها")}</p>

      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث بالاسم أو البريد أو المهنة...")}
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
        <select className="admin-input" value={verified} onChange={(e) => { setVerified(e.target.value); setPage(1); }}>
          <option value="">{T("كل حالات التوثيق")}</option>
          <option value="true">{T("موثّق")}</option>
          <option value="false">{T("غير موثّق")}</option>
        </select>
        <select className="admin-input" value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
          <option value="">{T("كل الحالات")}</option>
          <option value="true">{T("نشط")}</option>
          <option value="false">{T("معطّل")}</option>
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
            { key: "name", label: T("المهني") },
            { key: "profession", label: T("المهنة") },
            { key: "rating", label: T("التقييم") },
            { key: "verified", label: T("التوثيق") },
            { key: "status", label: T("الحالة") },
            { key: "created", label: T("تاريخ التسجيل") },
            { key: "actions", label: T("إجراء") },
          ]}
        >
          {data.professionals.map((p) => (
            <tr key={p.id}>
              <td>
                <p className="font-bold">{p.name}</p>
                <p className="text-[11px] text-muted-light">{p.email}</p>
              </td>
              <td className="text-muted">{p.profession}</td>
              <td className="text-muted">
                {p.averageRating.toFixed(1)}
                <span className="text-muted-light text-xs"> ({p.ratingCount})</span>
              </td>
              <td>
                {p.verified ? (
                  <span className="admin-pill admin-pill-green">
                    <BadgeCheck className="w-3 h-3" /> {T("موثّق")}
                  </span>
                ) : (
                  <span className="admin-pill admin-pill-gray">{T("غير موثّق")}</span>
                )}
              </td>
              <td>
                <StatusPill value={p.isActive ? "active" : "disabled"} />
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(p.createdAt)}</td>
              <td>
                <div className="flex gap-2">
                  <button
                    className="admin-action-btn"
                    disabled={busyId === p.id}
                    onClick={() => setPending({ row: p, type: "verified" })}
                  >
                    {p.verified ? T("إلغاء التوثيق") : T("توثيق")}
                  </button>
                  <button
                    className={`admin-action-btn ${p.isActive ? "danger" : ""}`}
                    disabled={busyId === p.id}
                    onClick={() => setPending({ row: p, type: "isActive" })}
                  >
                    {p.isActive ? T("تعطيل") : T("تفعيل")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!data.professionals.length && (
            <tr>
              <td colSpan={7} className="text-center text-muted py-6">
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
        danger={pending?.type === "isActive" && pending.row.isActive}
        busy={busyId !== null}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
