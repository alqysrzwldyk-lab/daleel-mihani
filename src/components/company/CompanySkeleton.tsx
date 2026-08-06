// هيكل تحميل لصفحة ملف الشركة
export default function CompanySkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* الغلاف والرأس */}
      <div className="rounded-3xl overflow-hidden border border-[var(--border)] card-shadow">
        <div className="h-44 md:h-56 bg-[var(--border-light)]" />
        <div className="bg-[var(--card)] p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 -mt-16 md:-mt-20">
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl border-4 border-[var(--card)] bg-[var(--border-light)]" />
            <div className="flex-1 w-full space-y-3 text-center sm:text-right">
              <div className="h-7 bg-[var(--border-light)] rounded-lg max-w-xs mx-auto sm:mx-0" />
              <div className="h-4 bg-[var(--border-light)] rounded-lg max-w-md mx-auto sm:mx-0" />
              <div className="flex gap-2 justify-center sm:justify-start">
                <div className="h-8 w-24 bg-[var(--border-light)] rounded-xl" />
                <div className="h-8 w-24 bg-[var(--border-light)] rounded-xl" />
                <div className="h-8 w-24 bg-[var(--border-light)] rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شبكة الأقسام */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-[var(--border-light)] rounded-2xl" />
          <div className="h-64 bg-[var(--border-light)] rounded-2xl" />
          <div className="h-40 bg-[var(--border-light)] rounded-2xl" />
        </div>
        <div className="space-y-6">
          <div className="h-56 bg-[var(--border-light)] rounded-2xl" />
          <div className="h-72 bg-[var(--border-light)] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
