"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Briefcase, Star, MessageSquare } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import type { ProfessionalPublic } from "@/lib/api";
import { getProfessionIcon, getProfessionArabic } from "@/lib/professions";

type Props = {
  professional: ProfessionalPublic;
};

export default function ProfessionalCard({ professional }: Props) {
  const t = useTranslations("card");
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const profs = professional.professions?.length ? professional.professions : [professional.profession || "other"];
  const mainProfession = profs[0];
  const professionIcon = getProfessionIcon(mainProfession);
  const expYears = professional.workExperience?.length || 0;

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
        </div>

        <div className="pro-card-body">
          <h3 className="font-bold text-base">{professional.name}</h3>
          <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
            {profs.map((p, i) => (
              <span key={p} className="text-primary font-medium text-xs">
                {getProfessionIcon(p)} {getProfessionArabic(p)}
                {i < profs.length - 1 && <span className="text-muted-light mx-0.5">|</span>}
              </span>
            ))}
          </div>

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
            {expYears > 0 && (
              <span className="stat">
                <Briefcase />
                {expYears} {t("experience")}
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
                const msgRes = await fetch("/api/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    receiverId: professional._id,
                    content: `مرحباً ${professional.name}، أود التواصل معك بخصوص خدماتك المهنية`,
                    refType: "professional",
                    refId: professional._id,
                  }),
                });
                const msgData = await msgRes.json();
                if (msgRes.ok) {
                  router.push(`/messages/${msgData.conversationId}`);
                }
              } catch {}
              setSending(false);
            }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {sending ? "جاري..." : "تواصل"}
          </button>
        </div>
      </article>
    </Link>
  );
}
