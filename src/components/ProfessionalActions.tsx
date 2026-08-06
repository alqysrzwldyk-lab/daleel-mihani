"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import {
  Briefcase,
  MessageSquare,
  Phone,
  Share2,
  Check,
  Loader2,
  User,
  Building2,
} from "lucide-react";
import HireModal from "@/components/HireModal";
import type { ProfessionalPublic } from "@/lib/api";
import { getProfessionArabic } from "@/lib/professions";

type AuthUser = {
  id: string;
  role: "professional" | "employer";
};

// شريط الإجراءات الحديث أسفل تقييم المهني
export default function ProfessionalActions({
  professional,
  user,
}: {
  professional: ProfessionalPublic;
  user: AuthUser | null;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const profs = professional.professions?.length ? professional.professions : [professional.profession || "other"];

  async function sendMessage() {
    if (!user) {
      router.push("/login");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: professional.userId,
          content: `مرحباً ${professional.name}، أود التواصل معك بخصوص خدماتك المهنية`,
          refType: "professional",
          refId: professional._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/messages/${data.conversationId}`);
      } else {
        alert(data.error || "فشل إرسال الرسالة");
      }
    } catch {
      alert("فشل الاتصال بالسيرفر");
    } finally {
      setSending(false);
    }
  }

  async function shareProfile() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: professional.name, text: `ملف ${professional.name} المهني`, url });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="app-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm text-[var(--foreground)]">إجراءات سريعة</h2>
        {user?.role === "employer" && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2.5 py-1 rounded-full">
            <Building2 className="w-3 h-3" />
            عرض من شركة
          </span>
        )}
      </div>

      {user?.role === "employer" ? (
        <HireModal
          professionalId={professional._id}
          professionalName={professional.name}
          professionalPhoto={professional.photo}
          professionalProfession={profs.map((p) => getProfessionArabic(p)).join(" • ")}
          trigger={(open) => (
            <button
              onClick={open}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] text-white font-bold py-3.5 rounded-xl transition hover:opacity-95 shadow-md shadow-[var(--primary)]/20 active:scale-[0.98]"
            >
              <Briefcase className="w-5 h-5" />
              عرض عمل / طلب توظيف
            </button>
          )}
        />
      ) : (
        !user && (
          <button
            onClick={() => router.push("/login")}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] text-white font-bold py-3.5 rounded-xl transition hover:opacity-95 shadow-md shadow-[var(--primary)]/20 active:scale-[0.98]"
          >
            <Briefcase className="w-5 h-5" />
            سجّل دخول كشركة لإرسال عرض عمل
          </button>
        )
      )}

      {user && user.id !== professional.userId && (
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <button
            onClick={sendMessage}
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] font-bold text-sm hover:bg-[var(--primary)]/5 transition disabled:opacity-50 active:scale-[0.98]"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            رسالة
          </button>

          {professional.phone && (
            <a
              href={`tel:${professional.phone}`}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-bold text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] transition active:scale-[0.98]"
            >
              <Phone className="w-4 h-4" />
              اتصال
            </a>
          )}

          <button
            onClick={shareProfile}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-bold text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] transition active:scale-[0.98]"
          >
            {copied ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Share2 className="w-4 h-4" />}
            {copied ? "تم النسخ" : "مشاركة"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--border-light)]">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
          {professional.photo ? (
            <Image src={professional.photo} alt={professional.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
          ) : (
            <User className="w-5 h-5 text-[var(--muted-light)]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--foreground)] truncate">{professional.name}</p>
          <p className="text-xs text-[var(--muted)] truncate">
            {professional.specialization || profs.map((p) => getProfessionArabic(p)).join(" • ")}
          </p>
        </div>
      </div>
    </div>
  );
}
