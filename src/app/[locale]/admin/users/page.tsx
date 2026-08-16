"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { DataTable, Pagination, StatusPill, dateStr } from "../_components/ui";
import ConfirmModal from "../_components/ConfirmModal";
import { Search } from "lucide-react";
import { useT } from "@/lib/useT";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  hasProfile: boolean;
  adsCount: number;
  createdAt: Date;
};

type Data = {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
};

export default function AdminUsersPage() {
  const T = useT();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<UserRow | null>(null);

  const url = `/api/admin/users?q=${encodeURIComponent(appliedQ)}&role=${role}&status=${status}&from=${appliedFrom}&to=${appliedTo}&page=${page}`;
  const { data, loading, error, reload } = useFetch<Data>(url);

  async function applyToggle() {
    if (!pending) return;
    const u = pending;
    setBusyId(u.id);
    setMsg("");
    const next = u.status === "disabled" ? "active" : "disabled";
    const res = await apiSend(`/api/admin/users/${u.id}`, "PATCH", { status: next });
    if (res.error) {
      setMsg(res.error === "cannotModifyAdmin" ? T("لا يمكن تعديل حساب مدير") : T("حدث خطأ"));
    } else {
      reload();
    }
    setBusyId(null);
    setPending(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("المستخدمون")}</h1>
      <p className="admin-page-subtitle">{T("إدارة حسابات المنصة وتفعيلها أو تعطيلها")}</p>

      <div className="admin-toolbar">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-light" />
          <input
            className="admin-input w-full pr-9"
            placeholder={T("بحث بالاسم أو البريد...")}
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
        <select className="admin-input" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">{T("كل الأدوار")}</option>
          <option value="professional">{T("مهني")}</option>
          <option value="employer">{T("صاحب عمل")}</option>
          <option value="admin">{T("مدير")}</option>
        </select>
        <select className="admin-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{T("كل الحالات")}</option>
          <option value="active">{T("نشط")}</option>
          <option value="disabled">{T("معطّل")}</option>
        </select>
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

      {msg && <p className="text-sm text-danger mb-3">{msg}</p>}

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "user", label: T("المستخدم") },
            { key: "role", label: T("الدور") },
            { key: "status", label: T("الحالة") },
            { key: "ads", label: T("الإعلانات") },
            { key: "created", label: T("تاريخ التسجيل") },
            { key: "actions", label: T("إجراء") },
          ]}
        >
          {data.users.map((u) => (
            <tr key={u.id}>
              <td>
                <p className="font-bold">{u.name}</p>
                <p className="text-[11px] text-muted-light">{u.email}</p>
              </td>
              <td>
                <StatusPill value={u.role} />
              </td>
              <td>
                <StatusPill value={u.status} />
              </td>
              <td className="text-muted">{u.adsCount}</td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(u.createdAt)}</td>
              <td>
                {u.role !== "admin" && (
                  <button
                    className={`admin-action-btn ${u.status === "disabled" ? "" : "danger"}`}
                    disabled={busyId === u.id}
                    onClick={() => setPending(u)}
                  >
                    {u.status === "disabled" ? T("تفعيل") : T("تعطيل")}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {!data.users.length && (
            <tr>
              <td colSpan={6} className="text-center text-muted py-6">
                {T("لا توجد نتائج")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />

      <ConfirmModal
        open={pending !== null}
        title={pending?.status === "disabled" ? T("تفعيل المستخدم") : T("تعطيل المستخدم")}
        message={
          pending
            ? T("هل تريد {action} حساب {name}؟", {
                action: pending.status === "disabled" ? T("تفعيل") : T("تعطيل"),
                name: pending.name,
              })
            : ""
        }
        danger={pending?.status !== "disabled"}
        busy={busyId !== null}
        confirmLabel={pending?.status === "disabled" ? T("تفعيل") : T("تعطيل")}
        onConfirm={applyToggle}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
