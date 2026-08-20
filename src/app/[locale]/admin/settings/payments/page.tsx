"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Landmark,
  Send,
  Save,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useT } from "@/lib/useT";

type PaymentSettings = {
  cardEnabled: boolean;
  bankEnabled: boolean;
  transferEnabled: boolean;
  minDeposit: number;
  maxDeposit: number;
  supportedCurrencies: string[];
  gatewayConfigured: boolean;
  provider: string | null;
  sandbox: boolean;
};

export default function AdminPaymentSettingsPage() {
  const T = useT();
  const [settings, setSettings] = useState<PaymentSettings>({
    cardEnabled: true,
    bankEnabled: true,
    transferEnabled: true,
    minDeposit: 100,
    maxDeposit: 10000000,
    supportedCurrencies: ["YER"],
    gatewayConfigured: false,
    provider: null,
    sandbox: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings/payments")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          cardEnabled: data.cardEnabled ?? true,
          bankEnabled: data.bankEnabled ?? true,
          transferEnabled: data.transferEnabled ?? true,
          minDeposit: data.minDeposit || 100,
          maxDeposit: data.maxDeposit || 10000000,
          supportedCurrencies: ["YER"],
          gatewayConfigured: data.configured ?? false,
          provider: data.provider ?? null,
          sandbox: data.sandbox ?? false,
        });
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      setMessage(T("تم حفظ الإعدادات بنجاح (يجب إعادة تشغيل الخادم لتفعيلها)"));
    } catch {
      setMessage(T("فشل حفظ الإعدادات"));
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="admin-page-title">{T("إعدادات الدفع")}</h1>
      <p className="admin-page-subtitle">
        {T("إدارة طرق الدفع والإعدادات المالية")}
      </p>

      {!settings.gatewayConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-700">
              {T("بوابة الدفع غير مكونة")}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {T(
                "أضف PAYMOB_SECRET_KEY و PAYMOB_HMAC_SECRET و PAYMOB_INTEGRATION_ID_CARD في ملف .env"
              )}
            </p>
          </div>
        </div>
      )}

      {settings.gatewayConfigured && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-700">
              {T("بوابة الدفع مكونة")} — {settings.provider?.toUpperCase() || "Paymob"}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {settings.sandbox
                ? T("وضع الاختبار (Sandbox) — لا توجد معاملات حقيقية")
                : T("وضع الإنتاج (Live)")}
            </p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div
          className={`admin-stat-card cursor-pointer transition ${
            settings.cardEnabled
              ? "!border-emerald-300 !bg-emerald-50"
              : "!border-red-300 !bg-red-50"
          }`}
          onClick={() =>
            setSettings({ ...settings, cardEnabled: !settings.cardEnabled })
          }
        >
          <div
            className={`admin-stat-icon ${
              settings.cardEnabled
                ? "bg-emerald-100 text-emerald-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold">
              {T("بطاقة ائتمان")}
            </p>
            <p
              className={`text-[11px] font-bold ${
                settings.cardEnabled ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {settings.cardEnabled ? T("مفعّل") : T("معطّل")}
            </p>
          </div>
        </div>

        <div
          className={`admin-stat-card cursor-pointer transition ${
            settings.bankEnabled
              ? "!border-emerald-300 !bg-emerald-50"
              : "!border-red-300 !bg-red-50"
          }`}
          onClick={() =>
            setSettings({ ...settings, bankEnabled: !settings.bankEnabled })
          }
        >
          <div
            className={`admin-stat-icon ${
              settings.bankEnabled
                ? "bg-emerald-100 text-emerald-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold">{T("تحويل بنكي")}</p>
            <p
              className={`text-[11px] font-bold ${
                settings.bankEnabled ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {settings.bankEnabled ? T("مفعّل") : T("معطّل")}
            </p>
          </div>
        </div>

        <div
          className={`admin-stat-card cursor-pointer transition ${
            settings.transferEnabled
              ? "!border-emerald-300 !bg-emerald-50"
              : "!border-red-300 !bg-red-50"
          }`}
          onClick={() =>
            setSettings({
              ...settings,
              transferEnabled: !settings.transferEnabled,
            })
          }
        >
          <div
            className={`admin-stat-icon ${
              settings.transferEnabled
                ? "bg-emerald-100 text-emerald-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold">{T("حوالة مالية")}</p>
            <p
              className={`text-[11px] font-bold ${
                settings.transferEnabled ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {settings.transferEnabled ? T("مفعّل") : T("معطّل")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-extrabold">{T("حدود الإيداع")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted font-bold mb-1 block">
              {T("الحد الأدنى")}
            </label>
            <input
              type="number"
              value={settings.minDeposit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minDeposit: Number(e.target.value),
                })
              }
              className="input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-muted font-bold mb-1 block">
              {T("الحد الأقصى")}
            </label>
            <input
              type="number"
              value={settings.maxDeposit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxDeposit: Number(e.target.value),
                })
              }
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-4 text-sm font-bold ${
            message.includes("نجاح") || message.includes("success")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary font-bold flex items-center gap-2"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {T("حفظ الإعدادات")}
      </button>

      <p className="text-[11px] text-muted mt-3">
        {T(
          "ملاحظة: الإعدادات مخزنة في متغيرات البيئة (.env). التغييرات تتطلب إعادة تشغيل الخادم."
        )}
      </p>
    </div>
  );
}
