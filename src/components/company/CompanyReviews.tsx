"use client";

import { useState } from "react";
import { Star, MessageSquare, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import RatingStars from "@/components/RatingStars";
import { useT } from "@/lib/useT";
import type { CompanyReview } from "@/lib/companyTypes";

type Props = {
  companyId: string;
  companyName: string;
  reviews: CompanyReview[];
  averageRating: number;
  reviewsCount: number;
  ratingDistribution: Record<number, number>;
  userRating?: number;
  isOwner: boolean;
  isLoggedIn: boolean;
  onSubmitted: (review: CompanyReview, averageRating: number, reviewsCount: number, ratingDistribution: Record<number, number>) => void;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

// قسم تقييمات الشركة: الملخص + نموذج التقييم + قائمة التقييمات
export default function CompanyReviews({
  companyId,
  companyName,
  reviews,
  averageRating,
  reviewsCount,
  ratingDistribution,
  userRating,
  isOwner,
  isLoggedIn,
  onSubmitted,
}: Props) {
  const T = useT();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const maxCount = Math.max(...[1, 2, 3, 4, 5].map((s) => ratingDistribution[s] || 0), 1);

  const submit = async () => {
    if (rating === 0) {
      setError(T("اختر عدد النجوم أولاً"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/company/${companyId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "alreadyRated" ? T("لقد قيّمت هذه الشركة من قبل") : T(data.error || "فشل إرسال التقييم"));
        return;
      }
      onSubmitted(data.rating, data.averageRating, data.reviewsCount, data.ratingDistribution);
      setRating(0);
      setComment("");
    } catch {
      setError(T("حدث خطأ في الاتصال بالخادم"));
    } finally {
      setSubmitting(false);
    }
  };

  const canRate = isLoggedIn && !isOwner && !userRating;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8">
      <h2 className="text-lg font-black text-[var(--foreground)] mb-5 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
        {T("التقييمات والمراجعات")}
        {reviewsCount > 0 && (
          <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2.5 py-0.5 rounded-full">
            {reviewsCount}
          </span>
        )}
      </h2>

      {/* الملخص */}
      {reviewsCount > 0 && (
        <div className="grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <div className="text-center">
            <p className="text-5xl font-black text-[var(--foreground)]">{averageRating.toFixed(1)}</p>
            <div className="flex justify-center mt-1.5">
              <RatingStars rating={averageRating} size="sm" />
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-1.5">{T("{count} تقييم", { count: reviewsCount })}</p>
          </div>

          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0;
              const percent = Math.round((count / maxCount) * 100);
              return (
                <div key={star} className="flex items-center gap-2.5">
                  <span className="w-4 text-xs font-bold text-[var(--muted)] flex items-center gap-0.5">
                    {star}
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 bg-[var(--border-light)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-[var(--warning)] to-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-6 text-xs font-bold text-[var(--muted)] tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* نموذج التقييم */}
      {isOwner ? (
        <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3.5 mb-6 text-sm text-[var(--muted)]">
          <ShieldCheck className="w-5 h-5 text-[var(--success)] shrink-0" />
          {T("لا يمكنك تقييم شركتك الخاصة.")}
        </div>
      ) : userRating ? (
        <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3.5 mb-6 text-sm text-[var(--muted)]">
          <Star className="w-5 h-5 text-amber-400 shrink-0" />
          {T("قيّمت هذه الشركة بتقييم {rating} من 5. شكراً لمشاركتك!", { rating: userRating })}
        </div>
      ) : !isLoggedIn ? (
        <div className="flex items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3.5 mb-6 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            {T("سجّل دخولك لتقييم هذه الشركة")}
          </span>
          <Link href="/login" className="text-[var(--primary)] font-bold hover:underline shrink-0">
            {T("تسجيل الدخول")}
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <p className="text-sm font-bold text-[var(--foreground)] mb-3">{T("قيّم تجربتك مع {name}", { name: companyName })}</p>
          <div className="mb-3">
            <RatingStars rating={0} interactive value={rating} onChange={setRating} size="lg" />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={T("شارك تجربتك مع الشركة (اختياري)...")}
            className="input-field mb-3"
            rows={3}
            maxLength={1000}
          />
          {error && (
            <p className="text-xs text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-lg px-3 py-2 mb-3">
              {T(error)}
            </p>
          )}
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {T("إرسال التقييم")}
          </button>
        </div>
      )}

      {/* قائمة التقييمات */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center font-black text-sm shrink-0">
                    {review.reviewerName?.trim().charAt(0) || T("م")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">{review.reviewerName}</p>
                    <p className="text-[11px] text-[var(--muted)]">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <RatingStars rating={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MessageSquare />
          <h3>{T("لا توجد تقييمات بعد")}</h3>
          <p>{T("كن أول من يقيّم هذه الشركة!")}</p>
        </div>
      )}
    </div>
  );
}
