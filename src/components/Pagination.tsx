"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

export default function Pagination({ currentPage, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== "page") params.set(key, val);
    });
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  function getPageNumbers(): number[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }
    return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)} className="btn btn-outline btn-sm">
          <ChevronRight className="w-4 h-4" />
          السابق
        </Link>
      )}

      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum) => (
          <Link
            key={pageNum}
            href={buildUrl(pageNum)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition ${
              pageNum === currentPage
                ? "bg-primary text-white"
                : "hover:bg-[var(--border-light)] text-muted"
            }`}
          >
            {pageNum}
          </Link>
        ))}
      </div>

      {currentPage < totalPages && (
        <Link href={buildUrl(currentPage + 1)} className="btn btn-outline btn-sm">
          التالي
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
