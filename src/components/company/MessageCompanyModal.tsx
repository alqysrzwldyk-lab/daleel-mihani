"use client";

import { useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  companyUserId: string;
  companyId: string;
  companyName: string;
};

// نافذة مراسلة الشركة — تُرسل رسالة مباشرة لصاحب الشركة عبر نظام الرسائل
export default function MessageCompanyModal({
  open,
  onClose,
  companyUserId,
  companyId,
  companyName,
}: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: companyUserId,
          content: content.trim(),
          refType: "company",
          refId: companyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إرسال الرسالة");
        return;
      }
      onClose();
      router.push(`/messages/${data.conversationId}`);
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[var(--foreground)]">
            مراسلة {companyName}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--border-light)] transition">
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        <p className="text-sm text-[var(--muted)] mb-4">
          اكتب رسالتك وسيصلها مباشرة إلى فريق الشركة عبر رسائل الدليل.
        </p>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="مثال: أرغب بالاستفسار عن فرص العمل لدى شركتكم..."
          className="input-field mb-3"
          rows={4}
          maxLength={2000}
          autoFocus
        />

        {error && (
          <p className="text-xs text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <button
          onClick={send}
          disabled={sending || !content.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال الرسالة
        </button>
      </div>
    </div>
  );
}
