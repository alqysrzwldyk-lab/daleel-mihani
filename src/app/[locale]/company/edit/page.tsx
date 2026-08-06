"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Loader2,
  Save,
  Upload,
  ImagePlus,
  X,
  Building2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { CompanyPublic } from "@/lib/companyTypes";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "professional" | "employer";
};

type FormState = {
  name: string;
  logo: string;
  cover: string;
  tagline: string;
  industry: string;
  description: string;
  mission: string;
  vision: string;
  values: string;
  specializations: string;
  businessActivities: string;
  services: string;
  foundedYear: string;
  employeesCount: string;
  companySize: string;
  website: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  workingHours: string;
  gallery: string[];
  latitude: string;
  longitude: string;
  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
    whatsapp: string;
    telegram: string;
    twitter: string;
  };
};

function toList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromList(value?: string[]): string {
  return (value || []).join("\n");
}

const emptyForm: FormState = {
  name: "",
  logo: "",
  cover: "",
  tagline: "",
  industry: "",
  description: "",
  mission: "",
  vision: "",
  values: "",
  specializations: "",
  businessActivities: "",
  services: "",
  foundedYear: "",
  employeesCount: "",
  companySize: "",
  website: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  address: "",
  workingHours: "",
  gallery: [],
  latitude: "",
  longitude: "",
  social: { facebook: "", instagram: "", linkedin: "", whatsapp: "", telegram: "", twitter: "" },
};

function fromCompany(c?: CompanyPublic): FormState {
  if (!c) return emptyForm;
  return {
    name: c.name || "",
    logo: c.logo || "",
    cover: c.cover || "",
    tagline: c.tagline || "",
    industry: c.industry || "",
    description: c.description || "",
    mission: c.mission || "",
    vision: c.vision || "",
    values: fromList(c.values),
    specializations: fromList(c.specializations),
    businessActivities: fromList(c.businessActivities),
    services: fromList(c.services),
    foundedYear: c.foundedYear ? String(c.foundedYear) : "",
    employeesCount: c.employeesCount ? String(c.employeesCount) : "",
    companySize: c.companySize || "",
    website: c.website || "",
    email: c.email || "",
    phone: c.phone || "",
    city: c.city || "",
    country: c.country || "",
    address: c.address || "",
    workingHours: c.workingHours || "",
    gallery: c.gallery || [],
    latitude: typeof c.latitude === "number" ? String(c.latitude) : "",
    longitude: typeof c.longitude === "number" ? String(c.longitude) : "",
    social: {
      facebook: c.social?.facebook || "",
      instagram: c.social?.instagram || "",
      linkedin: c.social?.linkedin || "",
      whatsapp: c.social?.whatsapp || "",
      telegram: c.social?.telegram || "",
      twitter: c.social?.twitter || "",
    },
  };
}

const inputClass =
  "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition";
const labelClass = "block text-xs font-bold text-[var(--foreground)] mb-1.5";
const sectionTitle = "text-sm font-black text-[var(--primary)] mb-4 flex items-center gap-2";

// صفحة تعديل ملف الشركة (لأصحاب الشركات فقط)
export default function CompanyEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState<"" | "logo" | "cover" | "gallery">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push("/login");
          return;
        }
        if (d.user.role !== "employer") {
          router.push("/dashboard");
          return;
        }
        setUser(d.user);
        const company = d.company;
        if (company) {
          setCompanyId(company.id || String(company._id || ""));
          setForm(fromCompany(company));
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setSocial(key: keyof FormState["social"], value: string) {
    setForm((f) => ({ ...f, social: { ...f.social, [key]: value } }));
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>, kind: "logo" | "cover" | "gallery") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind === "gallery" ? "banner" : kind);
      const res = await fetch("/api/upload/asset", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (kind === "gallery") {
        set("gallery", [...form.gallery, data.url as string].slice(0, 12));
      } else {
        set(kind, data.url as string);
      }
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
      name: form.name.trim(),
      logo: form.logo || undefined,
      cover: form.cover || undefined,
      tagline: form.tagline.trim() || undefined,
      industry: form.industry.trim() || undefined,
      description: form.description.trim() || undefined,
      mission: form.mission.trim() || undefined,
      vision: form.vision.trim() || undefined,
      values: toList(form.values),
      specializations: toList(form.specializations),
      businessActivities: toList(form.businessActivities),
      services: toList(form.services),
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      employeesCount: form.employeesCount ? Number(form.employeesCount) : undefined,
      companySize: form.companySize.trim() || undefined,
      website: form.website.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || undefined,
      address: form.address.trim() || undefined,
      workingHours: form.workingHours.trim() || undefined,
      gallery: form.gallery,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      social: {
        facebook: form.social.facebook.trim() || undefined,
        instagram: form.social.instagram.trim() || undefined,
        linkedin: form.social.linkedin.trim() || undefined,
        whatsapp: form.social.whatsapp.trim() || undefined,
        telegram: form.social.telegram.trim() || undefined,
        twitter: form.social.twitter.trim() || undefined,
      },
    };

    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.field === "name" ? "اسم الشركة قصير جداً" : data.error || "حدث خطأ أثناء الحفظ");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push(`/company/${data.company._id}`);
      }, 1500);
    } catch {
      setError("فشل الاتصال بالسيرفر، يرجى المحاولة لاحقاً.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container max-w-3xl mx-auto space-y-4">
        <div className="skeleton h-14 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl mx-auto py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-[var(--border-light)] flex items-center justify-center hover:bg-[var(--border)] transition"
        >
          <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">ملف الشركة</h1>
          <p className="text-xs text-[var(--muted)]">أكمل معلومات شركتك لتظهر بشكل احترافي في دليل مهني</p>
        </div>
      </div>

      {done && (
        <div className="bg-[var(--success)]/15 border border-[var(--success)]/25 text-[var(--success)] px-4 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-6 animate-pulse">
          <CheckCircle2 className="w-5 h-5" />
          تم حفظ ملف الشركة بنجاح! جاري فتح الصفحة...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6 md:p-8 space-y-8">
        {/* ─── المعلومات الأساسية ─── */}
        <section>
          <h3 className={sectionTitle}>
            <Building2 className="w-4 h-4" /> المعلومات الأساسية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>اسم الشركة *</label>
              <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="اسم الشركة" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>شعار الشركة</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-3 cursor-pointer transition">
                {uploading === "logo" ? <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" /> : <Upload className="w-4 h-4 text-[var(--primary)]" />}
                <span className="text-xs font-medium text-[var(--muted)]">{form.logo ? "تم رفع الشعار ✓" : "رفع الشعار"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, "logo")} disabled={uploading !== ""} />
              </label>
            </div>
            <div>
              <label className={labelClass}>صورة الغلاف</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-3 cursor-pointer transition">
                {uploading === "cover" ? <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" /> : <ImagePlus className="w-4 h-4 text-[var(--primary)]" />}
                <span className="text-xs font-medium text-[var(--muted)]">{form.cover ? "تم رفع الغلاف ✓" : "رفع الغلاف"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, "cover")} disabled={uploading !== ""} />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>الشعار النصي (Tagline)</label>
              <input type="text" maxLength={300} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="جملة قصيرة تصف شركتك، مثال: شريكك الموثوق في الحلول الرقمية" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>القطاع / المجال</label>
              <input type="text" value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="مثال: تكنولوجيا المعلومات، البناء، الصحة..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>حجم الشركة</label>
              <select value={form.companySize} onChange={(e) => set("companySize", e.target.value)} className={inputClass}>
                <option value="">-- اختر الحجم --</option>
                <option value="صغيرة (1-10 موظف)">صغيرة (1-10 موظف)</option>
                <option value="متوسطة (11-50 موظف)">متوسطة (11-50 موظف)</option>
                <option value="كبيرة (أكثر من 50 موظف)">كبيرة (أكثر من 50 موظف)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>سنة التأسيس</label>
              <input type="number" min={1500} max={new Date().getFullYear()} value={form.foundedYear} onChange={(e) => set("foundedYear", e.target.value)} placeholder="مثال: 2015" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>عدد الموظفين</label>
              <input type="number" min={1} value={form.employeesCount} onChange={(e) => set("employeesCount", e.target.value)} placeholder="مثال: 45" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>نبذة عن الشركة</label>
              <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="عرّف بالشركة وتاريخها ومجال عملها..." className={`${inputClass} resize-none leading-relaxed`} />
            </div>
          </div>
        </section>

        {/* ─── الرسالة والرؤية ─── */}
        <section className="border-t border-[var(--border)] pt-8">
          <h3 className={sectionTitle}>الرسالة والرؤية</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>رسالة الشركة</label>
              <textarea rows={3} value={form.mission} onChange={(e) => set("mission", e.target.value)} placeholder="ما الذي تقدمه الشركة؟" className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>رؤية الشركة</label>
              <textarea rows={3} value={form.vision} onChange={(e) => set("vision", e.target.value)} placeholder="ما طموح الشركة المستقبلي؟" className={`${inputClass} resize-none`} />
            </div>
          </div>
        </section>

        {/* ─── القوائم ─── */}
        <section className="border-t border-[var(--border)] pt-8">
          <h3 className={sectionTitle}>التخصصات والخدمات والقيم</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>التخصصات (سطر لكل تخصص)</label>
              <textarea rows={4} value={form.specializations} onChange={(e) => set("specializations", e.target.value)} placeholder={"تطوير مواقع\nتطبيقات موبايل\nاستشارات تقنية"} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>الأنشطة التجارية (سطر لكل نشاط)</label>
              <textarea rows={4} value={form.businessActivities} onChange={(e) => set("businessActivities", e.target.value)} placeholder={"استيراد وتصدير\nتوزيع مواد غذائية\nخدمات لوجستية"} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>الخدمات الرئيسية (سطر لكل خدمة)</label>
              <textarea rows={4} value={form.services} onChange={(e) => set("services", e.target.value)} placeholder={"تصميم المواقع\nالتسويق الرقمي\nالدعم الفني"} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>قيم الشركة (سطر لكل قيمة)</label>
              <textarea rows={4} value={form.values} onChange={(e) => set("values", e.target.value)} placeholder={"الجودة\nالشفافية\nالابتكار"} className={`${inputClass} resize-none`} />
            </div>
          </div>
        </section>

        {/* ─── الموقع والتواصل ─── */}
        <section className="border-t border-[var(--border)] pt-8">
          <h3 className={sectionTitle}>الموقع والتواصل</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>الدولة</label>
              <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="مثال: الأردن" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>المدينة</label>
              <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="مثال: عمان" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>العنوان التفصيلي</label>
              <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="الشارع، المنطقة، رقم المبنى" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>خط العرض</label>
              <input type="number" step="any" min={-90} max={90} value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="مثال: 31.9539" className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>خط الطول</label>
              <input type="number" step="any" min={-180} max={180} value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="مثال: 35.9106" className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>رقم الهاتف</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XXXXXXXX" className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@company.com" className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>الموقع الإلكتروني</label>
              <input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>ساعات العمل</label>
              <input type="text" value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)} placeholder="مثال: السبت - الخميس، 9 صباحاً - 5 مساءً" className={inputClass} />
            </div>
          </div>
        </section>

        {/* ─── وسائل التواصل ─── */}
        <section className="border-t border-[var(--border)] pt-8">
          <h3 className={sectionTitle}>وسائل التواصل الاجتماعي</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                ["facebook", "فيسبوك"],
                ["instagram", "انستغرام"],
                ["linkedin", "لينكدإن"],
                ["twitter", "إكس (تويتر)"],
                ["whatsapp", "واتساب"],
                ["telegram", "تيليجرام"],
              ] as Array<[keyof FormState["social"], string]>
            ).map(([key, label]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  type="text"
                  value={form.social[key]}
                  onChange={(e) => setSocial(key, e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ─── معرض الصور ─── */}
        <section className="border-t border-[var(--border)] pt-8">
          <h3 className={sectionTitle}>معرض الصور (حتى 12 صورة)</h3>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-4 cursor-pointer transition">
            {uploading === "gallery" ? <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" /> : <ImagePlus className="w-5 h-5 text-[var(--primary)]" />}
            <span className="text-xs font-medium text-[var(--muted)]">اضغط لإضافة صورة للمعرض</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, "gallery")} disabled={uploading !== ""} />
          </label>
          {form.gallery.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
              {form.gallery.map((img, i) => (
                <div key={img} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[var(--border)] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set("gallery", form.gallery.filter((_, idx) => idx !== i))}
                    className="absolute top-1.5 end-1.5 p-1 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
            {submitting ? "جاري الحفظ..." : "حفظ ملف الشركة"}
          </button>
          <Link
            href={companyId ? `/company/${companyId}` : "/dashboard"}
            className="px-5 py-2 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] font-medium rounded-xl transition inline-flex items-center"
          >
            عرض الملف
          </Link>
        </div>
      </form>
    </div>
  );
}
