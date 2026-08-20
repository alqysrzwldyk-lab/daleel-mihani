import { connectDB } from "@/lib/mongodb";
import { Professional, type IProfessional } from "@/models/Professional";
import { Rating, type IRating } from "@/models/Rating";
import { HireRequest } from "@/models/HireRequest";
import { User } from "@/models/User";
import { Company } from "@/models/Company";

export type ProfessionalDetails = ReturnType<typeof formatProfessional> & {
  userRating?: number;
  reviews: {
    _id: string;
    score: number;
    comment?: string;
    reviewerName: string;
    createdAt?: string;
  }[];
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  completedJobs: number;
};

export function formatProfessional(professional: IProfessional) {
  return {
    _id: String(professional._id),
    userId: String(professional.userId),
    name: professional.name,
    photo: professional.photo,
    professions: professional.professions || ["other"],
    profession: professional.professions?.[0] || "other",
    bio: professional.bio,
    skills: professional.skills,
    workExperience: professional.workExperience,
    location: professional.location,
    phone: professional.phone,
    email: professional.email,
    averageRating: professional.averageRating,
    ratingCount: professional.ratingCount,
    cover: professional.cover,
    specialization: professional.specialization,
    objective: professional.objective,
    education: professional.education,
    currentWorkplace: professional.currentWorkplace,
    experienceYears: professional.experienceYears,
    skillLevels: professional.skillLevels,
    languages: professional.languages,
    projects: professional.projects,
    certificates: professional.certificates,
    workingHours: professional.workingHours,
    social: professional.social,
    availability: professional.availability,
    verified: professional.verified,
  };
}

export async function getProfessionalDetails(
  id: string,
  opts?: { raterUserId?: string }
): Promise<ProfessionalDetails | null> {
  await connectDB();

  const professional = await Professional.findById(id).lean<IProfessional | null>();
  if (!professional || !professional.isActive) return null;

  const [ratings, completedJobs, userRating] = await Promise.all([
    Rating.find({ professionalId: professional._id })
      .sort({ createdAt: -1 })
      .lean<IRating[]>(),
    HireRequest.countDocuments({
      professionalId: professional.userId,
      status: "accepted",
    }),
    opts?.raterUserId
      ? Rating.findOne({
          professionalId: professional._id,
          raterUserId: opts.raterUserId,
        }).lean<IRating | null>()
      : Promise.resolve(null),
  ]);

  const reviewerIds = ratings.map((r) => r.raterUserId);
  const [reviewers, companies] = await Promise.all([
    User.find({ _id: { $in: reviewerIds } }).select("name").lean<{ _id: string; name: string }[]>(),
    Company.find({ userId: { $in: reviewerIds } }).select("name").lean<{ userId: string; name: string }[]>(),
  ]);

  const reviewerMap = new Map(reviewers.map((u) => [String(u._id), u.name]));
  const companyMap = new Map(companies.map((c) => [String(c.userId), c.name]));

  const allRatings = await Rating.find({ professionalId: professional._id })
    .select("score")
    .lean<{ score: number }[]>();

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allRatings.forEach((r) => {
    const s = Math.round(r.score);
    if (s >= 1 && s <= 5) distribution[s as keyof typeof distribution] += 1;
  });

  return {
    ...formatProfessional(professional),
    userRating: userRating?.score,
    reviews: ratings.map((r) => ({
      _id: String(r._id),
      score: r.score,
      comment: r.comment,
      reviewerName:
        companyMap.get(String(r.raterUserId)) ||
        reviewerMap.get(String(r.raterUserId)) ||
        "شركة",
      createdAt: r.createdAt?.toISOString(),
    })),
    ratingDistribution: distribution,
    completedJobs,
  };
}
