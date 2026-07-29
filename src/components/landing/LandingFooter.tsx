import { Link } from "@/i18n/navigation";
import { Briefcase } from "lucide-react";

const footerLinks = {
  الخدمات: ["ملفات مهنية", "بحث متقدم", "تقييمات", "توثيق", "تواصل"],
  التخصصات: ["أطباء", "مهندسون", "مبرمجون", "مصممون", "حرفيون"],
  الدعم: ["اتصل بنا", "الأسئلة الشائعة", "سياسة الخصوصية", "شروط الاستخدام"],
};

export default function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">الدليل المهني</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              المنصة الأولى في العالم العربي لربط المهنيين والحرفيين وأصحاب الأعمال.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-white text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="/search" className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} الدليل المهني. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            {["تويتر", "لينكدإن", "واتساب"].map((s) => (
              <span key={s} className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}