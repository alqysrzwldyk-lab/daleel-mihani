"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { DataTable, Pagination, dateStr } from "../_components/ui";
import ConfirmModal from "../_components/ConfirmModal";
import { Search, BadgeCheck } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  userId: string;
  name: string;
  email: string;
  industry: string;
  city: string;
  verified: boolean;
  views: number;
  createdAt: Date;
};

type Data = { companies: Row[]; total: number; page: number; totalPages: number };

export default function AdminCompaniesPage() {
  const T = useT();
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<Row | null>(null);

  const url = `/api/admin/companies?q=${encodeURIComponent(appliedQ)}&verified=${verified}&page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function confirmVerify() {
    if (!pending) return;
    setBusyId(pending.id);
    setMsg("");
    const res = await apiSend(`/api/admin/companies/${pending.id}`, "PATCH", { verified: !pending.verified });
    if (res.error) setMsg(T("حدث خطأ أثناء الحفظ"));
    else reload();
    setBusyId(null);
    setPending(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("الشركات")}</h1>
      <p className="admin-page-subtitle">{T("توثيق حسابات الشركات")}</p>

      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث بالاسم أو القطاع...")}
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
      </div>

      {msg && <p className="text-sm text-danger mb-3">{msg}</p>}

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: T("الشركة") },
            { key: "industry", label: T("القطاع") },
            { key: "city", label: T("المدينة") },
            { key: "views", label: T("المشاهدات") },
            { key: "verified", label: T("التوثيق") },
            { key: "created", label: T("التاريخ") },
            { key: "actions", label: T("إجراء") },
          ]}
        >
          {data.companies.map((c) => (
            <tr key={c.id}>
              <td>
                <p className="font-bold">{c.name}</p>
                <p className="text-[11px] text-muted-light">{c.email || c.id}</p>
              </td>
              <td className="text-muted">{c.industry || "—"}</td>
              <td className="text-muted">{c.city || "—"}</td>
              <td className="text-muted">{c.views}</td>
              <td>
                {c.verified ? (
                  <span className="admin-pill admin-pill-green">
                    <BadgeCheck className="w-3 h-3" /> {T("موثّق")}
                  </span>
                ) : (
                  <span className="admin-pill admin-pill-gray">{T("غير موثّق")}</span>
                )}
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(c.createdAt)}</td>
              <td>
                <button
                  className="admin-action-btn"
                  disabled={busyId === c.id}
                  onClick={() => setPending(c)}
                >
                  {c.verified ? T("إلغاء التوثيق") : T("توثيق")}
                </button>
              </td>
            </tr>
          ))}
          {!data.companies.length && (
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
        title={pending?.verified ? T("إلغاء التوثيق") : T("توثيق")}
        message={
          pending
            ? T("هل تريد {action} شركة {name}؟", {
                action: pending.verified ? T("إلغاء توثيق") : T("توثيق"),
                name: pending.name,
              })
            : ""
        }
        busy={busyId !== null}
        onConfirm={confirmVerify}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
