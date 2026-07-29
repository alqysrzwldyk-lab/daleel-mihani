"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Wallet as WalletIcon, ArrowLeft, History, CreditCard, Plus, Star, Megaphone } from "lucide-react";

type Tx = {
  _id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  note?: string;
  createdAt: string;
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/wallet/transactions").then((r) => r.json()),
    ]).then(([w, t]) => {
      if (w.wallet) setBalance(w.wallet.balance);
      if (t.transactions) setTxs(t.transactions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusLabels: Record<string, { label: string; color: string }> = {
    completed: { label: "مكتمل", color: "text-emerald-600 bg-emerald-50" },
    pending: { label: "قيد الانتظار", color: "text-amber-600 bg-amber-50" },
    cancelled: { label: "ملغي", color: "text-red-600 bg-red-50" },
  };

  const typeLabels: Record<string, string> = {
    payment: "دفع",
    commission: "عمولة",
    deposit: "إيداع",
    withdrawal: "سحب",
    subscription: "اشتراك مميز",
    boost: "تعزيز إعلان",
  };

  const typeIcons: Record<string, string> = {
    payment: "💳",
    commission: "📊",
    deposit: "💰",
    withdrawal: "🏦",
    subscription: "⭐",
    boost: "🚀",
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <WalletIcon className="w-6 h-6 text-primary" />
        <h1>المحفظة</h1>
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-2xl mb-6" />
      ) : (
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <p className="text-emerald-100 text-sm mb-1">رصيد المحفظة</p>
          <p className="text-3xl font-extrabold">{balance.toLocaleString()} <span className="text-lg">﷼</span></p>
          <p className="text-emerald-200 text-xs mt-2">يمكنك استخدام الرصيد لتفعيل الباقة المميزة أو تعزيز الإعلانات</p>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <Link href="/subscription" className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-3 px-4 font-bold text-sm hover:bg-gray-50 transition">
          <Star className="w-4 h-4 text-amber-500" />
          الباقة المميزة
        </Link>
        <Link href="/dashboard/my-ads" className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-3 px-4 font-bold text-sm hover:bg-gray-50 transition">
          <Megaphone className="w-4 h-4 text-primary" />
          تعزيز إعلان
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-muted" />
        <h2 className="font-extrabold">سجل المعاملات</h2>
      </div>

      {txs.length === 0 ? (
        <div className="empty-state">
          <CreditCard />
          <h3>لا توجد معاملات</h3>
          <p>سجل معاملاتك المالية سيظهر هنا</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {txs.map((tx) => {
            const st = statusLabels[tx.status] || { label: tx.status, color: "text-gray-600 bg-gray-50" };
            return (
              <div key={tx._id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                <span className="text-xl">{typeIcons[tx.type] || "💳"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{tx.note || typeLabels[tx.type] || tx.type}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted">{new Date(tx.createdAt).toLocaleDateString("ar")}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${st.color}`}>{st.label}</span>
                  </div>
                </div>
                <span className={`font-extrabold text-sm ${tx.type === "deposit" ? "text-emerald-600" : "text-red-500"}`}>
                  {tx.type === "deposit" ? "+" : "-"}{tx.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767px) {
          .page-container { padding-bottom: 80px; }
        }
      `}</style>
    </div>
  );
}
