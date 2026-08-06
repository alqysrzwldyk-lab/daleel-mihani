"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  Loader2,
  Upload,
  Save,
  Building2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  JOB_TYPES,
  JOB_DEPARTMENTS,
  WORK_TYPES,
  SALARY_TYPES,
  GENDERS,
  COUNTRIES,
  JORDAN_GOVERNORATES,
  EDUCATION_LEVELS,
} from "@/lib/jobs";
import { resolveErrorMessage } from "@/lib/validationMessages";
import type { JobItem } from "@/lib/jobTypes";

type FormState = {
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobType: string;
  jobTypeCustom: string;
  department: string;
  departmentCustom: string;
  description: string;
  skills: string;
  education: string;
  experienceYears: string;
  gender: string;
  ageFrom: string;
  ageTo: string;
  salary: string;
  salaryType: string;
  workType: string;
  city: string;
  governorate: string;
  country: string;
  vacancies: string;
  deadline: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  benefits: string;
  banner: string;
  status: "open" | "closed";
};

type Props = {
  mode: "create" | "edit";
  jobId?: string;
  defaultCompanyName?: string;
  defaultCompanyLogo?: string;
  initialData?: JobItem;
};

function toForm(initial?: JobItem, defaultCompanyName = "", defaultCompanyLogo = ""): FormState {
  if (initial) {
    return {
      jobTitle: initial.jobTitle,
      companyName: initial.companyName,
      companyLogo: initial.companyLogo || "",
      jobType: JOB_TYPES.includes(initial.jobType as (typeof JOB_TYPES)[number]) ? initial.jobType : "أخرى",
      jobTypeCustom: initial.jobType,
      department: JOB_DEPARTMENTS.includes(initial.department as (typeof JOB_DEPARTMENTS)[number]) ? initial.department : "أخرى",
      departmentCustom: initial.department,
      description: initial.description,
      skills: (initial.skills || []).join(", "),
      education: initial.education,
      experienceYears: initial.experienceYears,
      gender: initial.gender || "",
      ageFrom: initial.ageFrom ? String(initial.ageFrom) : "",
      ageTo: initial.ageTo ? String(initial.ageTo) : "",
      salary: initial.salary,
      salaryType: initial.salaryType,
      workType: initial.workType,
      city: initial.city,
      governorate: initial.governorate,
      country: initial.country,
      vacancies: String(initial.vacancies || 1),
      deadline: initial.deadline ? initial.deadline.slice(0, 10) : "",
      contactPhone: initial.contactPhone,
      contactEmail: initial.contactEmail,
      website: initial.website || "",
      benefits: initial.benefits || "",
      banner: initial.banner || "",
      status: initial.status,
    };
  }
  return {
    jobTitle: "",
    companyName: defaultCompanyName,
    companyLogo: defaultCompanyLogo,
    jobType: "",
    jobTypeCustom: "",
    department: "",
    departmentCustom: "",
    description: "",
    skills: "",
    education: "",
    experienceYears: "",
    gender: "",
    ageFrom: "",
    ageTo: "",
    salary: "",
    salaryType: "شهري",
    workType: "",
    city: "",
    governorate: "",
    country: "الأردن",
    vacancies: "1",
    deadline: "",
    contactPhone: "",
    contactEmail: "",
    website: "",
    benefits: "",
    banner: "",
    status: "open",
  };
}

const selectClass =
  "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition cursor-pointer";
const inputClass =
  "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition";

// نموذج إضافة/تعديل إعلان وظيفي شامل
export default function JobForm({ mode, jobId, defaultCompanyName, defaultCompanyLogo, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(initialData, defaultCompanyName, defaultCompanyLogo));
  const [uploading, setUploading] = useState<"" | "logo" | "banner">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>, kind: "logo" | "banner") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      const res = await fetch("/api/upload/asset", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set(kind === "logo" ? "companyLogo" : "banner", data.url as string);
    } catch {
      setError("فشل رفع الصورة. تأكد من الصيغة والحجم المسموح.");
    } finally {
      setUploading("");
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      jobTitle: form.jobTitle.trim(),
      companyName: form.companyName.trim(),
      companyLogo: form.companyLogo || "",
      jobType: form.jobType === "أخرى" ? form.jobTypeCustom.trim() : form.jobType,
      department: form.department === "أخرى" ? form.departmentCustom.trim() : form.department,
      description: form.description.trim(),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      education: form.education,
      experienceYears: form.experienceYears.trim(),
      gender: form.gender || "",
      ageFrom: form.ageFrom ? Number(form.ageFrom) : null,
      ageTo: form.ageTo ? Number(form.ageTo) : null,
      salary: form.salary.trim(),
      salaryType: form.salaryType,
      workType: form.workType,
      city: form.city.trim(),
      governorate: form.governorate,
      country: form.country,
      vacancies: Number(form.vacancies) || 1,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : "",
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      website: form.website.trim(),
      benefits: form.benefits.trim(),
      banner: form.banner || "",
      status: form.status,
    };

    try {
      const url = mode === "edit" ? `/api/jobs/${jobId}` : "/api/jobs";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(resolveErrorMessage(data));
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard/jobs");
      }, 1800);
    } catch {
      setError("فشل الاتصال بالسيرفر، يرجى المحاولة لاحقاً.");
      setSubmitting(false);
    }
  }

  const sectionTitle = "text-sm font-black text-[var(--primary)] mb-4 flex items-center gap-2";
  const labelClass = "block text-xs font-bold text-[var(--foreground)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8 space-y-8">
      {done && (
        <div className="bg-[var(--success)]/15 border border-[var(--success)]/25 text-[var(--success)] px-4 py-3 rounded-xl text-sm font-bold text-center animate-in fade-in">
          {mode === "edit" ? "تم تحديث الإعلان الوظيفي بنجاح!" : "تم نشر إعلانك الوظيفي بنجاح!"}
        </div>
      )}

      {/* ─── معلومات الشركة ─── */}
      <section>
        <h3 className={sectionTitle}>
          <Building2 className="w-4 h-4" /> معلومات الشركة
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>اسم الشركة *</label>
            <input type="text" required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="اسم شركتك أو مؤسستك" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>شعار الشركة</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-3 cursor-pointer transition">
              {uploading === "logo" ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              ) : (
                <Upload className="w-4 h-4 text-[var(--primary)]" />
              )}
              <span className="text-xs font-medium text-[var(--muted)]">
                {form.companyLogo ? "تم رفع الشعار ✓" : "رفع شعار الشركة"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, "logo")} disabled={uploading !== ""} />
            </label>
          </div>
        </div>
      </section>

      {/* ─── معلومات الوظيفة ─── */}
      <section className="border-t border-[var(--border)] pt-8">
        <h3 className={sectionTitle}>معلومات الوظيفة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>المسمى الوظيفي *</label>
            <input type="text" required value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="مثال: مطور واجهات أمامية" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نوع الوظيفة *</label>
            <select required value={form.jobType} onChange={(e) => set("jobType", e.target.value)} className={selectClass}>
              <option value="" disabled>-- اختر النوع --</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {form.jobType === "أخرى" && (
              <input type="text" required value={form.jobTypeCustom} onChange={(e) => set("jobTypeCustom", e.target.value)} placeholder="اكتب نوع الوظيفة" className={`${inputClass} mt-2 animate-in fade-in`} />
            )}
          </div>
          <div>
            <label className={labelClass}>القسم أو التخصص *</label>
            <select required value={form.department} onChange={(e) => set("department", e.target.value)} className={selectClass}>
              <option value="" disabled>-- اختر القسم --</option>
              {JOB_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {form.department === "أخرى" && (
              <input type="text" required value={form.departmentCustom} onChange={(e) => set("departmentCustom", e.target.value)} placeholder="اكتب التخصص" className={`${inputClass} mt-2 animate-in fade-in`} />
            )}
          </div>
          <div>
            <label className={labelClass}>المؤهل العلمي المطلوب *</label>
            <select required value={form.education} onChange={(e) => set("education", e.target.value)} className={selectClass}>
              <option value="" disabled>-- اختر المؤهل --</option>
              {EDUCATION_LEVELS.map((ed) => (
                <option key={ed} value={ed}>{ed}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>سنوات الخبرة *</label>
            <input type="text" required value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} placeholder="مثال: 2 - 5 سنوات" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>عدد الوظائف المطلوبة *</label>
            <input type="number" min={1} required value={form.vacancies} onChange={(e) => set("vacancies", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>وصف الوظيفة *</label>
          <textarea required rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="اكتب وصفاً تفصيلياً لمهام الوظيفة ومسؤولياتها..." className={`${inputClass} resize-none leading-relaxed`} />
        </div>

        <div className="mt-4">
          <label className={labelClass}>المهارات المطلوبة (افصل بينها بفاصلة)</label>
          <input type="text" value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, Node.js, TypeScript, العمل ضمن فريق..." className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className={labelClass}>الجنس (اختياري)</label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={selectClass}>
              <option value="">لا يهم</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>العمر من (اختياري)</label>
            <input type="number" min={16} max={80} value={form.ageFrom} onChange={(e) => set("ageFrom", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>العمر إلى (اختياري)</label>
            <input type="number" min={16} max={80} value={form.ageTo} onChange={(e) => set("ageTo", e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* ─── الراتب ونظام العمل ─── */}
      <section className="border-t border-[var(--border)] pt-8">
        <h3 className={sectionTitle}>الراتب ونظام العمل</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>الراتب</label>
            <input type="text" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="مثال: 800 - 1200" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نوع الراتب</label>
            <select value={form.salaryType} onChange={(e) => set("salaryType", e.target.value)} className={selectClass}>
              {SALARY_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>نوع الدوام *</label>
            <select required value={form.workType} onChange={(e) => set("workType", e.target.value)} className={selectClass}>
              <option value="" disabled>-- اختر نوع الدوام --</option>
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ─── الموقع الجغرافي ─── */}
      <section className="border-t border-[var(--border)] pt-8">
        <h3 className={sectionTitle}>الموقع الجغرافي</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>المدينة *</label>
            <input type="text" required value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="مثال: عمان" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>المحافظة *</label>
            <select required value={form.governorate} onChange={(e) => set("governorate", e.target.value)} className={selectClass}>
              <option value="" disabled>-- اختر المحافظة --</option>
              {JORDAN_GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>الدولة *</label>
            <select required value={form.country} onChange={(e) => set("country", e.target.value)} className={selectClass}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ─── بيانات التواصل ─── */}
      <section className="border-t border-[var(--border)] pt-8">
        <h3 className={sectionTitle}>بيانات التواصل</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>رقم التواصل *</label>
            <input type="tel" required value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="07XXXXXXXX" className={inputClass} dir="ltr" style={{ textAlign: "right" }} />
          </div>
          <div>
            <label className={labelClass}>البريد الإلكتروني *</label>
            <input type="email" required value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="hr@company.com" className={inputClass} dir="ltr" />
          </div>
          <div>
            <label className={labelClass}>الموقع الإلكتروني</label>
            <input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." className={inputClass} dir="ltr" />
          </div>
          <div>
            <label className={labelClass}>آخر موعد للتقديم</label>
            <input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>مزايا الوظيفة</label>
          <textarea rows={3} value={form.benefits} onChange={(e) => set("benefits", e.target.value)} placeholder="مثال: تأمين صحي، بدل مواصلات، ساعات مرنة، إجازات مدفوعة..." className={`${inputClass} resize-none leading-relaxed`} />
        </div>

        <div className="mt-4">
          <label className={labelClass}>صورة أو Banner للإعلان</label>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-4 cursor-pointer transition">
            {uploading === "banner" ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
            ) : (
              <ImageIcon className="w-5 h-5 text-[var(--primary)]" />
            )}
            <span className="text-xs font-medium text-[var(--muted)]">
              {form.banner ? "تم رفع البانر ✓" : "اضغط لرفع صورة البانر"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, "banner")} disabled={uploading !== ""} />
          </label>
          {form.banner && (
            <button type="button" onClick={() => set("banner", "")} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--danger)] hover:text-[var(--danger)]/80">
              <X className="w-3.5 h-3.5" /> إزالة البانر
            </button>
          )}
        </div>
      </section>

      {/* ─── حالة الإعلان ─── */}
      <section className="border-t border-[var(--border)] pt-8">
        <h3 className={sectionTitle}>حالة الإعلان</h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => set("status", "open")}
            className={`py-3 rounded-xl border text-sm font-bold transition ${form.status === "open" ? "bg-[var(--success)]/15 border-[var(--success)]/30 text-[var(--success)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"}`}
          >
            🟢 مفتوح
          </button>
          <button
            type="button"
            onClick={() => set("status", "closed")}
            className={`py-3 rounded-xl border text-sm font-bold transition ${form.status === "closed" ? "bg-[var(--danger)]/15 border-[var(--danger)]/30 text-[var(--danger)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"}`}
          >
            🔴 مغلق
          </button>
        </div>
      </section>

      {error && (
        <div className="text-xs font-semibold text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5 text-center">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || uploading !== ""}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition shadow-md shadow-[var(--primary)]/10 active:scale-[0.99]"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {submitting ? "جاري الحفظ..." : mode === "edit" ? "حفظ التعديلات" : "نشر الإعلان الوظيفي"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] font-medium rounded-xl transition"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
