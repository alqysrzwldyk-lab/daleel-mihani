"use client";

import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import {
  X,
  Briefcase,
  Loader2,
  CheckCircle2,
  Send,
  Building2,
  User,
  Phone,
  MapPin,
  Banknote,
  CalendarDays,
  Sparkles,
  ListChecks,
} from "lucide-react";

interface HireModalProps {
  professionalId: string;
  professionalName: string;
  professionalPhoto?: string;
  professionalProfession?: string;
  // مخصّص: يمرر زر فتح مخصص بدل الزر الافتراضي (متوافق مع الاستخدام القديم)
  trigger?: (open: () => void) => React.ReactNode;
}

type CompanyInfo = {
  name?: string;
  logo?: string;
};

const EMPLOYMENT_TYPES = ["دوام كامل", "دوام جزئي", "عن بعد", "عقد", "مؤقت", "تدريب"];

const BENEFITS_OPTIONS = [
  { key: "healthInsurance", label: "تأمين صحي", icon: "🩺" },
  { key: "accommodation", label: "سكن", icon: "🏠" },
  { key: "transportation", label: "مواصلات", icon: "🚌" },
  { key: "flexibleHours", label: "ساعات مرنة", icon: "⏰" },
  { key: "bonuses", label: "مكافآت", icon: "🎁" },
  { key: "training", label: "تدريب وتطوير", icon: "📈" },
] as const;

type Benefits = Record<(typeof BENEFITS_OPTIONS)[number]["key"], boolean>;

export default function HireModal({
  professionalId,
  professionalName,
  professionalPhoto,
  professionalProfession,
  trigger,
}: HireModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"form" | "success">("form");

  const [company, setCompany] = useState<CompanyInfo>({});
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salary, setSalary] = useState("");
  const [country, setCountry] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [skills, setSkills] = useState("");
  const [jobBenefits, setJobBenefits] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [benefits, setBenefits] = useState<Benefits>({
    healthInsurance: false,
    accommodation: false,
    transportation: false,
    flexibleHours: false,
    bonuses: false,
    training: false,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ companyName?: string; jobTitle?: string; description?: string }>({});
  const [touched, setTouched] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // تعبئة اسم الشركة وشعارها تلقائياً من حساب صاحب الشركة
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.company) {
          setCompany({ name: d.company.name, logo: d.company.logo });
          if (d.company.name) setCompanyName(d.company.name);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setView("form");
    setCompanyName("");
    setJobTitle("");
    setEmploymentType("");
    setSalary("");
    setCountry("");
    setGovernorate("");
    setCity("");
    setWorkLocation("");
    setDescription("");
    setResponsibilities("");
    setRequirements("");
    setSkills("");
    setJobBenefits("");
    setCompanyPhone("");
    setCompanyEmail("");
    setInterviewDate("");
    setInterviewLocation("");
    setBenefits({ healthInsurance: false, accommodation: false, transportation: false, flexibleHours: false, bonuses: false, training: false });
    setLoading(false);
    setSubmitted(false);
    setErrors({});
    setTouched(false);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    setIsOpen(false);
    resetForm();
  }, [loading, resetForm]);

  // إغلاق بمفتاح ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  function open() {
    resetForm();
    setIsOpen(true);
  }

  function toggleBenefit(key: keyof Benefits) {
    setBenefits((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!companyName.trim()) next.companyName = "اسم الشركة مطلوب";
    if (!jobTitle.trim()) next.jobTitle = "المسمى الوظيفي مطلوب";
    if (!description.trim()) next.description = "وصف الوظيفة مطلوب";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildMessage(): string {
    const parts: string[] = [];
    parts.push(`📋 المسمى الوظيفي: ${jobTitle.trim()}`);
    if (employmentType) parts.push(`🕒 نوع التوظيف: ${employmentType}`);
    if (salary.trim()) parts.push(`💰 الراتب: ${salary.trim()}`);
    const locationParts = [country, governorate, city].filter((v) => v.trim());
    if (locationParts.length > 0) parts.push(`📍 الموقع: ${locationParts.join("، ")}`);
    if (workLocation.trim()) parts.push(`🏢 مكان العمل: ${workLocation.trim()}`);
    if (description.trim()) parts.push(`\n📝 وصف الوظيفة:\n${description.trim()}`);
    if (responsibilities.trim()) parts.push(`\n🔹 المسؤوليات:\n${responsibilities.trim()}`);
    if (requirements.trim()) parts.push(`\n🔸 المتطلبات:\n${requirements.trim()}`);
    if (skills.trim()) parts.push(`\n🛠️ المهارات المطلوبة:\n${skills.trim()}`);
    if (jobBenefits.trim()) parts.push(`\n✨ مزايا الوظيفة:\n${jobBenefits.trim()}`);
    const selectedBenefits = BENEFITS_OPTIONS.filter((b) => benefits[b.key]).map((b) => b.label);
    if (selectedBenefits.length > 0) parts.push(`🎁 مزايا إضافية: ${selectedBenefits.join("، ")}`);
    if (companyPhone.trim() || companyEmail.trim()) {
      parts.push(`\n📞 بيانات التواصل:`);
      if (companyPhone.trim()) parts.push(`الهاتف: ${companyPhone.trim()}`);
      if (companyEmail.trim()) parts.push(`البريد: ${companyEmail.trim()}`);
    }
    if (interviewDate.trim() || interviewLocation.trim()) {
      parts.push(`\n🗓️ المقابلة:`);
      if (interviewDate.trim()) parts.push(`التاريخ: ${interviewDate.trim()}`);
      if (interviewLocation.trim()) parts.push(`المكان: ${interviewLocation.trim()}`);
    }
    return parts.join("\n");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!validate()) return;
    if (submitted) return; // منع الإرسال المكرر

    setLoading(true);
    try {
      const res = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId,
          companyName: companyName.trim(),
          title: jobTitle.trim(),
          message: buildMessage(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setView("success");
      } else {
        setErrors({ jobTitle: data.error || "حدث خطأ ما" });
      }
    } catch {
      setErrors({ jobTitle: "فشل الاتصال بالسيرفر" });
    } finally {
      setLoading(false);
    }
  }

  const defaultTrigger = (
    <button
      onClick={open}
      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] text-white font-bold py-3 px-6 rounded-xl hover:opacity-95 transition shadow-md shadow-[var(--primary)]/20 active:scale-[0.98]"
    >
      <Briefcase className="w-4 h-4" />
      طلب توظيف / تقديم عرض عمل
    </button>
  );

  return (
    <>
      {trigger ? trigger(open) : defaultTrigger}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="إرسال عرض عمل"
            className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[var(--card)] sm:rounded-3xl rounded-t-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {view === "success" ? (
              /* ─── شاشة النجاح ─── */
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-[var(--success)]/15 flex items-center justify-center mb-5 animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
                </div>
                <h3 className="text-2xl font-black text-[var(--foreground)]">تم إرسال عرض العمل بنجاح</h3>
                <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed">
                  تم إشعار {professionalName} بعرضك مباشرة.
                  <br />
                  يمكنك متابعة حالة الطلب من لوحة تحكم الشركة.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push("/dashboard/applications")}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-3 rounded-xl transition active:scale-[0.98]"
                  >
                    <ListChecks className="w-4 h-4" />
                    الذهاب إلى طلبات التوظيف
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-5 py-3 bg-[var(--border-light)] hover:bg-[var(--border)] rounded-xl font-bold text-[var(--foreground)] transition"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              /* ─── نموذج العرض ─── */
              <>
                {/* ترويسة الحوار */}
                <div className="sticky top-0 z-10 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] px-6 py-5 text-white">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    aria-label="إغلاق"
                    className="absolute top-4 end-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-bold opacity-80 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    توظيف مباشر
                  </p>
                  <h3 className="text-xl font-black">إرسال عرض عمل إلى {professionalName}</h3>

                  {/* الشركة + المهني */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {company.logo ? (
                          <Image src={company.logo} alt={company.name || "الشركة"} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-sm font-bold truncate">{company.name || "شركتك"}</span>
                    </div>
                    <div className="w-px h-8 bg-white/25" />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {professionalPhoto ? (
                          <Image src={professionalPhoto} alt={professionalName} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{professionalName}</p>
                        {professionalProfession && (
                          <p className="text-[11px] opacity-80 truncate">{professionalProfession}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
                  {/* معلومات الوظيفة */}
                  <section>
                    <h4 className="flex items-center gap-2 font-black text-sm text-[var(--foreground)] mb-3">
                      <Briefcase className="w-4 h-4 text-[var(--primary)]" /> معلومات الوظيفة
                    </h4>
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                            اسم الشركة أو المشروع <span className="text-[var(--danger)]">*</span>
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="مثال: شركة الحلول المتقدمة"
                            className={`w-full px-3.5 py-2.5 border rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition ${
                              touched && errors.companyName ? "border-[var(--danger)]" : "border-[var(--border)]"
                            }`}
                          />
                          {touched && errors.companyName && (
                            <p className="text-[11px] text-[var(--danger)] font-bold mt-1">{errors.companyName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                            المسمى الوظيفي <span className="text-[var(--danger)]">*</span>
                          </label>
                          <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="مثال: مطور تطبيقات فلاتر"
                            className={`w-full px-3.5 py-2.5 border rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition ${
                              touched && errors.jobTitle ? "border-[var(--danger)]" : "border-[var(--border)]"
                            }`}
                          />
                          {touched && errors.jobTitle && (
                            <p className="text-[11px] text-[var(--danger)] font-bold mt-1">{errors.jobTitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">نوع التوظيف</label>
                          <select
                            value={employmentType}
                            onChange={(e) => setEmploymentType(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition"
                          >
                            <option value="">اختر النوع...</option>
                            {EMPLOYMENT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                            <span className="inline-flex items-center gap-1"><Banknote className="w-3 h-3" /> الراتب (اختياري)</span>
                          </label>
                          <input
                            type="text"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            placeholder="مثال: 800 - 1200$"
                            className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">الدولة</label>
                          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="اليمن" className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المحافظة</label>
                          <input type="text" value={governorate} onChange={(e) => setGovernorate(e.target.value)} placeholder="صنعاء" className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المدينة</label>
                          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="صنعاء" className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> موقع العمل (اختياري)</span>
                        </label>
                        <input type="text" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} placeholder="عنوان المكتب أو (عن بعد)" className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                      </div>
                    </div>
                  </section>

                  {/* وصف الوظيفة */}
                  <section>
                    <h4 className="flex items-center gap-2 font-black text-sm text-[var(--foreground)] mb-3">
                      <ListChecks className="w-4 h-4 text-[var(--primary)]" /> وصف الوظيفة
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          وصف الوظيفة <span className="text-[var(--danger)]">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value.slice(0, 800))}
                          placeholder="اكتب نبذة واضحة عن الوظيفة ومهامها العامة..."
                          className={`w-full px-3.5 py-2.5 border rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition resize-none ${
                            touched && errors.description ? "border-[var(--danger)]" : "border-[var(--border)]"
                          }`}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {touched && errors.description ? (
                            <p className="text-[11px] text-[var(--danger)] font-bold">{errors.description}</p>
                          ) : <span />}
                          <span className="text-[10px] text-[var(--muted-light)]">{description.length}/800</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المسؤوليات</label>
                        <textarea
                          rows={2}
                          value={responsibilities}
                          onChange={(e) => setResponsibilities(e.target.value.slice(0, 600))}
                          placeholder="المهام والمسؤوليات الأساسية..."
                          className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition resize-none"
                        />
                        <div className="text-end text-[10px] text-[var(--muted-light)] mt-1">{responsibilities.length}/600</div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المتطلبات</label>
                        <textarea
                          rows={2}
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value.slice(0, 600))}
                          placeholder="المؤهلات والخبرات المطلوبة..."
                          className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition resize-none"
                        />
                        <div className="text-end text-[10px] text-[var(--muted-light)] mt-1">{requirements.length}/600</div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المهارات المطلوبة</label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="افصل المهارات بفاصلة: Flutter, Firebase, Git"
                          className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">مزايا الوظيفة</label>
                        <textarea
                          rows={2}
                          value={jobBenefits}
                          onChange={(e) => setJobBenefits(e.target.value.slice(0, 400))}
                          placeholder="مثال: إجازات مدفوعة، بيئة عمل حديثة، ترقيات سريعة..."
                          className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition resize-none"
                        />
                      </div>
                    </div>
                  </section>

                  {/* مزايا إضافية */}
                  <section>
                    <h4 className="flex items-center gap-2 font-black text-sm text-[var(--foreground)] mb-3">
                      <Sparkles className="w-4 h-4 text-[var(--accent)]" /> مزايا إضافية
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BENEFITS_OPTIONS.map((b) => (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => toggleBenefit(b.key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition ${
                            benefits[b.key]
                              ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30"
                          }`}
                        >
                          <span className="text-base">{b.icon}</span>
                          {b.label}
                          {benefits[b.key] && (
                            <span className="ms-auto w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* معلومات التواصل */}
                  <section>
                    <h4 className="flex items-center gap-2 font-black text-sm text-[var(--foreground)] mb-3">
                      <Phone className="w-4 h-4 text-[var(--primary)]" /> معلومات التواصل
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">هاتف الشركة</label>
                        <input type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="05xxxxxxxx" className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">بريد الشركة</label>
                        <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="hr@company.com" className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> موعد المقابلة (اختياري)</span>
                        </label>
                        <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">مكان المقابلة (اختياري)</label>
                        <input type="text" value={interviewLocation} onChange={(e) => setInterviewLocation(e.target.value)} placeholder="مقر الشركة أو رابط مكالمة" className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" />
                      </div>
                    </div>
                  </section>

                  {/* أزرار الإرسال */}
                  <div className="flex gap-3 pt-2 border-t border-[var(--border-light)]">
                    <button
                      type="submit"
                      disabled={loading || submitted}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-[var(--primary)] to-[var(--accent)] text-white py-3 rounded-xl font-bold hover:opacity-95 transition disabled:opacity-50 active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          إرسال عرض العمل
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-5 py-3 bg-[var(--border-light)] hover:bg-[var(--border)] rounded-xl font-bold text-[var(--foreground)] transition disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
