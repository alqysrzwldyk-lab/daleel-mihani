"use client";

import { Briefcase, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import JobCard from "@/components/JobCard";
import type { JobItem } from "@/lib/jobTypes";

// قسم الوظائف المفتوحة في ملف الشركة
export default function CompanyJobs({ jobs, companyId }: { jobs: JobItem[]; companyId: string }) {
  if (jobs.length === 0) return null;

  return (
    <div id="company-jobs" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-[var(--foreground)] flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[var(--primary)]" />
          الوظائف المفتوحة
          <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2.5 py-0.5 rounded-full">
            {jobs.length}
          </span>
        </h2>
        <Link
          href={`/jobs?companyId=${companyId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
        >
          عرض الكل
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <JobCard key={job._id} job={job} />
        ))}
      </div>
    </div>
  );
}
