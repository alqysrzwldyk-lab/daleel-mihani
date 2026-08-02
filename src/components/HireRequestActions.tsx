"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Check, X, Loader2, MessageSquare } from "lucide-react";

type Props = {
  hireRequestId: string;
  status?: string;
  onResolved?: (status: string, conversationId?: string) => void;
};

export default function HireRequestActions({ hireRequestId, status, onResolved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState("");
  const [resolvedStatus, setResolvedStatus] = useState<string | null>(status || null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const finalStatus = resolvedStatus;

  if (finalStatus === "accepted" || finalStatus === "rejected") {
    return (
      <div className="mt-2 space-y-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
            finalStatus === "accepted" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}
        >
          {finalStatus === "accepted" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {finalStatus === "accepted" ? "تم قبول العرض" : "تم رفض العرض"}
        </span>
        {finalStatus === "accepted" && (conversationId || status === "accepted") && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/messages/${conversationId}`);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            فتح المحادثة
          </button>
        )}
      </div>
    );
  }

  async function respond(next: "accepted" | "rejected") {
    setLoading(next);
    setError("");
    try {
      const res = await fetch(`/api/hire/${hireRequestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setResolvedStatus(data.status);
        if (data.conversationId) setConversationId(data.conversationId);
        onResolved?.(data.status, data.conversationId);
        if (next === "accepted" && data.conversationId) {
          router.push(`/messages/${data.conversationId}`);
        }
      } else {
        setError(data.error || "حدث خطأ أثناء الرد");
      }
    } catch {
      setError("فشل الاتصال بالسيرفر");
    }
    setLoading(null);
  }

  return (
    <div className="mt-2.5">
      {error && <p className="text-[11px] text-red-500 mb-1.5">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            respond("accepted");
          }}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading === "accepted" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          قبول الطلب
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            respond("rejected");
          }}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition disabled:opacity-50"
        >
          {loading === "rejected" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          رفض الطلب
        </button>
      </div>
    </div>
  );
}
