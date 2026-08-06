import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: 'الدليل المهني - كل المهنيين في مكان واحد',
  description: 'منصة تجمع المهنيين، الحرفيين، الطلاب، والخبراء مع أصحاب الأعمال لتسهيل الوصول إلى الكفاءات وبناء فرص مهنية حقيقية.',
  openGraph: {
    title: 'الدليل المهني - كل المهنيين في مكان واحد',
    description: 'منصة تجمع المهنيين، الحرفيين، الطلاب، والخبراء مع أصحاب الأعمال لتسهيل الوصول إلى الكفاءات.',
    url: 'https://daleel-mihani-azzam-s-projects5.vercel.app',
    siteName: 'الدليل المهني',
    locale: 'ar_AR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
