"use client";

import { useState } from "react";
import { useFetch, apiSend } from "../_components/useFetch";
import { StatusPill, dateStr, Pagination } from "../_components/ui";
import { Link } from "@/i18n/navigation";
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Coins,
  Clock,
  Landmark,
  Send,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { useT } from "@/lib/useT";

type Transaction = {
  id: string;
  fromUserId: string | null;
  fromName: string;
  amount: number;
  type: string;
  currency: string;
  status: string;
  note: string;
  createdAt: Date;
};

type Deposit = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  metadata: Record<string, unknown>;
  note: string;
  createdAt: Date;
};

type WalletData = {
  wallet: { balance: number; currency: string };
  platformRevenue: number;
  pendingDepositsCount: number;
  pendingPaymentsCount: number;
  recentTransactions: Transaction[];
};

type DepositsData = {
  deposits: Deposit[];
  total: number;
  page: number;
  totalPages: number;
};

export default function AdminWalletPage() {
  const T = useT();
  const { data, loading, error } = useFetch<WalletData>("/api/admin/wallet");
  const [depositPage, setDepositPage] = useState(1);
  const [depositFilter, setDepositFilter] = useState("pending");
  const [depositMethod, setDepositMethod] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const depositsUrl = `/api/admin/wallet/deposits?status=${depositFilter}&method=${depositMethod}&page=${depositPage}`;
  const {
    data: depositsData,
    loading: depositsLoading,
    reload: reloadDeposits,
  } = useFetch<DepositsData>(depositsUrl);

  async function reviewDeposit(id: string, action: "approve" | "reject") {
    setReviewingId(id);
    try {
      const result = await apiSend(
        `/api/admin/wallet/deposits/${id}`,
        "PATCH",
        { action, note: action === "approve" ? "تمت المراجعة والموافقة" : "" }
      );
      if (result.success) {
        reloadDeposits();
      }
    } catch {
      // silently fail
    }
    setReviewingId(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-danger">{T("تعذّر تحميل البيانات.")}</p>
    );
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("محفظة التطبيق")}</h1>
      <p className="admin-page-subtitle">
        {T("جميع المدفوعات من المهنيين والشركات تصل إلى محفظة التطبيق")}
      </p>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-emerald-100" />
          <p className="text-emerald-100 text-sm">
            {T("محفظة التطبيق (أموال المستخدمين + الأرباح)")}
          </p>
        </div>
        <p className="text-4xl font-extrabold">
          {data.wallet.balance.toLocaleString()}{" "}
          <span className="text-lg">{data.wallet.currency}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="text-[11px] text-blue-600 font-bold">
              {T("إيرادات المنصة")}
            </p>
          </div>
          <p className="text-xl font-extrabold text-blue-700">
            {data.platformRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-blue-500">
            {T("اشتراكات + تعزيز فقط")}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-amber-600" />
            <p className="text-[11px] text-amber-600 font-bold">
              {T("الودائع المعلقة")}
            </p>
          </div>
          <p className="text-xl font-extrabold text-amber-700">
            {data.pendingDepositsCount}
          </p>
          <p className="text-[10px] text-amber-500">
            {T("تحويل بنكي + حوالة")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-extrabold">{T("آخر المعاملات")}</h2>
        <Link
          href="/admin/transactions"
          className="text-xs text-primary font-bold hover:underline"
        >
          {T("كل المعاملات")}
        </Link>
      </div>

      {data.recentTransactions.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center mb-6">
          <Wallet className="w-8 h-8 mx-auto text-muted mb-2" />
          <p className="text-sm text-muted">{T("لا توجد معاملات")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="admin-table min-w-full">
            <thead>
              <tr>
                <th>{T("المستخدم")}</th>
                <th>{T("النوع")}</th>
                <th>{T("المبلغ")}</th>
                <th>{T("الحالة")}</th>
                <th>{T("التاريخ")}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((d) => (
                <tr key={d.id}>
                  <td className="font-bold">{d.fromName || "—"}</td>
                  <td>
                    <StatusPill value={d.type} />
                  </td>
                  <td className="font-extrabold whitespace-nowrap">
                    +{d.amount.toLocaleString()} {d.currency}
                  </td>
                  <td>
                    <StatusPill value={d.status} />
                  </td>
                  <td className="text-muted text-xs whitespace-nowrap">
                    {dateStr(d.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 mt-8">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h2 className="font-extrabold">{T("مراجعة الإيداعات")}</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <select
          className="admin-input"
          value={depositFilter}
          onChange={(e) => {
            setDepositFilter(e.target.value);
            setDepositPage(1);
          }}
        >
          <option value="pending">{T("معلّق")}</option>
          <option value="completed">{T("مكتمل")}</option>
          <option value="failed">{T("ملغي / فاشل")}</option>
        </select>
        <select
          className="admin-input"
          value={depositMethod}
          onChange={(e) => {
            setDepositMethod(e.target.value);
            setDepositPage(1);
          }}
        >
          <option value="">{T("كل الأنواع")}</option>
          <option value="bank">{T("تحويل بنكي")}</option>
          <option value="transfer">{T("حوالة")}</option>
        </select>
      </div>

      {depositsLoading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : !depositsData || depositsData.deposits.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
          <p className="text-sm text-muted">{T("لا توجد إيداعات")}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="admin-table min-w-full">
              <thead>
                <tr>
                  <th>{T("المستخدم")}</th>
                  <th>{T("المبلغ")}</th>
                  <th>{T("الطريقة")}</th>
                  <th>{T("الحالة")}</th>
                  <th>{T("التاريخ")}</th>
                  <th>{T("إجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {depositsData.deposits.map((d) => {
                  const methodIcons: Record<string, React.ReactNode> = {
                    bank: <Landmark className="w-4 h-4" />,
                    transfer: <Send className="w-4 h-4" />,
                  };
                  const methodLabels: Record<string, string> = {
                    bank: "تحويل بنكي",
                    transfer: "حوالة",
                  };
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="font-bold">{d.userName || "—"}</div>
                        <div className="text-[10px] text-muted">
                          {d.userEmail}
                        </div>
                      </td>
                      <td className="font-extrabold whitespace-nowrap">
                        {d.amount.toLocaleString()} {d.currency}
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-xs">
                          {methodIcons[d.method]}
                          {T(methodLabels[d.method] || d.method)}
                        </span>
                      </td>
                      <td>
                        <StatusPill value={d.status} />
                      </td>
                      <td className="text-muted text-xs whitespace-nowrap">
                        {dateStr(d.createdAt)}
                      </td>
                      <td>
                        {["pending", "processing"].includes(d.status) && (
                          <div className="flex gap-1">
                            {reviewingId === d.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <button
                                  onClick={() => reviewDeposit(d.id, "approve")}
                                  className="admin-action-btn text-emerald-600 hover:bg-emerald-50"
                                  title={T("approve")}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => reviewDeposit(d.id, "reject")}
                                  className="admin-action-btn text-red-600 hover:bg-red-50"
                                  title={T("reject")}
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={depositsData.page}
            totalPages={depositsData.totalPages}
            onPage={setDepositPage}
          />
        </>
      )}
    </div>
  );
}
