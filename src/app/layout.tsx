import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata = {
  title: "الدليل المهني | منصة توظيف المحترفين",
  description: "الدليل المهني هو وجهتك الأولى للتواصل بين أصحاب الشركات وأمهر المحترفين في مختلف المجالات.",
  keywords: ["توظيف", "عمل حر", "محترفون", "الدليل المهني", "شركات", "فرص عمل"],
  openGraph: {
    title: "الدليل المهني - انطلاقة تجريبية",
    description: "انضم إلى منصة الدليل المهني للوصول إلى أفضل الفرص والمواهب.",
    url: "https://daleel-mihani.vercel.app",
    siteName: "الدليل المهني",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
