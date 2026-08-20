import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAuthFromCookies } from "@/lib/auth";
import { getProfessionalDetails } from "@/lib/professional";
import { getProfessionArabic } from "@/lib/professions";
import ProfessionalProfile from "@/components/ProfessionalProfile";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const professional = await getProfessionalDetails(id);
  if (!professional) return {};

  const profs = professional.professions?.length
    ? professional.professions
    : [professional.profession || "other"];
  const title = `${professional.name} | ${profs.map((p) => getProfessionArabic(p)).join(" • ")}`;
  const description =
    professional.specialization ||
    professional.bio?.slice(0, 150) ||
    "ملف مهني احترافي";
  const ogImage = professional.photo ? `${APP_URL}${professional.photo}` : undefined;

  return {
    title,
    description,
    alternates: { canonical: `${APP_URL}/${locale}/professionals/${professional._id}` },
    openGraph: {
      title,
      description,
      type: "profile",
      locale,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProfessionalPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const auth = await getAuthFromCookies();
  const professional = await getProfessionalDetails(id, {
    raterUserId: auth?.userId,
  });

  if (!professional) notFound();

  return <ProfessionalProfile professional={professional} />;
}
