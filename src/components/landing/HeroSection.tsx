"use client";

import { useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { Search, Briefcase, Sparkles, ArrowLeft } from "lucide-react";

const POPULAR = [
  "طبيب", "مهندس", "معلم", "كهربائي", "سباك", "مصمم", "مبرمج", "محامي"
];

const emptySubscribe = () => () => {};

export default function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [query, setQuery] = useState("");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <section className="landing-hero">
      <div className="landing-hero-mesh" />
      <div className="landing-hero-orb landing-hero-orb-1" />
      <div className="landing-hero-orb landing-hero-orb-2" />
      <div className="landing-hero-orb landing-hero-orb-3" />
      <div className="landing-hero-dots" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-particle" />
      <div className="landing-hero-accent landing-hero-accent-1" />
      <div className="landing-hero-accent landing-hero-accent-2" />

      <div className="page-container relative z-10">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white/80 text-sm">منصة المهنيين الأولى في العالم العربي</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            كل المهنيين<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
              في مكان واحد
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            منصة تجمع المهنيين، الحرفيين، الطلاب، والخبراء مع أصحاب الأعمال والعملاء
            لتسهيل الوصول إلى الكفاءات وبناء فرص مهنية حقيقية.
          </p>

          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query.trim())}`; }}
            className="flex items-center bg-white rounded-2xl shadow-2xl p-1.5 max-w-xl mx-auto mb-6"
          >
            <div className="flex-1 flex items-center px-4">
              <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن طبيب، مهندس، معلم، شركة، أو أي مهنة..."
                className="w-full py-3 outline-none text-gray-800 placeholder:text-gray-400 bg-transparent"
              />
            </div>
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-xl transition-colors">
              بحث
            </button>
          </form>

          {/* Popular searches */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="text-white/50 text-sm ml-1">الأكثر بحثاً:</span>
            {POPULAR.map((item) => (
              <Link
                key={item}
                href={`/search?q=${encodeURIComponent(item)}`}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-colors border border-white/10"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/register?role=professional"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl text-base"
                >
                  <Briefcase className="w-5 h-5" />
                  إنشاء حساب
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border-2 border-white/30 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/20 hover:border-white/50 transition-all text-base"
                >
                  استكشف المهنيين
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all shadow-xl text-base"
              >
                ابحث عن محترفين
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}