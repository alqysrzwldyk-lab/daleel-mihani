"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

// معرض صور الشركة مع نافذة عرض كامل (Lightbox)
export default function CompanyGallery({ gallery }: { gallery: string[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (!gallery || gallery.length === 0) return null;

  const next = () => setActive(((active ?? 0) + 1) % gallery.length);
  const prev = () => setActive(((active ?? 0) - 1 + gallery.length) % gallery.length);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8">
      <h2 className="text-lg font-black text-[var(--foreground)] mb-4 flex items-center gap-2">
        <Images className="w-5 h-5 text-[var(--primary)]" />
        معرض الصور
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {gallery.map((img, i) => (
          <button
            key={img}
            onClick={() => setActive(i)}
            className={`relative overflow-hidden rounded-xl group ${i === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : ""}`}
          >
            <Image
              src={img}
              alt={`صورة ${i + 1}`}
              width={600}
              height={400}
              className="w-full h-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute start-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute end-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive(null);
            }}
            className="absolute top-4 end-4 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={gallery[active]}
              alt={`صورة ${active + 1}`}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
              unoptimized
            />
            <p className="text-center text-white/70 text-xs mt-3">
              {active + 1} / {gallery.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
