"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MapPin, Mail, Phone, Briefcase } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import HireModal from "@/components/HireModal"; // 1. استيراد مكون نافذة التوظيف
import type { ProfessionalPublic } from "@/lib/api";
import { PROFESSIONS } from "@/lib/professions";

type AuthUser = {
  id: string;
  role: "professional" | "employer";
};

// تعريف ممتد للـ TypeScript ليدعم الحقل الجديد كمصفوفة نصوص
type ProfessionalExtended = Omit<ProfessionalPublic, "profession"> & {
  professions?: string[];
  profession?: string;
  userRating?: number;
};

export default function ProfessionalProfilePage() {
  const t = useTranslations("profile");
  const tProf = useTranslations("professions");
  const tCard = useTranslations("card");
  const params = useParams();
  const id = params.id as string;

  const [professional, setProfessional] = useState<ProfessionalExtended | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    fetch(`/api/professionals/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProfessional(d);
        if (d.userRating) {
          setRating(d.userRating);
          setRated(true);
        }
      });

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, [id]);

  async function handleRate(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;

    setSubmitting(true);
    const res = await fetch(`/api/professionals/${id}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: rating, comment }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok && professional) {
      setRated(true);
      setProfessional({
        ...professional,
        averageRating: data.averageRating,
        ratingCount: data.ratingCount,
        userRating: rating,
      });
    }
  }

  if (!professional) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  // استخراج مصفوفة المهن بأمان وتغطية الحسابات القديمة التي تملك مهنة واحدة فقط
  const professionsList = Array.isArray(professional.professions)
    ? professional.professions
    : professional.profession
    ? [professional.profession]
    : [];

  // أيقونة البداية (تأخذ أول مهنة متوفرة أو علامة افتراضية للغلاف البصري البسيط)
  const firstProfKey = professionsList[0] || "";
  const mainProfessionIcon = PROFESSIONS.find((p) => p.key === firstProfKey)?.icon || "💼";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl card-shadow border border-[var(--border)] overflow-hidden">
        <div className="gradient-hero h-40 relative">
          <div className="absolute -bottom-16 start-8 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-xl">
            {professional.photo ? (
              <Image src={professional.photo} alt={professional.name} width={128} height={128} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl bg-slate-100">{mainProfessionIcon}</div>
            )}
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <h1 className="text-3xl font-bold">{professional.name}</h1>
          
          {/* 🟢 تم التعديل هنا: طباعة المهن المتعددة كبطاقات صغيرة (Chips) تفاعلية بدلاً من العنوان المشوه */}
          <div className="flex flex-wrap gap-2 mt-2">
            {professionsList.length > 0 ? (
              professionsList.map((profKey) => {
                const matched = PROFESSIONS.find((p) => p.key === profKey);
                // إذا كانت المهنة معرفة بالنظام نترجمها، وإذا كانت يدوية نطبع النص المكتوب مباشرة
                const finalLabel = matched ? tProf(profKey as any) : profKey;
                const finalIcon = matched ? matched.icon : "✨";

                return (
                  <span 
                    key={profKey} 
                    className="inline-flex items-center gap-1.5 bg-blue-50 text-[var(--primary)] border border-blue-100 px-3 py-1 rounded-full text-sm font-semibold shadow-2xs"
                  >
                    <span>{finalIcon}</span>
                    <span>{finalLabel}</span>
                  </span>
                );
              })
            ) : (
              <span className="text-slate-400 text-sm">لم يتم تحديد أي مهنة</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <RatingStars rating={professional.averageRating} />
            <span className="text-[var(--muted)] text-sm">
              ({professional.ratingCount} {tCard("reviews")})
            </span>
          </div>

          {professional.location && (
            <p className="flex items-center gap-2 text-[var(--muted)] mt-3">
              <MapPin className="w-4 h-4" /> {professional.location}
            </p>
          )}

          {/* 2. عرض زر "طلب توظيف" هنا إذا كان المستخدم المسجل هو صاحب شركة (Employer) */}
          {user && user.role === "employer" && (
            <div className="mt-6 max-w-xs">
              <HireModal 
                professionalId={professional._id || id} 
                professionalName={professional.name} 
              />
            </div>
          )}

          {professional.bio && (
            <div className="mt-6">
              <h2 className="font-bold text-lg mb-2">{t("about")}</h2>
              <p className="text-[var(--muted)] leading-relaxed">{professional.bio}</p>
            </div>
          )}

          {professional.skills && professional.skills.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-lg mb-3">{t("skills")}</h2>
              <div className="flex flex-wrap gap-2">
                {professional.skills.map((skill) => (
                  <span key={skill} className="bg-blue-50 text-[var(--primary)] px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {professional.workExperience && professional.workExperience.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-lg mb-3">{t("workHistory")}</h2>
              <div className="space-y-4">
                {professional.workExperience.map((exp, i) => (
                  <div key={i} className="border-s-4 border-[var(--primary)] ps-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-semibold">{exp.position}</span>
                      <span className="text-[var(--muted)]">— {exp.company}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {exp.startDate} {exp.endDate ? `→ ${exp.endDate}` : "→"}
                    </p>
                    {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <h2 className="font-bold text-lg mb-3">{t("contact")}</h2>
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-[var(--primary)]" /> {professional.email}
            </p>
            {professional.phone && (
              <p className="flex items-center gap-2 text-sm mt-2">
                <Phone className="w-4 h-4 text-[var(--primary)]" /> {professional.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl card-shadow border border-[var(--border)] p-6">
        <h2 className="font-bold text-lg mb-4">{t("rateThis")}</h2>

        {!user ? (
          <p className="text-[var(--muted)]">{t("loginToRate")}</p>
        ) : user.role !== "employer" ? (
          <p className="text-[var(--muted)]">{t("loginToRate")}</p>
        ) : rated ? (
          <div>
            <p className="text-green-600 mb-2">{t("alreadyRated")}</p>
            <RatingStars rating={rating} interactive value={rating} />
          </div>
        ) : (
          <form onSubmit={handleRate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("yourRating")}</label>
              <RatingStars rating={0} interactive value={rating} onChange={setRating} size="lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("comment")}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <button type="submit" disabled={!rating || submitting} className="btn-primary">
              {submitting ? "..." : t("submitRating")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}