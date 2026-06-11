"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation"; 
import { Plus, Trash2, Upload, CheckCircle, XCircle, Loader2, Save, MapPin, Phone, Briefcase } from "lucide-react";
import { PROFESSIONS } from "@/lib/professions";

type WorkExp = {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

type Profile = {
  id: string;
  name: string;
  photo?: string;
  profession: string;
  bio?: string;
  skills: string[];
  workExperience: WorkExp[];
  location?: string;
  phone?: string;
};

// 📥 مكون الشريط التفاعلي الاحترافي لأزرار (القبول / الرفض) المعلق
function HireActionBar() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("with"); 
  
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);
  const [actionType, setActionType] = useState<"accepted" | "rejected" | null>(null);
  const [loading, setLoading] = useState(false);

  if (!companyId || decision) return null;

  const handleDecision = async (status: "accepted" | "rejected") => {
    setLoading(true);
    setActionType(status);
    try {
      const res = await fetch("/api/hire/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status }),
      });

      if (res.ok) {
        setDecision(status);
      } else {
        alert("❌ حدث خطأ أثناء إرسال ردك إلى السيرفر.");
      }
    } catch (error) {
      console.error("Error sending response:", error);
      alert("❌ فشل الاتصال بالسيرفر، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 mb-8 text-right animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm" style={{ direction: "rtl" }}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 hidden sm:block mt-0.5">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900">💼 عرض عمل معلق بانتظار ردك الفوري</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            أرسلت لك شركة عرض عمل رسمي عبر المنصة. قبولك للعرض يفتح قنوات تواصل مباشرة لمناقشة تفاصيل المشروع، بينما الرفض يغلق المعاملة بأمان.
          </p>
        </div>
      </div>
      
      <div className="flex gap-3 w-full md:w-auto shrink-0">
        <button
          type="button"
          onClick={() => handleDecision("accepted")}
          disabled={loading}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-sm shadow-emerald-600/10 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading && actionType === "accepted" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {loading && actionType === "accepted" ? "جاري القبول..." : "قبول العرض"}
        </button>
        
        <button
          type="button"
          onClick={() => handleDecision("rejected")}
          disabled={loading}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-sm shadow-rose-600/10 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading && actionType === "rejected" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {loading && actionType === "rejected" ? "جاري الرفض..." : "رفض العرض"}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tProf = useTranslations("professions");
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skillsText, setSkillsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "professional") {
          router.push("/login");
          return;
        }
        if (d.profile) {
          setProfile({
            id: d.profile.id || d.profile._id,
            name: d.profile.name,
            photo: d.profile.photo,
            profession: d.profile.profession,
            bio: d.profile.bio,
            skills: d.profile.skills || [],
            workExperience: d.profile.workExperience || [],
            location: d.profile.location,
            phone: d.profile.phone,
          });
          setSkillsText((d.profile.skills || []).join(", "));
        }
      });
  }, [router]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, photo: data.url });
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  function addExperience() {
    if (!profile) return;
    setProfile({
      ...profile,
      workExperience: [
        ...profile.workExperience,
        { company: "", position: "", startDate: "", endDate: "", description: "" },
      ],
    });
  }

  function removeExperience(index: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      workExperience: profile.workExperience.filter((_, i) => i !== index),
    });
  }

  function updateExperience(index: number, field: keyof WorkExp, value: string) {
    if (!profile) return;
    const updated = [...profile.workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, workExperience: updated });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/professionals/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          photo: profile.photo,
          profession: profile.profession,
          bio: profile.bio,
          skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
          workExperience: profile.workExperience.filter((w) => w.company && w.position),
          location: profile.location,
          phone: profile.phone,
        }),
      });

      if (res.ok) {
        setSaved(true);
        // إخفاء إشعار الحفظ التلقائي بنعومة بعد 4 ثوانٍ
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6" style={{ direction: "rtl" }}>
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-96 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ direction: "rtl" }}>
      
      {/* شريط الإجراءات والطلبات الذكي المعزز بـ Suspense */}
      <Suspense fallback={<div className="h-20 bg-slate-50 rounded-2xl animate-pulse mb-6" />}>
        <HireActionBar />
      </Suspense>

      <div className="mb-6 text-right">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-1.5">{t("subtitle")}</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{t("saved")}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
        
        {/* قسم الصورة الشخصية المطور */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-50">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 relative group shadow-inner flex items-center justify-center">
            {profile.photo ? (
              <Image src={profile.photo} alt={profile.name} width={96} height={96} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
            ) : (
              <div className="text-4xl select-none">👤</div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-right space-y-2">
            <label className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition shadow-sm active:scale-95 disabled:opacity-50">
              <Upload className="w-4 h-4" />
              <span>{uploading ? "جاري الرفع..." : t("photo")}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
            <p className="text-[11px] text-slate-400">يدعم صيغ JPG، PNG بجودة عالية</p>
          </div>
        </div>

        {/* الحقول النصية والأساسية */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t("profession")}</label>
            <div className="relative">
              <select
                value={profile.profession}
                onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
              >
                {PROFESSIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.icon} {tProf(p.key)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t("bio")}</label>
            <textarea
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder={t("bioPlaceholder")}
              rows={4}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t("skills")}</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
              placeholder="React, Node.js, TypeScript"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" /> {t("location")}
              </label>
              <input
                type="text"
                value={profile.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Phone className="w-4 h-4 text-slate-400" /> {t("phone")}
              </label>
              <input
                type="document"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 text-left tracking-wider focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition"
                style={{ direction: "ltr" }}
              />
            </div>
          </div>
        </div>

        {/* قسم خبرات العمل المتطور والمحمي الحذف والتحميل */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">{t("workHistory")}</h3>
            <button 
              type="button" 
              onClick={addExperience} 
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="w-4 h-4" /> {t("addExperience")}
            </button>
          </div>

          {profile.workExperience.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
              لم تقم بإضافة أي خبرات مهنية بعد. أضف خبراتك لزيادة موثوقية ملفك الشخصي.
            </div>
          ) : (
            <div className="space-y-4">
              {profile.workExperience.map((exp, i) => (
                <div key={i} className="bg-slate-50/40 border border-slate-100 rounded-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">خبرة #{i + 1}</span>
                    <button 
                      type="button" 
                      onClick={() => removeExperience(i)} 
                      className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      placeholder={t("company")}
                      value={exp.company}
                      onChange={(e) => updateExperience(i, "company", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none transition"
                    />
                    <input
                      placeholder={t("position")}
                      value={exp.position}
                      onChange={(e) => updateExperience(i, "position", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none transition"
                    />
                    <input
                      type="month"
                      placeholder={t("startDate")}
                      value={exp.startDate}
                      onChange={(e) => updateExperience(i, "startDate", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none transition text-right"
                    />
                    <input
                      type="month"
                      placeholder={t("endDate")}
                      value={exp.endDate || ""}
                      onChange={(e) => updateExperience(i, "endDate", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 outline-none transition text-right"
                    />
                  </div>
                  <textarea
                    placeholder={t("description")}
                    value={exp.description || ""}
                    onChange={(e) => updateExperience(i, "description", e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 outline-none transition resize-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* زر حفظ النموذج النهائي المعزز بحالة التحميل الاحترافية */}
        <button 
          type="submit" 
          disabled={saving} 
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/70 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 text-sm md:text-base active:scale-[0.99] disabled:pointer-events-none"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{saving ? "جاري حفظ التغييرات..." : t("save")}</span>
        </button>
      </form>
    </div>
  );
}