"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import JobForm from "@/components/JobForm";

type CompanyInfo = { name: string; logo?: string };

export default function NewJobPage() {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "employer") {
          router.push("/login");
          return;
        }
        setCompany({
          name: d.company?.name || d.user.name || "",
          logo: d.company?.logo || "",
        });
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center gap-3 text-[var(--muted)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span className="text-sm font-bold">جاري التحقق من الحساب...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.push("/dashboard/jobs")} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition mb-5">
        <ArrowRight className="w-4 h-4" />
        العودة إلى إعلاناتي
      </button>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)]">إضافة إعلان وظيفي</h1>
        <p className="text-sm text-[var(--muted)] mt-1.5">املأ تفاصيل الوظيفة بدقة ليصل إشعار للمهنيين المناسبين ويصلتك أفضل المتقدمين.</p>
      </div>

      <JobForm mode="create" defaultCompanyName={company?.name} defaultCompanyLogo={company?.logo} />
    </div>
  );
}
