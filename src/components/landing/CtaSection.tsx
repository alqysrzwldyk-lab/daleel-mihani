"use client";

import { Link } from "@/i18n/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function CtaSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-blue-800" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      <div className="page-container relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            ابدأ رحلتك المهنية اليوم
          </h2>
          <p className="text-lg text-white/70 mb-8 leading-relaxed">
            أنشئ ملفك المهني وابدأ بعرض خبراتك ومهاراتك والوصول إلى آلاف العملاء وأصحاب الأعمال.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isLoggedIn && (
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl text-base"
              >
                <UserPlus className="w-5 h-5" />
                إنشاء حساب
              </Link>
            )}
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border-2 border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 hover:border-white/50 transition-all text-base"
            >
              ابدأ البحث
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}