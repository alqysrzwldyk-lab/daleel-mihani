"use client";

import { useState } from "react";
import { Check, Share2, Link2, Copy, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useT } from "@/lib/useT";

type Props = {
  open: boolean;
  onClose: () => void;
  companyName: string;
};

// نافذة مشاركة ملف الشركة عبر الروابط ووسائل التواصل
export default function ShareCompany({ open, onClose, companyName }: Props) {
  const params = useParams();
  const T = useT();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: companyName, url });
      } catch {}
    }
  };

  const links = [
    {
      name: "واتساب",
      href: `https://wa.me/?text=${encodeURIComponent(`${companyName} — ${url}`)}`,
      color: "bg-[#25D366]/10 text-[#25D366]",
    },
    {
      name: "تيليجرام",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(companyName)}`,
      color: "bg-[#229ED9]/10 text-[#229ED9]",
    },
    {
      name: "فيسبوك",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "bg-[#1877F2]/10 text-[#1877F2]",
    },
    {
      name: "إكس",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(companyName)}`,
      color: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[var(--primary)]" />
            {T("مشاركة الشركة")}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--border-light)] transition">
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        <p className="text-sm text-[var(--muted)] mb-5">
          {T("شارك ملف {name} مع الآخرين عبر الروابط التالية:", { name: companyName })}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${l.color} rounded-xl py-3 flex flex-col items-center gap-1.5 font-bold text-xs transition hover:scale-[1.03]`}
            >
              <span className="text-lg leading-none">{T(l.name)}</span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2 ps-4">
          <Link2 className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <span className="flex-1 truncate text-sm text-[var(--muted)]" dir="ltr">
            {url}
          </span>
          <button
            onClick={copyLink}
            className="shrink-0 inline-flex items-center gap-1.5 bg-[var(--primary)] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition hover:bg-[var(--primary-dark)]"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? T("تم النسخ") : T("نسخ الرابط")}
          </button>
        </div>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={nativeShare}
            className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-bold text-[var(--primary)] border border-[var(--primary)]/30 bg-[var(--primary)]/5 py-3 rounded-xl transition hover:bg-[var(--primary)]/10"
          >
            <Share2 className="w-4 h-4" />
            {T("مشاركة عبر التطبيقات الأخرى")}
          </button>
        )}
      </div>
    </div>
  );
}
