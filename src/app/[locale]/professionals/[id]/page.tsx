"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MapPin, Mail, Phone, Briefcase, Star, ArrowLeft } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import HireModal from "@/components/HireModal";
import type { ProfessionalPublic } from "@/lib/api";
import { getProfessionArabic, getProfessionIcon } from "@/lib/professions";

type AuthUser = {
  id: string;
  role: "professional" | "employer";
};

export default function ProfessionalProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [professional, setProfessional] = useState<(ProfessionalPublic & { userRating?: number }) | null>(null);
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
      <div className="page-container">
        <div className="skeleton h-64 rounded-xl mb-4" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  const profs = professional.professions?.length ? professional.professions : [professional.profession || "other"];

  return (
    <div className="page-container">
      <button onClick={() => router.back()} className="back-btn mb-4">
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="app-card overflow-hidden">
        <div className="h-32 bg-gradient-to-l from-blue-600 via-blue-500 to-sky-400 relative">
          <div className="absolute -bottom-12 right-6 w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-xl">
            {professional.photo ? (
              <Image src={professional.photo} alt={professional.name} width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100">{getProfessionIcon(profs[0])}</div>
            )}
          </div>
        </div>

        <div className="pt-14 px-5 pb-5">
          <div className="text-right">
            <h1 className="text-2xl font-bold">{professional.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {profs.map((p, i) => (
                <span key={p} className="text-primary font-semibold text-sm">
                  {getProfessionIcon(p)} {getProfessionArabic(p)}
                  {i < profs.length - 1 && <span className="text-muted-light mx-1">|</span>}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <RatingStars rating={professional.averageRating} />
              <span className="text-xs text-muted">
                ({professional.ratingCount} تقييم)
              </span>
            </div>

            {professional.location && (
              <p className="flex items-center gap-1.5 text-sm text-muted mt-2">
                <MapPin className="w-4 h-4" /> {professional.location}
              </p>
            )}
          </div>

          {user?.role === "employer" && (
            <div className="mt-5">
              <HireModal
                professionalId={professional._id || id}
                professionalName={professional.name}
              />
            </div>
          )}

          {professional.bio && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-2">{t("about")}</h2>
              <p className="text-sm text-muted leading-relaxed">{professional.bio}</p>
            </div>
          )}

          {professional.skills?.length > 0 && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-3">{t("skills")}</h2>
              <div className="flex flex-wrap gap-2">
                {professional.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {professional.workExperience?.length > 0 && (
            <div className="mt-5">
              <h2 className="font-bold text-sm mb-3">{t("workHistory")}</h2>
              <div className="space-y-3">
                {professional.workExperience.map((exp, i) => (
                  <div key={i} className="border-s-[3px] border-primary ps-4 py-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{exp.position}</span>
                      <span className="text-xs text-muted">— {exp.company}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {exp.startDate} {exp.endDate ? `→ ${exp.endDate}` : "→ حتى الآن"}
                    </p>
                    {exp.description && <p className="text-xs text-muted mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 bg-slate-50 rounded-xl p-4">
            <h2 className="font-bold text-sm mb-3">{t("contact")}</h2>
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-primary" /> {professional.email}
            </p>
            {professional.phone && (
              <p className="flex items-center gap-2 text-sm mt-2">
                <Phone className="w-4 h-4 text-primary" /> {professional.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="app-card p-5 mt-4">
        <h2 className="font-bold text-sm mb-4">{t("rateThis")}</h2>

        {!user || user.role !== "employer" ? (
          <p className="text-muted text-sm">{t("loginToRate")}</p>
        ) : rated ? (
          <div>
            <p className="text-success text-sm mb-2">{t("alreadyRated")}</p>
            <RatingStars rating={rating} interactive value={rating} />
          </div>
        ) : (
          <form onSubmit={handleRate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("yourRating")}</label>
              <RatingStars rating={0} interactive value={rating} onChange={setRating} size="lg" />
            </div>
            <div className="input-group">
              <label className="input-label">{t("comment")}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <button type="submit" disabled={!rating || submitting} className="btn btn-primary btn-block">
              {submitting ? "..." : t("submitRating")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
