"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Briefcase, Loader2, CheckCircle, X, Plus, Upload, User } from "lucide-react";
import { getAvailableProfessions, getProfessionArabic, getProfessionIcon, isCustomProfession } from "@/lib/professions";

export default function CreateProfilePage() {
  const tProf = useTranslations("professions");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [professions, setProfessions] = useState<string[]>(["programmer", "designer"]);
  const [bio, setBio] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [customProfession, setCustomProfession] = useState("");

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
        const pid = d.profile?._id || d.profile?.id;
        if (pid) {
          setProfileId(pid);
          if (d.profile?.professions) {
            setProfessions(d.profile.professions);
          }
          if (d.profile?.photo) setPhoto(d.profile.photo);
          if (d.profile?.bio) setBio(d.profile.bio);
          if (d.profile?.skills) setSkillsText(d.profile.skills.join(", "));
          if (d.profile?.location) setLocation(d.profile.location);
          if (d.profile?.phone) setPhone(d.profile.phone);
        }
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setPhoto(data.url);
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

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
          setError("لم يتم العثور على الملف المهني، حاول تسجيل الخروج وإعادة التسجيل");
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
          professions,
          bio: bio.trim(),
          skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
          location: location.trim(),
          phone: phone.trim(),
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => window.location.href = "/", 1500);
      } else {
        const data = await res.json();
        setError(data.error || "حدث خطأ");
      }
    } catch {
      setError("فشل الاتصال بالسيرفر");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="form-page">
        <div className="skeleton h-96 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  const allProfessions = getAvailableProfessions(professions.filter(isCustomProfession));

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1>أنشئ ملفك المهني</h1>
          <p className="subtitle">خطوة واحدة تفصلك عن الظهور لأصحاب الشركات</p>
        </div>

        {error && (
          <div className="bg-danger-light text-danger text-sm p-3 rounded-xl mb-4">{error}</div>
        )}

        {saved && (
          <div className="bg-success-light text-success text-sm p-4 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            تم إنشاء الملف بنجاح! جارِ التوجيه إلى لوحة التحكم...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <span>{uploading ? "جاري الرفع..." : "رفع صورة شخصية"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label">الاسم الكامل</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>

          <div className="input-group">
            <label className="input-label">المهن (اختر مهنتين كحد أقصى)</label>

            <div className="flex flex-wrap gap-2 mb-3">
              {professions.map((p) => (
                <span key={p} className="chip active flex items-center gap-1">
                  {getProfessionIcon(p)} {getProfessionArabic(p)}
                  <button type="button" onClick={() => toggleProfession(p)} className="me-1 hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
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
                        : "hover:bg-white hover:border-gray-200 border border-transparent"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.arabic}</span>
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
                placeholder="أضف مهنة مخصصة..."
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
            <label className="input-label">نبذة عنك</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-field"
              placeholder="اكتب نبذة قصيرة عن خبراتك ومهاراتك..."
              rows={3}
            />
          </div>

          <div className="input-group">
            <label className="input-label">المهارات (افصل بفاصلة)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="input-field"
              placeholder="مثال: React, Node.js, TypeScript"
            />
          </div>

          <div className="two-col">
            <div className="input-group">
              <label className="input-label">الموقع</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" placeholder="المدينة" />
            </div>
            <div className="input-group">
              <label className="input-label">رقم الهاتف</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="05xxxxxxxx" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary btn-block btn-lg mt-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {saving ? "جاري الحفظ..." : "إنشاء الملف المهني"}
          </button>
        </form>
      </div>
    </div>
  );
}
