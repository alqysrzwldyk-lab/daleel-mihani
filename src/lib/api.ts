export type ProfessionalPublic = {
  _id: string;
  userId: string;
  name: string;
  photo?: string;
  professions: string[];
  profession: string;
  bio?: string;
  skills: string[];
  workExperience: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }[];
  location?: string;
  phone?: string;
  email: string;
  averageRating: number;
  ratingCount: number;
  cover?: string;
  specialization?: string;
  objective?: string;
  education?: string;
  currentWorkplace?: string;
  experienceYears?: string;
  skillLevels?: { skill: string; level: number }[];
  languages?: { name: string; level?: string }[];
  projects?: {
    title: string;
    description?: string;
    category?: string;
    image?: string;
    images?: string[];
    video?: string;
    pdf?: string;
    beforeAfter?: { before?: string; after?: string };
    completedDate?: string;
  }[];
  certificates?: {
    name: string;
    organization?: string;
    issueDate?: string;
    expiryDate?: string;
    image?: string;
    pdf?: string;
  }[];
  workingHours?: {
    days?: string[];
    hours?: string;
    availableToday?: boolean;
    availableNow?: boolean;
    emergencyAvailable?: boolean;
  };
  social?: {
    whatsapp?: string;
    telegram?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  availability?: "available" | "busy" | "away";
};

export async function fetchProfessionals(params?: {
  q?: string;
  profession?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.profession) searchParams.set("profession", params.profession);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`/api/professionals?${searchParams.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch professionals");
  return res.json() as Promise<{
    data: ProfessionalPublic[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function fetchProfessional(id: string) {
  const res = await fetch(`/api/professionals/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<ProfessionalPublic & { userRating?: number }>;
}
