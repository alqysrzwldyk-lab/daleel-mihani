"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Wallet as WalletIcon,
  History,
  CreditCard,
  Plus,
  Coins,
  Star,
  Megaphone,
  Loader2,
  Landmark,
  ShieldCheck,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useT } from "@/lib/useT";

type Tx = {
  _id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  note?: string;
  createdAt: string;
};

type PaymentRecord = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  note?: string;
  createdAt: string;
};

type WalletData = {
  wallet: { balance: number; currency: string };
  transactions: Tx[];
  deposits: Tx[];
  payments: PaymentRecord[];
};

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  completed: { label: "مكتمل", color: "text-emerald-600 bg-emerald-50", icon: "check" },
  pending: { label: "بانتظار المراجعة", color: "text-amber-600 bg-amber-50", icon: "clock" },
  processing: { label: "جاري المعالجة", color: "text-blue-600 bg-blue-50", icon: "clock" },
  cancelled: { label: "ملغي", color: "text-gray-600 bg-gray-50", icon: "x" },
  failed: { label: "فشل", color: "text-red-600 bg-red-50", icon: "x" },
  refunded: { label: "مسترد", color: "text-purple-600 bg-purple-50", icon: "check" },
  expired: { label: "منتهي", color: "text-gray-600 bg-gray-50", icon: "x" },
};

const TYPE_LABELS: Record<string, string> = {
  payment: "دفع",
  commission: "عمولة",
  deposit: "إيداع",
  bank_transfer: "تحويل بنكي",
  remittance: "حوالة مالية",
  withdrawal: "سحب",
  subscription: "اشتراك مميز",
  boost: "تعزيز إعلان",
  refund: "استرداد",
};

const TYPE_ICONS: Record<string, string> = {
  deposit: "💰",
  bank_transfer: "🏦",
  remittance: "✈️",
  payment: "💳",
  commission: "📊",
  withdrawal: "🏦",
  subscription: "⭐",
  boost: "🚀",
  refund: "↩️",
};

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "bank" | "transfer">("card");

  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  const [transferSenderName, setTransferSenderName] = useState("");
  const [transferRefNumber, setTransferRefNumber] = useState("");
  const [transferProvider, setTransferProvider] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const T = useT();

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/wallet/transactions").then((r) => r.json()),
      fetch("/api/wallet/deposit").then((r) => r.json()),
    ])
      .then(([w, t, d]) => {
        setData({
          wallet: w.wallet || { balance: 0, currency: "YER" },
          transactions: t.transactions || [],
          deposits: d.deposits || [],
          payments: d.payments || [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function submitDeposit() {
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt < 100) {
      setMessage(T("المبلغ يجب أن يكون 100 على الأقل"));
      return;
    }

    if (method === "bank") {
      if (!bankAccountName.trim() || !bankAccountNumber.trim() || !bankName.trim()) {
        setMessage(T("بيانات الحساب البنكي غير صحيحة"));
        return;
      }
    } else if (method === "transfer") {
      if (!transferSenderName.trim() || !transferRefNumber.trim() || !transferProvider.trim()) {
        setMessage(T("بيانات الحوالة غير مكتملة"));
        return;
      }
    }

    setSending(true);
    setMessage("");
    try {
      let body: Record<string, unknown>;
      if (method === "card") {
        body = { amount: amt, method: "card" };
      } else if (method === "bank") {
        body = {
          amount: amt,
          method: "bank",
          bank: { accountName: bankAccountName, accountNumber: bankAccountNumber, bankName },
        };
      } else {
        body = {
          amount: amt,
          method: "transfer",
          transfer: {
            senderName: transferSenderName,
            referenceNumber: transferRefNumber,
            provider: transferProvider,
            recipientName: transferRecipient || undefined,
          },
        };
      }

      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok) {
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }
        setAmount("");
        setBankName("");
        setBankAccountName("");
        setBankAccountNumber("");
        setTransferSenderName("");
        setTransferRefNumber("");
        setTransferProvider("");
        setTransferRecipient("");
        setMessage(
          result.status === "pending"
            ? `${T("تم إرسال طلبك بنجاح!")} ${T("في انتظار المراجعة من الإدارة.")}`
            : `${T("تم شحن محفظتك بنجاح!")}`
        );
        load();
      } else {
        setMessage(T(result.error || "فشل شحن المحفظة"));
      }
    } catch {
      setMessage(T("فشل شحن المحفظة"));
    }
    setSending(false);
  }

  const success = message.includes("نجاح") || message.toLowerCase().includes("success");

  const totalSpent = (data?.transactions || [])
    .filter((t) => !["deposit", "bank_transfer", "remittance", "refund"].includes(t.type) && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeposited = (data?.payments || [])
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <WalletIcon className="w-6 h-6 text-primary" />
        <h1>{T("المحفظة")}</h1>
      </div>

      {loading ? (
        <div className="space-y-4 mb-6">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white mb-4 shadow-lg">
            <p className="text-emerald-100 text-sm mb-1">{T("رصيد المحفظة")}</p>
            <p className="text-3xl font-extrabold">
              {data.wallet.balance.toLocaleString()}{" "}
              <span className="text-lg">﷼</span>
            </p>
            <p className="text-emerald-200 text-xs mt-2">
              {T("الدفع يتم من رصيد المحفظة تلقائياً")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] text-muted">{T("إجمالي الإيداعات")}</span>
              </div>
              <p className="text-sm font-extrabold">{totalDeposited.toLocaleString()} ﷼</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownLeft className="w-4 h-4 text-red-500" />
                <span className="text-[11px] text-muted">{T("إجمالي المصروفات")}</span>
              </div>
              <p className="text-sm font-extrabold">{totalSpent.toLocaleString()} ﷼</p>
            </div>
          </div>
        </>
      ) : null}

      {message && (
        <div
          className={`p-4 rounded-xl mb-4 text-sm font-bold ${
            success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <Link
          href="/subscription"
          className="flex-1 flex items-center justify-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 font-bold text-sm hover:bg-[var(--border-light)] transition"
        >
          <Star className="w-4 h-4 text-amber-500" />
          {T("الباقة المميزة")}
        </Link>
        <Link
          href="/dashboard/my-ads"
          className="flex-1 flex items-center justify-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl py-3 px-4 font-bold text-sm hover:bg-[var(--border-light)] transition"
        >
          <Megaphone className="w-4 h-4 text-primary" />
          {T("تعزيز إعلان")}
        </Link>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="w-5 h-5 text-primary" />
          <h2 className="font-extrabold">{T("شحن المحفظة")}</h2>
        </div>
        <p className="text-xs text-muted mb-4">
          {T("اختر طريقة الدفع المناسبة لك")}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setMethod("card")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-3 font-bold text-sm border-2 transition ${
              method === "card"
                ? "border-primary bg-primary/5 text-primary"
                : "border-[var(--border)] text-muted hover:border-[var(--border-light)]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {T("بطاقة")}
          </button>
          <button
            onClick={() => setMethod("bank")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-3 font-bold text-sm border-2 transition ${
              method === "bank"
                ? "border-primary bg-primary/5 text-primary"
                : "border-[var(--border)] text-muted hover:border-[var(--border-light)]"
            }`}
          >
            <Landmark className="w-4 h-4" />
            {T("بنك")}
          </button>
          <button
            onClick={() => setMethod("transfer")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-3 font-bold text-sm border-2 transition ${
              method === "transfer"
                ? "border-primary bg-primary/5 text-primary"
                : "border-[var(--border)] text-muted hover:border-[var(--border-light)]"
            }`}
          >
            <Send className="w-4 h-4" />
            {T("حوالة")}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className={`chip ${Number(amount) === q ? "active" : ""}`}
            >
              {q.toLocaleString()} ﷼
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min={100}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={T("المبلغ")}
            className="input flex-1"
          />
        </div>

        {method === "card" && (
          <div className="flex flex-col gap-2 mb-4">
            <p className="text-xs text-muted flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {T("ستتم مشاركتك مع بوابة دفع آمنة لإتمام المعاملة")}
            </p>
          </div>
        )}

        {method === "bank" && (
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={T("اسم البنك")}
              className="input"
            />
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder={T("اسم صاحب الحساب")}
              className="input"
            />
            <input
              type="text"
              inputMode="numeric"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder={T("رقم الحساب")}
              className="input"
              dir="ltr"
            />
            <p className="text-[11px] text-amber-600">
              {T("سيتم مراجعة التحويل من الإدارة قبل إضافة الرصيد")}
            </p>
          </div>
        )}

        {method === "transfer" && (
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              value={transferSenderName}
              onChange={(e) => setTransferSenderName(e.target.value)}
              placeholder={T("اسم المرسل")}
              className="input"
            />
            <input
              type="text"
              value={transferRefNumber}
              onChange={(e) => setTransferRefNumber(e.target.value)}
              placeholder={T("رقم المرجع")}
              className="input"
            />
            <input
              type="text"
              value={transferProvider}
              onChange={(e) => setTransferProvider(e.target.value)}
              placeholder={T("اسم مزود الخدمة")}
              className="input"
            />
            <input
              type="text"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              placeholder={`${T("اسم المستلم")} (${T("اختياري")})`}
              className="input"
            />
            <p className="text-[11px] text-amber-600">
              {T("سيتم مراجعة الحوالة من الإدارة قبل إضافة الرصيد")}
            </p>
          </div>
        )}

        <button
          onClick={submitDeposit}
          disabled={sending}
          className="w-full btn btn-primary font-bold py-3"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : method === "card" ? (
            `${T("الدفع عبر البوابة")} · ${Number(amount) ? Number(amount).toLocaleString() : ""} ﷼`
          ) : (
            `${T("إرسال الطلب")} · ${Number(amount) ? Number(amount).toLocaleString() : ""} ﷼`
          )}
        </button>
      </div>

      {data && data.payments.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-muted" />
            <h2 className="font-extrabold">{T("عمليات الشحن")}</h2>
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {data.payments.map((p) => {
              const st = STATUS_CONFIG[p.status] || {
                label: p.status,
                color: "text-[var(--muted)] bg-[var(--border-light)]",
                icon: "clock",
              };
              const methodLabels: Record<string, string> = {
                card: "بطاقة",
                bank: "تحويل بنكي",
                transfer: "حوالة",
              };
              return (
                <div
                  key={p.id}
                  className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border-light)] flex items-center gap-3"
                >
                  <span className="text-xl">
                    {p.method === "card" ? "💳" : p.method === "bank" ? "🏦" : "✈️"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">
                      {methodLabels[p.method] || p.method}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted">
                        {new Date(p.createdAt).toLocaleDateString("ar")}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${st.color}`}
                      >
                        {T(st.label)}
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-600">
                    +{p.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-muted" />
        <h2 className="font-extrabold">{T("سجل المعاملات")}</h2>
      </div>

      {(!data || data.transactions.length === 0) ? (
        <div className="empty-state">
          <CreditCard />
          <h3>{T("لا توجد معاملات")}</h3>
          <p>{T("سجل معاملاتك المالية سيظهر هنا")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data!.transactions.map((tx) => {
            const st = STATUS_CONFIG[tx.status] || {
              label: tx.status,
              color: "text-[var(--muted)] bg-[var(--border-light)]",
              icon: "clock",
            };
            const isCredit =
              ["deposit", "bank_transfer", "remittance", "refund"].includes(tx.type) &&
              tx.status === "completed";
            return (
              <div
                key={tx._id}
                className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border-light)] flex items-center gap-3"
              >
                <span className="text-xl">{TYPE_ICONS[tx.type] || "💳"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">
                    {tx.note || T(TYPE_LABELS[tx.type] || "") || tx.type}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted">
                      {new Date(tx.createdAt).toLocaleDateString("ar")}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${st.color}`}
                    >
                      {T(st.label)}
                    </span>
                  </div>
                </div>
                <span
                  className={`font-extrabold text-sm ${
                    isCredit ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {isCredit ? "+" : "-"}
                  {tx.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767px) {
          .page-container {
            padding-bottom: 80px;
          }
        }
      `}</style>
    </div>
  );
}
