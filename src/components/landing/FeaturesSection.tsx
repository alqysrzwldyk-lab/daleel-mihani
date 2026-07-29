"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserCheck, Search, Star, Award, FolderOpen, Building2,
  ShieldCheck, MessageSquare, TrendingUp, Bookmark, Heart, FileText
} from "lucide-react";

const features = [
  { icon: UserCheck, title: "ملفات مهنية احترافية", desc: "أنشئ ملفاً شخصياً يعرض خبراتك ومهاراتك وشهاداتك بشكل احترافي" },
  { icon: Search, title: "بحث متقدم", desc: "ابحث عن المهنيين حسب التخصص، الموقع، التقييم، والمزيد" },
  { icon: Star, title: "تقييمات موثوقة", desc: "تقييمات حقيقية من العملاء تساعدك في اختيار أفضل المهنيين" },
  { icon: Award, title: "شهادات معتمدة", desc: "ارفع شهاداتك المهنية وأضفها لملفك لتعزيز مصداقيتك" },
  { icon: FolderOpen, title: "معرض الأعمال", desc: "اعرض أعمالك السابقة ومشاريعك لجذب المزيد من العملاء" },
  { icon: Building2, title: "ملفات شركات", desc: "للشركات والمؤسسات ملفات خاصة لعرض خدماتها وفريق عملها" },
  { icon: ShieldCheck, title: "توثيق المهنيين", desc: "حسابات موثقة تضمن مصداقية المهنيين وجودة الخدمات المقدمة" },
  { icon: MessageSquare, title: "تواصل مع العملاء", desc: "تواصل مباشر مع العملاء وأصحاب الأعمال (قريباً)" },
  { icon: TrendingUp, title: "فرص عمل جديدة", desc: "احصل على فرص عمل ومشاريع تناسب تخصصك ومهاراتك" },
  { icon: Bookmark, title: "حفظ المفضلة", desc: "احفظ المهنيين والخدمات المفضلة لديك للرجوع إليها لاحقاً" },
  { icon: Heart, title: "المفضلة", desc: "أضف المهنيين المتميزين إلى قائمة مفضلتك لمتابعتهم" },
  { icon: FileText, title: "السيرة الذاتية", desc: "أنشئ سيرة ذاتية احترافية ومشاركتها مع أصحاب العمل" },
];

export default function FeaturesSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white" ref={ref}>
      <div className="page-container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">مميزات الدليل المهني</h2>
          <p className="text-muted max-w-xl mx-auto">كل ما تحتاجه لبناء هويتك المهنية والتواصل مع أصحاب العمل</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className={`p-4 md:p-5 rounded-xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-md transition-all duration-500 group ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <feat.icon className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-sm mb-1">{feat.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}