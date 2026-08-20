"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Briefcase, Star, MessageSquare, BadgeCheck } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import type { ProfessionalPublic } from "@/lib/api";
import { getProfessionIcon, getProfessionArabic } from "@/lib/professions";

type Props = {
  professional: ProfessionalPublic;
};

const AVAILABILITY_META: Record<string, { label: string; cls: string; icon: string }> = {
  available: { label: "متوفر", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: "🟢" },
  busy: { label: "مشغول", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: "🟠" },
  away: { label: "غير متاح", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: "⚪" },
};

export default function ProfessionalCard({ professional }: Props) {
  const T = useT();
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const profs = professional.professions?.length ? professional.professions : [professional.profession || "other"];
  const mainProfession = profs[0];
  const professionIcon = getProfessionIcon(mainProfession);
  const expYears = professional.workExperience?.length || 0;
  const expLabel = professional.experienceYears || (expYears > 0 ? `${expYears}` : "");
  const avail = professional.availability ? AVAILABILITY_META[professional.availability] : null;

  return (
    <Link href={`/professionals/${professional._id}`} className="block">
      <article className="pro-card">
        <div className="pro-card-header">
          <div className="pro-card-avatar">
            {professional.photo ? (
              <Image
                src={professional.photo}
                alt={professional.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl bg-slate-100">
                {professionIcon}
              </div>
            )}
          </div>
          {professional.verified && (
            <span className="absolute top-2 start-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-600 bg-white/90 border border-sky-100 px-1.5 py-0.5 rounded-full shadow-sm">
              <BadgeCheck className="w-3 h-3" />
              {T("موثق")}
            </span>
          )}
        </div>

        <div className="pro-card-body">
          <h3 className="font-bold text-base">{professional.name}</h3>
          <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
            {profs.map((p, i) => (
              <span key={p} className="text-primary font-medium text-xs">
                {getProfessionIcon(p)} {T(getProfessionArabic(p))}
                {i < profs.length - 1 && <span className="text-muted-light mx-0.5">|</span>}
              </span>
            ))}
          </div>

          {avail && (
            <div className="flex justify-center mt-1.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${avail.cls}`}>
                {avail.icon} {T(avail.label)}
              </span>
            </div>
          )}

          {professional.bio && (
            <p className="text-muted text-xs mt-2 line-clamp-2 leading-relaxed">{professional.bio}</p>
          )}

          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted">
            {professional.location && (
              <span className="stat">
                <MapPin />
                {professional.location}
              </span>
            )}
            {expLabel && (
              <span className="stat">
                <Briefcase />
                {expLabel} {T("خبرة")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(professional.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              ))}
            </div>
            {professional.ratingCount > 0 && (
              <span className="text-[11px] text-muted">
                ({professional.ratingCount})
              </span>
            )}
          </div>

          {professional.skills?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {professional.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="skill-tag text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={async (e) => {
              e.preventDefault();
              setSending(true);
              try {
                const res = await fetch("/api/auth/me");
                const d = await res.json();
                if (!d.user) { router.push("/login"); return; }
                if (d.user.id === professional.userId) { setSending(false); return; }
                const msgRes = await fetch("/api/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    receiverId: professional.userId,
                    content: T("مرحباً {name}، أود التواصل معك بخصوص خدماتك المهنية", { name: professional.name }),
                    refType: "professional",
                    refId: professional._id,
                  }),
                });
                const msgData = await msgRes.json();
                if (msgRes.ok) {
                  router.push(`/messages/${msgData.conversationId}`);
                } else {
                  alert(msgData.error || T("فشل إرسال الرسالة"));
                }
              } catch {}
              setSending(false);
            }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {sending ? T("جاري...") : T("تواصل")}
          </button>
        </div>
      </article>
    </Link>
  );
}
