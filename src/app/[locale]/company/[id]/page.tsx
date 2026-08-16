"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import dynamic from "next/dynamic";
import CompanySkeleton from "@/components/company/CompanySkeleton";
import CompanyHeader from "@/components/company/CompanyHeader";
import CompanyStats from "@/components/company/CompanyStats";
import CompanyAbout from "@/components/company/CompanyAbout";
import CompanyServices from "@/components/company/CompanyServices";
import CompanyInfo from "@/components/company/CompanyInfo";
import CompanyJobs from "@/components/company/CompanyJobs";
import CompanyGallery from "@/components/company/CompanyGallery";
import CompanyLocation from "@/components/company/CompanyLocation";
import CompanyContact from "@/components/company/CompanyContact";
import CompanyReviews from "@/components/company/CompanyReviews";
import SimilarCompanies from "@/components/company/SimilarCompanies";
import type {
  CompanyProfileData,
  CompanyReview,
} from "@/lib/companyTypes";

// تحميل كسول للنوافذ المنبثقة — لا تُحمَّل إلا عند الحاجة
const ShareCompany = dynamic(() => import("@/components/company/ShareCompany"), { ssr: false });
const MessageCompanyModal = dynamic(() => import("@/components/company/MessageCompanyModal"), { ssr: false });

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer";
};

export default function CompanyPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const T = useT();

  const [data, setData] = useState<CompanyProfileData | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/company/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.company) {
          setNotFound(true);
          return;
        }
        setData(d);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReviewSubmitted = (
    review: CompanyReview,
    averageRating: number,
    reviewsCount: number,
    ratingDistribution: Record<number, number>
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        reviews: [review, ...prev.reviews].slice(0, 6),
        userRating: review.rating,
        ratingDistribution,
        stats: {
          ...prev.stats,
          averageRating,
          reviewsCount,
        },
      };
    });
  };

  if (loading) return <CompanySkeleton />;

  if (notFound || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🏢</p>
        <h1 className="text-2xl font-black text-[var(--foreground)]">{T("الشركة غير موجودة")}</h1>
        <p className="text-sm text-[var(--muted)] mt-2">{T("قد تكون حُذفت أو أن الرابط غير صحيح.")}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-[var(--primary)] text-white font-bold px-6 py-3 rounded-xl transition hover:bg-[var(--primary-dark)]"
        >
          {T("العودة إلى الرئيسية")}
        </button>
      </div>
    );
  }

  const { company, jobs, stats, reviews, userRating, isOwner, ratingDistribution, similarCompanies } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <CompanyHeader
        company={company}
        stats={stats}
        isOwner={isOwner}
        onShare={() => setShareOpen(true)}
        onMessage={() => setMessageOpen(true)}
      />

      <CompanyStats stats={stats} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          <CompanyAbout company={company} />
          <CompanyServices company={company} />
          <CompanyJobs jobs={jobs} companyId={company._id} />
          <CompanyGallery gallery={company.gallery} />
          <CompanyReviews
            companyId={company._id}
            companyName={company.name}
            reviews={reviews}
            averageRating={stats.averageRating}
            reviewsCount={stats.reviewsCount}
            ratingDistribution={ratingDistribution}
            userRating={userRating}
            isOwner={isOwner}
            isLoggedIn={!!user}
            onSubmitted={handleReviewSubmitted}
          />
          <SimilarCompanies companies={similarCompanies} />
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-6">
          <CompanyInfo company={company} />
          <CompanyContact company={company} />
          <CompanyLocation company={company} />
        </div>
      </div>

      <ShareCompany open={shareOpen} onClose={() => setShareOpen(false)} companyName={company.name} />

      {!isOwner && (
        <MessageCompanyModal
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          companyUserId={company.userId}
          companyId={company._id}
          companyName={company.name}
        />
      )}
    </div>
  );
}
