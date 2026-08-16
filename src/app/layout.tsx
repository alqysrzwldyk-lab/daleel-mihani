import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { tr } from "@/i18n/translate";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "ar";
  const siteName = tr("الدليل المهني", locale);
  const tagline = `${tr("كل المهنيين", locale)} ${tr("في مكان واحد", locale)}`;
  const title = `${siteName} - ${tagline}`;
  const description = tr("منصة تجمع المهنيين، الحرفيين، الطلاب، والخبراء مع أصحاب الأعمال لتسهيل الوصول إلى الكفاءات وبناء فرص مهنية حقيقية.", locale);
  const shortDescription = tr("منصة تجمع المهنيين، الحرفيين، الطلاب، والخبراء مع أصحاب الأعمال لتسهيل الوصول إلى الكفاءات.", locale);
  return {
    title,
    description,
    openGraph: {
      title,
      description: shortDescription,
      url: "https://daleel-mihani-azzam-s-projects5.vercel.app",
      siteName,
      locale: locale === "ar" ? "ar_AR" : "en_US",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="h-full" style={{ "--font-cairo": "'Cairo', system-ui, sans-serif" } as React.CSSProperties} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap"
          rel="stylesheet"
        />
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
