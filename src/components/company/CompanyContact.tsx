"use client";

import {
  Phone,
  Mail,
  Globe,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Send,
  MessageCircle,
} from "lucide-react";
import type { CompanyPublic } from "@/lib/companyTypes";

function normalizeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

// بطاقة التواصل مع الشركة: بيانات الاتصال وروابط وسائل التواصل
export default function CompanyContact({ company }: { company: CompanyPublic }) {
  const social = company.social || {};
  const socialLinks: Array<{ icon: typeof Phone; href: string; label: string; color: string }> = [];

  if (social.facebook)
    socialLinks.push({ icon: Facebook, href: normalizeUrl(social.facebook), label: "فيسبوك", color: "bg-[#1877F2]/10 text-[#1877F2]" });
  if (social.instagram)
    socialLinks.push({ icon: Instagram, href: normalizeUrl(social.instagram), label: "انستغرام", color: "bg-pink-500/10 text-pink-500" });
  if (social.linkedin)
    socialLinks.push({ icon: Linkedin, href: normalizeUrl(social.linkedin), label: "لينكدإن", color: "bg-[#0A66C2]/10 text-[#0A66C2]" });
  if (social.twitter)
    socialLinks.push({ icon: Twitter, href: normalizeUrl(social.twitter), label: "إكس", color: "bg-slate-100 text-slate-700" });
  if (social.whatsapp)
    socialLinks.push({ icon: MessageCircle, href: normalizeUrl(social.whatsapp), label: "واتساب", color: "bg-[#25D366]/10 text-[#25D366]" });
  if (social.telegram)
    socialLinks.push({ icon: Send, href: normalizeUrl(social.telegram), label: "تيليجرام", color: "bg-[#229ED9]/10 text-[#229ED9]" });

  const hasContact = !!company.phone || !!company.email || !!company.website || !!company.workingHours;

  if (!hasContact && socialLinks.length === 0) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl card-shadow p-6">
      <h2 className="text-lg font-black text-[var(--foreground)] mb-4">📞 التواصل مع الشركة</h2>

      <div className="space-y-3">
        {company.phone && (
          <a href={`tel:${company.phone}`} dir="ltr" className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-start transition hover:border-[var(--primary)]">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
              <Phone className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <span className="text-sm font-bold text-[var(--foreground)]">{company.phone}</span>
          </a>
        )}
        {company.email && (
          <a href={`mailto:${company.email}`} dir="ltr" className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-start transition hover:border-[var(--primary)]">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
              <Mail className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <span className="text-sm font-bold text-[var(--foreground)] truncate">{company.email}</span>
          </a>
        )}
        {company.website && (
          <a href={normalizeUrl(company.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 transition hover:border-[var(--primary)]">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
              <Globe className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <span className="text-sm font-bold text-[var(--foreground)] truncate">{company.website}</span>
          </a>
        )}
        {company.workingHours && (
          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <span className="text-sm font-bold text-[var(--foreground)]">{company.workingHours}</span>
          </div>
        )}
      </div>

      {socialLinks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
          <p className="text-xs font-bold text-[var(--muted)] mb-3">تابع الشركة على</p>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${s.color} inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition hover:scale-[1.03]`}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
