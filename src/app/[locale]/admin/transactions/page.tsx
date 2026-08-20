"use client";

import { useState } from "react";
import { useFetch } from "../_components/useFetch";
import { DataTable, Pagination, StatusPill, dateStr } from "../_components/ui";
import { Search } from "lucide-react";
import { useT } from "@/lib/useT";

type Row = {
  id: string;
  fromName: string;
  toName: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  refType: string | null;
  note: string;
  createdAt: Date;
};

type Data = {
  transactions: Row[];
  total: number;
  platformRevenue: number;
  page: number;
  totalPages: number;
};

export default function AdminTransactionsPage() {
  const T = useT();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [user, setUser] = useState("");
  const [appliedUser, setAppliedUser] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [page, setPage] = useState(1);

  const url = `/api/admin/transactions?type=${type}&status=${status}&user=${encodeURIComponent(appliedUser)}&from=${appliedFrom}&to=${appliedTo}&page=${page}`;
  const { data, loading, error } = useFetch<Data>(url);

  return (
    <div>
      <h1 className="admin-page-title">{T("المعاملات")}</h1>
      <p className="admin-page-subtitle">{T("سجل مالي كامل — للمعاينة فقط (التعديل محسوب ومسجّل)")}</p>

      <div className="admin-toolbar">
        <div className="admin-stat-card !py-3">
          <p className="text-lg font-extrabold text-emerald-600">
            {data ? data.platformRevenue.toLocaleString() : "—"}
          </p>
          <p className="text-[11px] text-muted">{T("إيرادات المنصة (اشتراكات + تعزيز)")}</p>
        </div>
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
        <select className="admin-input" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">{T("كل الأنواع")}</option>
          <option value="payment">{T("دفع")}</option>
          <option value="commission">{T("عمولة")}</option>
          <option value="withdrawal">{T("سحب")}</option>
          <option value="deposit">{T("إيداع")}</option>
          <option value="bank_transfer">{T("تحويل بنكي")}</option>
          <option value="remittance">{T("حوالة")}</option>
          <option value="subscription">{T("اشتراك")}</option>
          <option value="boost">{T("ترقية")}</option>
          <option value="refund">{T("استرداد")}</option>
        </select>
        <select className="admin-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{T("كل الحالات")}</option>
          <option value="pending">{T("معلّق")}</option>
          <option value="completed">{T("مكتمل")}</option>
          <option value="cancelled">{T("ملغى")}</option>
          <option value="refunded">{T("مسترد")}</option>
          <option value="failed">{T("فشل")}</option>
          <option value="expired">{T("منتهي")}</option>
        </select>
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : error || !data ? (
        <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "from", label: T("من") },
            { key: "to", label: T("إلى") },
            { key: "type", label: T("النوع") },
            { key: "amount", label: T("المبلغ") },
            { key: "fee", label: T("الرسوم") },
            { key: "status", label: T("الحالة") },
            { key: "created", label: T("التاريخ") },
          ]}
        >
          {data.transactions.map((t) => (
            <tr key={t.id}>
              <td className="text-muted">{t.fromName || "—"}</td>
              <td className="text-muted">{t.toName || "—"}</td>
              <td>
                <StatusPill value={t.type} />
              </td>
              <td className="font-bold whitespace-nowrap">
                {t.amount.toLocaleString()} {t.currency}
              </td>
              <td className="text-muted whitespace-nowrap">
                {t.fee ? `${t.fee.toLocaleString()} ${t.currency}` : "—"}
              </td>
              <td>
                <StatusPill value={t.status} />
              </td>
              <td className="text-muted text-xs whitespace-nowrap">{dateStr(t.createdAt)}</td>
            </tr>
          ))}
          {!data.transactions.length && (
            <tr>
              <td colSpan={7} className="text-center text-muted py-6">
                {T("لا توجد معاملات")}
              </td>
            </tr>
          )}
        </DataTable>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}
