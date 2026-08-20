"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useT } from "@/lib/useT";
import {
  Briefcase,
  Loader2,
  CheckCircle,
  X,
  Plus,
  Upload,
  User,
  ImagePlus,
  ChevronRight,
  ChevronLeft,
  FileText,
  Trash2,
  Clock,
  Globe,
} from "lucide-react";
import { getAvailableProfessions, getProfessionArabic, getProfessionIcon, isCustomProfession } from "@/lib/professions";

type WorkExp = {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

type SkillLevel = { skill: string; level: number };
type Language = { name: string; level?: string };

type Project = {
  title: string;
  description?: string;
  category?: string;
  image?: string;
  images?: string[];
  video?: string;
  pdf?: string;
  beforeAfter?: { before?: string; after?: string };
  completedDate?: string;
};

type Certificate = {
  name: string;
  organization?: string;
  issueDate?: string;
  expiryDate?: string;
  image?: string;
  pdf?: string;
};

type Social = {
  whatsapp?: string;
  telegram?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
};

const STEPS = [
  { title: "الأساسيات", icon: "📇" },
  { title: "التعريف", icon: "✍️" },
  { title: "الخبرة", icon: "💼" },
  { title: "المهارات واللغات", icon: "🛠️" },
  { title: "المشاريع", icon: "🖼️" },
  { title: "الشهادات", icon: "🎓" },
  { title: "التوفر والتواصل", icon: "⏰" },
];

const LANGUAGE_LEVELS = ["مبتدئ", "متوسط", "متقدم", "لغة أم"];

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "uploadFailed");
  return data.url;
}

function UploadField({
  label,
  accept,
  value,
  onChange,
  uploading,
  setUploading,
  placeholder,
}: {
  label: string;
  accept: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  placeholder?: string;
}) {
  const T = useT();
  const isImage = accept.includes("image");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      alert(T("فشل رفع الملف، تأكد من النوع والحجم"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="input-label">{label}</label>
      {value ? (
        <div className="flex items-center gap-2">
          {isImage ? (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <img src={value} alt={label} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          )}
          <span className="text-xs text-muted truncate flex-1">{value.split("/").pop()}</span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
            aria-label={T("حذف")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="btn btn-primary btn-sm cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : isImage ? <ImagePlus className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          <span>{uploading ? T("جاري الرفع...") : T("رفع ملف")}</span>
          <input type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
      {placeholder && <p className="text-[11px] text-muted-light mt-1">{placeholder}</p>}
    </div>
  );
}

export default function CreateProfilePage() {
  const router = useRouter();
  const T = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);

  // ─── الأساسيات ───
  const [photo, setPhoto] = useState("");
  const [cover, setCover] = useState("");
  const [name, setName] = useState("");
  const [professions, setProfessions] = useState<string[]>(["programmer", "designer"]);
  const [specialization, setSpecialization] = useState("");
  const [customProfession, setCustomProfession] = useState("");

  // ─── التعريف ───
  const [bio, setBio] = useState("");
  const [objective, setObjective] = useState("");
  const [education, setEducation] = useState("");
  const [currentWorkplace, setCurrentWorkplace] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  // ─── الخبرة ───
  const [workExperience, setWorkExperience] = useState<WorkExp[]>([]);

  // ─── المهارات واللغات ───
  const [skillsText, setSkillsText] = useState("");
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  // ─── المشاريع ───
  const [projects, setProjects] = useState<Project[]>([]);

  // ─── الشهادات ───
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // ─── التوفر والتواصل ───
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [availability, setAvailability] = useState<"available" | "busy" | "away">("available");
  const [social, setSocial] = useState<Social>({});
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  const WEEKDAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push("/login");
          return;
        }
        if (d.user.role !== "professional") {
          router.push("/");
          return;
        }
        setName(d.user.name);
        const p = d.profile;
        const pid = p?._id || p?.id;
        if (pid) {
          setProfileId(pid);
          if (p?.professions) setProfessions(p.professions);
          if (p?.photo) setPhoto(p.photo);
          if (p?.cover) setCover(p.cover);
          if (p?.bio) setBio(p.bio);
          if (p?.skills) setSkillsText(p.skills.join(", "));
          if (p?.location) setLocation(p.location);
          if (p?.phone) setPhone(p.phone);
          if (p?.specialization) setSpecialization(p.specialization);
          if (p?.objective) setObjective(p.objective);
          if (p?.education) setEducation(p.education);
          if (p?.currentWorkplace) setCurrentWorkplace(p.currentWorkplace);
          if (p?.experienceYears) setExperienceYears(p.experienceYears);
          if (p?.workExperience) setWorkExperience(p.workExperience || []);
          if (p?.skillLevels) setSkillLevels(p.skillLevels || []);
          if (p?.languages) setLanguages(p.languages || []);
          if (p?.projects) setProjects(p.projects || []);
          if (p?.certificates) setCertificates(p.certificates || []);
          if (p?.workingHours) {
            setWorkingDays(p.workingHours.days || []);
            setWorkingHours(p.workingHours.hours || "");
            setAvailableNow(!!p.workingHours.availableNow);
            setEmergencyAvailable(!!p.workingHours.emergencyAvailable);
          }
          if (p?.availability) setAvailability(p.availability);
          if (p?.social) setSocial(p.social || {});
        }
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  function toggleProfession(key: string) {
    const current = [...professions];
    const idx = current.indexOf(key);
    if (idx >= 0) {
      if (current.length <= 1) return;
      current.splice(idx, 1);
    } else {
      if (current.length >= 2) return;
      current.push(key);
    }
    setProfessions(current);
  }

  function addCustomProfessionToProfile() {
    if (!customProfession.trim()) return;
    const key = customProfession.trim();
    if (professions.length >= 2) return;
    setProfessions([...professions, key]);
    setCustomProfession("");
  }

  function toggleDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const updateExp = (i: number, field: keyof WorkExp, value: string) => {
    setWorkExperience((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };

  const updateSkillLevel = (i: number, field: keyof SkillLevel, value: string | number) => {
    setSkillLevels((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const updateLanguage = (i: number, field: keyof Language, value: string) => {
    setLanguages((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };

  const updateProject = (i: number, field: keyof Project, value: unknown) => {
    setProjects((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  };

  const updateCertificate = (i: number, field: keyof Certificate, value: string) => {
    setCertificates((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  const setSocialField = (key: keyof Social, value: string) => {
    setSocial((prev) => ({ ...prev, [key]: value }));
  };

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let id = profileId;
      if (!id) {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        id = meData.profile?._id || meData.profile?.id;
        if (!id) {
          setError(T("لم يتم العثور على الملف المهني، حاول تسجيل الخروج وإعادة التسجيل"));
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`/api/professionals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          photo: photo || undefined,
          cover: cover || undefined,
          professions,
          specialization: specialization.trim() || undefined,
          bio: bio.trim() || undefined,
          objective: objective.trim() || undefined,
          education: education.trim() || undefined,
          currentWorkplace: currentWorkplace.trim() || undefined,
          experienceYears: experienceYears.trim() || undefined,
          skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
          workExperience: workExperience.filter((w) => w.company.trim() && w.position.trim()),
          skillLevels: skillLevels.filter((s) => s.skill.trim()).map((s) => ({ ...s, skill: s.skill.trim() })),
          languages: languages.filter((l) => l.name.trim()).map((l) => ({ ...l, name: l.name.trim() })),
          projects: projects.filter((p) => p.title.trim()).map((p) => ({ ...p, title: p.title.trim() })),
          certificates: certificates.filter((c) => c.name.trim()).map((c) => ({ ...c, name: c.name.trim() })),
          workingHours: {
            days: workingDays,
            hours: workingHours.trim() || undefined,
            availableNow,
            emergencyAvailable,
            availableToday: availableNow,
          },
          availability,
          social: Object.fromEntries(
            Object.entries(social).filter(([, v]) => v?.trim())
          ) as Social,
          location: location.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => window.location.href = "/", 1500);
      } else {
        const data = await res.json();
        setError(T(data.error || "حدث خطأ"));
      }
    } catch {
      setError(T("فشل الاتصال بالسيرفر"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="form-page">
        <div className="skeleton h-96 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  const allProfessions = getAvailableProfessions(professions.filter(isCustomProfession));

  return (
    <div className="form-page">
      <div className="w-full max-w-2xl mx-auto">
        <div className="form-card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <h1>{T("أنشئ ملفك المهني")}</h1>
            <p className="subtitle">{T("خطوة واحدة تفصلك عن الظهور لأصحاب الشركات")}</p>
          </div>

          {/* مؤشر الخطوات */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={`flex flex-col items-center gap-1 shrink-0 px-2 py-1 rounded-xl transition ${
                  i === step
                    ? "bg-primary text-white"
                    : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-muted-light"
                }`}
              >
                <span className="text-lg leading-none">{s.icon}</span>
                <span className="text-[10px] font-bold whitespace-nowrap">{T(s.title)}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-danger-light text-danger text-sm p-3 rounded-xl mb-4">{T(error)}</div>
          )}

          {saved && (
            <div className="bg-success-light text-success text-sm p-4 rounded-xl mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {T("تم حفظ الملف بنجاح! جارِ التوجيه...")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ─────────── الخطوة 1: الأساسيات ─────────── */}
            {step === 0 && (
              <>
                <UploadField
                  label={T("صورة الغلاف")}
                  accept="image/*"
                  value={cover}
                  onChange={(url) => setCover(url || "")}
                  uploading={uploading}
                  setUploading={setUploading}
                />

                <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-50">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center">
                    {photo ? (
                      <Image src={photo} alt={name} width={96} height={96} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-300" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <label className="btn btn-primary btn-sm cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? T("جاري الرفع...") : T("رفع صورة شخصية")}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        setPhoto(await uploadFile(file));
                      } catch {
                        alert(T("فشل رفع الملف، تأكد من النوع والحجم"));
                      } finally {
                        setUploading(false);
                      }
                    }} disabled={uploading} />
                  </label>
                </div>

                <div className="input-group">
                  <label className="input-label">{T("الاسم الكامل")}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
                </div>

                <div className="input-group">
                  <label className="input-label">{T("المهن (اختر مهنتين كحد أقصى)")}</label>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {professions.map((p) => (
                      <span key={p} className="chip active flex items-center gap-1">
                        {getProfessionIcon(p)} {T(getProfessionArabic(p))}
                        <button type="button" onClick={() => toggleProfession(p)} className="me-1 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-[var(--border-light)] rounded-xl border border-[var(--border)]">
                    {allProfessions.map((p) => {
                      const selected = professions.includes(p.key);
                      const disabled = !selected && professions.length >= 2;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => toggleProfession(p.key)}
                          disabled={disabled && !selected}
                          className={`text-right px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                            selected
                              ? "bg-primary text-white"
                              : disabled
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-[var(--surface)] hover:border-[var(--border)] border border-transparent"
                          }`}
                        >
                          <span>{p.icon}</span>
                          <span>{T(p.arabic)}</span>
                          {selected && <CheckCircle className="w-3.5 h-3.5 me-auto" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customProfession}
                      onChange={(e) => setCustomProfession(e.target.value)}
                      placeholder={T("أضف مهنة مخصصة...")}
                      className="input-field flex-1"
                      disabled={professions.length >= 2}
                    />
                    <button
                      type="button"
                      onClick={addCustomProfessionToProfile}
                      disabled={!customProfession.trim() || professions.length >= 2}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">{T("التخصص الدقيق")}</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="input-field"
                    placeholder={T("مثال: مطور تطبيقات جوال - React Native")}
                  />
                </div>
              </>
            )}

            {/* ─────────── الخطوة 2: التعريف ─────────── */}
            {step === 1 && (
              <>
                <div className="input-group">
                  <label className="input-label">{T("نبذة عنك")}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="input-field"
                    placeholder={T("اكتب نبذة قصيرة عن خبراتك ومهاراتك...")}
                    rows={3}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">{T("الهدف المهني")}</label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="input-field"
                    placeholder={T("ما الذي تسعى لتحقيقه؟ ما نوع العمل الذي تبحث عنه؟")}
                    rows={2}
                  />
                </div>

                <div className="two-col">
                  <div className="input-group">
                    <label className="input-label">{T("المؤهل العلمي")}</label>
                    <input type="text" value={education} onChange={(e) => setEducation(e.target.value)} className="input-field" placeholder={T("مثال: بكالوريوس هندسة برمجيات")} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{T("سنوات الخبرة")}</label>
                    <input type="text" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="input-field" placeholder={T("مثال: 5 سنوات")} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">{T("مكان العمل الحالي")}</label>
                  <input type="text" value={currentWorkplace} onChange={(e) => setCurrentWorkplace(e.target.value)} className="input-field" placeholder={T("مثال: شركة التقنية الحديثة")} />
                </div>
              </>
            )}

            {/* ─────────── الخطوة 3: الخبرة ─────────── */}
            {step === 2 && (
              <>
                <div className="space-y-3">
                  {workExperience.map((exp, i) => (
                    <div key={i} className="border border-[var(--border)] rounded-xl p-3 space-y-2 bg-[var(--surface)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted">{T("خبرة")} #{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setWorkExperience((prev) => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="two-col">
                        <div className="input-group">
                          <label className="input-label">{T("الشركة")}</label>
                          <input type="text" value={exp.company} onChange={(e) => updateExp(i, "company", e.target.value)} className="input-field" />
                        </div>
                        <div className="input-group">
                          <label className="input-label">{T("المسمى الوظيفي")}</label>
                          <input type="text" value={exp.position} onChange={(e) => updateExp(i, "position", e.target.value)} className="input-field" />
                        </div>
                      </div>
                      <div className="two-col">
                        <div className="input-group">
                          <label className="input-label">{T("تاريخ البداية")}</label>
                          <input type="text" value={exp.startDate} onChange={(e) => updateExp(i, "startDate", e.target.value)} className="input-field" placeholder="2020" />
                        </div>
                        <div className="input-group">
                          <label className="input-label">{T("تاريخ النهاية")}</label>
                          <input type="text" value={exp.endDate || ""} onChange={(e) => updateExp(i, "endDate", e.target.value)} className="input-field" placeholder={T("اتركه فارغاً إن كنت ما زلت تعمل")} />
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">{T("الوصف")}</label>
                        <textarea value={exp.description || ""} onChange={(e) => updateExp(i, "description", e.target.value)} className="input-field" rows={2} />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setWorkExperience((prev) => [...prev, { company: "", position: "", startDate: "", endDate: "", description: "" }])}
                  className="btn btn-primary btn-sm w-full"
                >
                  <Plus className="w-4 h-4" />
                  {T("إضافة خبرة عمل")}
                </button>
              </>
            )}

            {/* ─────────── الخطوة 4: المهارات واللغات ─────────── */}
            {step === 3 && (
              <>
                <div className="input-group">
                  <label className="input-label">{T("المهارات (افصل بفاصلة)")}</label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    className="input-field"
                    placeholder={T("مثال: React, Node.js, TypeScript")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="input-label">{T("مستويات المهارات")}</label>
                  {skillLevels.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.skill}
                        onChange={(e) => updateSkillLevel(i, "skill", e.target.value)}
                        className="input-field flex-1"
                        placeholder={T("اسم المهارة")}
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={s.level}
                        onChange={(e) => updateSkillLevel(i, "level", parseInt(e.target.value, 10))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-bold text-primary w-10 text-center">{s.level}%</span>
                      <button
                        type="button"
                        onClick={() => setSkillLevels((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSkillLevels((prev) => [...prev, { skill: "", level: 70 }])}
                    className="btn btn-primary btn-sm w-full"
                  >
                    <Plus className="w-4 h-4" />
                    {T("إضافة مستوى مهارة")}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="input-label">{T("اللغات")}</label>
                  {languages.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={l.name}
                        onChange={(e) => updateLanguage(i, "name", e.target.value)}
                        className="input-field flex-1"
                        placeholder={T("اللغة")}
                      />
                      <select
                        value={l.level || ""}
                        onChange={(e) => updateLanguage(i, "level", e.target.value)}
                        className="input-field flex-1"
                      >
                        <option value="">{T("اختر المستوى")}</option>
                        {LANGUAGE_LEVELS.map((lv) => (
                          <option key={lv} value={lv}>{T(lv)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setLanguages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLanguages((prev) => [...prev, { name: "", level: "" }])}
                    className="btn btn-primary btn-sm w-full"
                  >
                    <Plus className="w-4 h-4" />
                    {T("إضافة لغة")}
                  </button>
                </div>
              </>
            )}

            {/* ─────────── الخطوة 5: المشاريع ─────────── */}
            {step === 4 && (
              <>
                <div className="space-y-3">
                  {projects.map((p, i) => (
                    <div key={i} className="border border-[var(--border)] rounded-xl p-3 space-y-2 bg-[var(--surface)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted">{T("مشروع")} #{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setProjects((prev) => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="two-col">
                        <div className="input-group">
                          <label className="input-label">{T("عنوان المشروع")}</label>
                          <input type="text" value={p.title} onChange={(e) => updateProject(i, "title", e.target.value)} className="input-field" />
                        </div>
                        <div className="input-group">
                          <label className="input-label">{T("التصنيف")}</label>
                          <input type="text" value={p.category || ""} onChange={(e) => updateProject(i, "category", e.target.value)} className="input-field" placeholder={T("مثال: مواقع، تطبيقات")} />
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">{T("الوصف")}</label>
                        <textarea value={p.description || ""} onChange={(e) => updateProject(i, "description", e.target.value)} className="input-field" rows={2} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{T("تاريخ الإنجاز")}</label>
                        <input type="text" value={p.completedDate || ""} onChange={(e) => updateProject(i, "completedDate", e.target.value)} className="input-field" placeholder="2024" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <UploadField
                          label={T("صورة المشروع")}
                          accept="image/*"
                          value={p.image}
                          onChange={(url) => updateProject(i, "image", url)}
                          uploading={uploading}
                          setUploading={setUploading}
                        />
                        <UploadField
                          label={T("فيديو المشروع")}
                          accept="video/*"
                          value={p.video}
                          onChange={(url) => updateProject(i, "video", url)}
                          uploading={uploading}
                          setUploading={setUploading}
                          placeholder="MP4 / WebM (حتى 25MB)"
                        />
                        <UploadField
                          label={T("ملف PDF توضيحي")}
                          accept="application/pdf"
                          value={p.pdf}
                          onChange={(url) => updateProject(i, "pdf", url)}
                          uploading={uploading}
                          setUploading={setUploading}
                          placeholder="PDF (حتى 10MB)"
                        />
                        <UploadField
                          label={T("صورة قبل / بعد")}
                          accept="image/*"
                          value={p.beforeAfter?.after}
                          onChange={(url) => updateProject(i, "beforeAfter", { ...(p.beforeAfter || {}), after: url })}
                          uploading={uploading}
                          setUploading={setUploading}
                          placeholder={T("صورة النتيجة النهائية")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setProjects((prev) => [...prev, { title: "", category: "", description: "", completedDate: "" }])}
                  className="btn btn-primary btn-sm w-full"
                >
                  <Plus className="w-4 h-4" />
                  {T("إضافة مشروع")}
                </button>
              </>
            )}

            {/* ─────────── الخطوة 6: الشهادات ─────────── */}
            {step === 5 && (
              <>
                <div className="space-y-3">
                  {certificates.map((c, i) => (
                    <div key={i} className="border border-[var(--border)] rounded-xl p-3 space-y-2 bg-[var(--surface)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted">{T("شهادة")} #{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setCertificates((prev) => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="two-col">
                        <div className="input-group">
                          <label className="input-label">{T("اسم الشهادة")}</label>
                          <input type="text" value={c.name} onChange={(e) => updateCertificate(i, "name", e.target.value)} className="input-field" />
                        </div>
                        <div className="input-group">
                          <label className="input-label">{T("الجهة المانحة")}</label>
                          <input type="text" value={c.organization || ""} onChange={(e) => updateCertificate(i, "organization", e.target.value)} className="input-field" />
                        </div>
                      </div>
                      <div className="two-col">
                        <div className="input-group">
                          <label className="input-label">{T("تاريخ الإصدار")}</label>
                          <input type="text" value={c.issueDate || ""} onChange={(e) => updateCertificate(i, "issueDate", e.target.value)} className="input-field" placeholder="2023" />
                        </div>
                        <div className="input-group">
                          <label className="input-label">{T("تاريخ الانتهاء")}</label>
                          <input type="text" value={c.expiryDate || ""} onChange={(e) => updateCertificate(i, "expiryDate", e.target.value)} className="input-field" placeholder={T("إن وجد")} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <UploadField
                          label={T("صورة الشهادة")}
                          accept="image/*"
                          value={c.image}
                          onChange={(url) => updateCertificate(i, "image", url || "")}
                          uploading={uploading}
                          setUploading={setUploading}
                        />
                        <UploadField
                          label={T("ملف الشهادة PDF")}
                          accept="application/pdf"
                          value={c.pdf}
                          onChange={(url) => updateCertificate(i, "pdf", url || "")}
                          uploading={uploading}
                          setUploading={setUploading}
                          placeholder="PDF (حتى 10MB)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCertificates((prev) => [...prev, { name: "", organization: "", issueDate: "", expiryDate: "", image: "", pdf: "" }])}
                  className="btn btn-primary btn-sm w-full"
                >
                  <Plus className="w-4 h-4" />
                  {T("إضافة شهادة")}
                </button>
              </>
            )}

            {/* ─────────── الخطوة 7: التوفر والتواصل ─────────── */}
            {step === 6 && (
              <>
                <div className="space-y-2">
                  <label className="input-label">{T("أيام العمل")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          workingDays.includes(d)
                            ? "bg-primary text-white border-primary"
                            : "bg-[var(--surface)] border-[var(--border)] text-muted hover:border-primary/40"
                        }`}
                      >
                        {T(d)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {T("ساعات العمل")}</span>
                  </label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="input-field"
                    placeholder={T("مثال: 9 صباحاً - 5 مساءً")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="input-label">{T("حالة التوفر")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "available", label: "متوفر", icon: "🟢" },
                      { value: "busy", label: "مشغول", icon: "🟠" },
                      { value: "away", label: "غير متاح", icon: "⚪" },
                    ] as const).map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setAvailability(o.value)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                          availability === o.value
                            ? "bg-primary text-white border-primary"
                            : "bg-[var(--surface)] border-[var(--border)] text-muted"
                        }`}
                      >
                        {o.icon} {T(o.label)}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted pt-1">
                    <input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} className="accent-primary w-4 h-4" />
                    {T("متاح للعمل الآن")}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input type="checkbox" checked={emergencyAvailable} onChange={(e) => setEmergencyAvailable(e.target.checked)} className="accent-primary w-4 h-4" />
                    {T("متاح للحالات الطارئة")}
                  </label>
                </div>

                <div className="two-col">
                  <div className="input-group">
                    <label className="input-label">{T("الموقع")}</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" placeholder={T("المدينة")} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{T("رقم الهاتف")}</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="05xxxxxxxx" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="input-label">
                    <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {T("روابط التواصل")}</span>
                  </label>
                  <div className="two-col">
                    <input type="text" value={social.whatsapp || ""} onChange={(e) => setSocialField("whatsapp", e.target.value)} className="input-field" placeholder={T("واتساب")} dir="ltr" />
                    <input type="text" value={social.telegram || ""} onChange={(e) => setSocialField("telegram", e.target.value)} className="input-field" placeholder={T("تيليجرام")} dir="ltr" />
                    <input type="text" value={social.linkedin || ""} onChange={(e) => setSocialField("linkedin", e.target.value)} className="input-field" placeholder="LinkedIn" dir="ltr" />
                    <input type="text" value={social.github || ""} onChange={(e) => setSocialField("github", e.target.value)} className="input-field" placeholder="GitHub" dir="ltr" />
                    <input type="text" value={social.facebook || ""} onChange={(e) => setSocialField("facebook", e.target.value)} className="input-field" placeholder="Facebook" dir="ltr" />
                    <input type="text" value={social.instagram || ""} onChange={(e) => setSocialField("instagram", e.target.value)} className="input-field" placeholder="Instagram" dir="ltr" />
                    <input type="text" value={social.twitter || ""} onChange={(e) => setSocialField("twitter", e.target.value)} className="input-field" placeholder="X / Twitter" dir="ltr" />
                    <input type="text" value={social.website || ""} onChange={(e) => setSocialField("website", e.target.value)} className="input-field" placeholder={T("الموقع الإلكتروني")} dir="ltr" />
                  </div>
                </div>
              </>
            )}

            {/* أزرار التنقل */}
            <div className="flex gap-2 pt-3 border-t border-gray-50 mt-2">
              {step > 0 && (
                <button type="button" onClick={prev} className="btn btn-outline flex-1">
                  <ChevronRight className="w-4 h-4" />
                  {T("السابق")}
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="btn btn-primary btn-block">
                  {T("التالي")}
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={saving} className="btn btn-primary btn-block">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {saving ? T("جاري الحفظ...") : T("حفظ الملف المهني")}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
