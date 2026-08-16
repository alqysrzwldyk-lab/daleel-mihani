"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload, X, FileText, Camera, Send } from "lucide-react";
import { EDUCATION_LEVELS } from "@/lib/jobs";
import { resolveErrorMessage } from "@/lib/validationMessages";
import { useT } from "@/lib/useT";

type Props = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  prefilledName?: string;
  prefilledEmail?: string;
  open: boolean;
  onClose: () => void;
};

// نافذة التقديم على وظيفة: بيانات المهني + سيرة ذاتية اختيارية + صورة شخصية اختيارية
export default function ApplyModal({
  jobId,
  jobTitle,
  companyName,
  prefilledName,
  prefilledEmail,
  open,
  onClose,
}: Props) {
  const [fullName, setFullName] = useState(prefilledName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(prefilledEmail || "");
  const [profession, setProfession] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState("");
  const [cvName, setCvName] = useState("");
  const [photo, setPhoto] = useState("");

  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const T = useT();

  // إغلاق النافذة بزر Escape للوصول بلوحة المفاتيح
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function uploadFile(file: File, kind: "cv" | "photo") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    const res = await fetch("/api/upload/asset", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(T(data.error || "فشل رفع الملف"));
    return data.url as string;
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCv(true);
    setError("");
    try {
      const url = await uploadFile(file, "cv");
      setCvFile(url);
      setCvName(file.name);
    } catch {
      setError(T("فشل رفع السيرة الذاتية. تأكد أنه ملف PDF بحجم أقل من 5MB."));
    } finally {
      setUploadingCv(false);
      e.target.value = "";
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const url = await uploadFile(file, "photo");
      setPhoto(url);
    } catch {
      setError(T("فشل رفع الصورة الشخصية."));
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          profession: profession.trim(),
          education,
          experience,
          coverLetter: coverLetter.trim(),
          cvFile,
          photo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(resolveErrorMessage(data));
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError(T("فشل الاتصال بالسيرفر، يرجى المحاولة لاحقاً."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition";

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-lg font-black text-[var(--foreground)]">{T("التقديم على الوظيفة")}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {jobTitle} — {companyName}
            </p>
          </div>
          <button onClick={onClose} aria-label={T("إغلاق النافذة")} className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20 flex items-center justify-center">
              <Send className="w-7 h-7 text-[var(--success)]" />
            </div>
            <h4 className="text-xl font-black text-[var(--foreground)]">{T("تم إرسال طلبك بنجاح!")}</h4>
            <p className="text-sm text-[var(--muted)]">
              {T("سيقوم صاحب الشركة بمراجعة طلبك وسيصلك إشعار فوري عند اتخاذ القرار.")}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-3 rounded-xl transition"
            >
              {T("حسناً")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("الاسم الكامل *")}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={T("الاسم الثلاثي")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("رقم الهاتف *")}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className={inputClass}
                  dir="ltr"
                  style={{ textAlign: "right" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("البريد الإلكتروني *")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("المهنة *")}</label>
                <input
                  type="text"
                  required
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder={T("مثال: مبرمج، محاسب...")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("سنوات الخبرة *")}</label>
                <input
                  type="text"
                  required
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder={T("مثال: 3 سنوات")}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("المؤهل العلمي *")}</label>
              <select required value={education} onChange={(e) => setEducation(e.target.value)} className={inputClass}>
                <option value="" disabled>
                  {T("-- اختر المؤهل العلمي --")}
                </option>
                {EDUCATION_LEVELS.map((ed) => (
                  <option key={ed} value={ed}>
                    {T(ed)}
                  </option>
                ))}
              </select>
            </div>

            {/* رفع السيرة الذاتية (اختياري) */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("السيرة الذاتية (PDF) — اختياري")}</label>
              <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition ${cvFile ? "border-[var(--success)]/40 bg-[var(--success)]/10" : "border-[var(--border)] hover:border-[var(--primary)]"}`}>
                {uploadingCv ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                ) : cvFile ? (
                  <FileText className="w-5 h-5 text-[var(--success)]" />
                ) : (
                  <Upload className="w-5 h-5 text-[var(--primary)]" />
                )}
                <span className="text-xs font-medium text-[var(--muted)] truncate">
                  {uploadingCv ? T("جاري الرفع...") : cvName ? cvName : T("اضغط لرفع ملف السيرة الذاتية (PDF)")}
                </span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleCvUpload} disabled={uploadingCv} />
              </label>
            </div>

            {/* الصورة الشخصية الاختيارية */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("صورة شخصية (اختياري)")}</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-3.5 cursor-pointer transition">
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                ) : (
                  <Camera className="w-4 h-4 text-[var(--primary)]" />
                )}
                <span className="text-xs font-medium text-[var(--muted)]">
                  {uploadingPhoto ? T("جاري الرفع...") : photo ? T("تم رفع الصورة ✓") : T("إرفاق صورة شخصية")}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">{T("رسالة تعريفية *")}</label>
              <textarea
                required
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={T("عرّف بنفسك، خبراتك، ولماذا تناسبك هذه الوظيفة...")}
                className={`${inputClass} resize-none leading-relaxed`}
              />
            </div>

            {error && (
              <div className="text-xs font-semibold text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5 text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting || uploadingCv}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition active:scale-[0.99]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? T("جاري إرسال الطلب...") : T("التقديم على الوظيفة")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] font-medium rounded-xl transition"
              >
                {T("إلغاء")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
