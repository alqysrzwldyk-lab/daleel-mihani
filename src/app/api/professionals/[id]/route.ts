import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { Professional, type IProfessional } from "@/models/Professional";
import { Rating, type IRating } from "@/models/Rating";
import { HireRequest } from "@/models/HireRequest";
import { User } from "@/models/User";
import { Company } from "@/models/Company";

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  video: z.string().optional(),
  pdf: z.string().optional(),
  beforeAfter: z
    .object({
      before: z.string().optional(),
      after: z.string().optional(),
    })
    .optional(),
  completedDate: z.string().optional(),
});

const certificateSchema = z.object({
  name: z.string().min(1).max(200),
  organization: z.string().max(200).optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  image: z.string().optional(),
  pdf: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  photo: z.string().optional(),
  cover: z.string().optional(),
  professions: z.array(z.string().min(1)).min(1).max(2).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string()).optional(),
  workExperience: z
    .array(
      z.object({
        company: z.string().min(1),
        position: z.string().min(1),
        startDate: z.string().min(1),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  specialization: z.string().max(200).optional(),
  objective: z.string().max(1000).optional(),
  education: z.string().max(300).optional(),
  currentWorkplace: z.string().max(200).optional(),
  experienceYears: z.string().max(50).optional(),
  skillLevels: z
    .array(
      z.object({
        skill: z.string().min(1),
        level: z.number().min(0).max(100),
      })
    )
    .optional(),
  languages: z
    .array(
      z.object({
        name: z.string().min(1),
        level: z.string().optional(),
      })
    )
    .optional(),
  projects: z.array(projectSchema).optional(),
  certificates: z.array(certificateSchema).optional(),
  workingHours: z
    .object({
      days: z.array(z.string()).optional(),
      hours: z.string().max(200).optional(),
      availableToday: z.boolean().optional(),
      availableNow: z.boolean().optional(),
      emergencyAvailable: z.boolean().optional(),
    })
    .optional(),
  social: z
    .object({
      whatsapp: z.string().optional(),
      telegram: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      twitter: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  availability: z.enum(["available", "busy", "away"]).optional(),
});

function formatProfessional(professional: IProfessional) {
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
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const professional = await Professional.findById(id).lean<IProfessional | null>();
    if (!professional || !professional.isActive) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    const auth = getAuthFromRequest(req);
    let userRating: number | undefined;

    if (auth) {
      const rating = await Rating.findOne({
        professionalId: professional._id,
        raterUserId: auth.userId,
      }).lean<IRating | null>();
      userRating = rating?.score;
    }

    const [ratings, completedJobs] = await Promise.all([
      Rating.find({ professionalId: professional._id })
        .sort({ createdAt: -1 })
        .lean<IRating[]>(),
      HireRequest.countDocuments({
        professionalId: professional.userId,
        status: "accepted",
      }),
    ]);

    const reviewerIds = ratings.map((r) => r.raterUserId);
    const [reviewers, companies] = await Promise.all([
      User.find({ _id: { $in: reviewerIds } })
        .select("name")
        .lean<{ _id: string; name: string }[]>(),
      Company.find({ userId: { $in: reviewerIds } })
        .select("name")
        .lean<{ userId: string; name: string }[]>(),
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

    return NextResponse.json({
      ...formatProfessional(professional),
      userRating,
      reviews: ratings.map((r) => ({
        _id: String(r._id),
        score: r.score,
        comment: r.comment,
        reviewerName:
          companyMap.get(String(r.raterUserId)) ||
          reviewerMap.get(String(r.raterUserId)) ||
          "شركة",
        createdAt: r.createdAt,
      })),
      ratingDistribution: distribution,
      completedJobs,
    });
  } catch (error) {
    console.error("Professional get error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || auth.role !== "professional") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    await connectDB();

    const professional = await Professional.findById(id);
    if (!professional) {
      return NextResponse.json({ error: "notFound" }, { status: 404 });
    }

    if (professional.userId.toString() !== auth.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (data.professions) {
      professional.professions = data.professions;
    }
    if (data.name) professional.name = data.name;
    if (data.photo !== undefined) professional.photo = data.photo;
    if (data.cover !== undefined) professional.cover = data.cover;
    if (data.bio !== undefined) professional.bio = data.bio;
    if (data.skills) professional.skills = data.skills;
    if (data.workExperience) professional.workExperience = data.workExperience;
    if (data.location !== undefined) professional.location = data.location;
    if (data.phone !== undefined) professional.phone = data.phone;
    if (data.specialization !== undefined) professional.specialization = data.specialization;
    if (data.objective !== undefined) professional.objective = data.objective;
    if (data.education !== undefined) professional.education = data.education;
    if (data.currentWorkplace !== undefined) professional.currentWorkplace = data.currentWorkplace;
    if (data.experienceYears !== undefined) professional.experienceYears = data.experienceYears;
    if (data.skillLevels) professional.skillLevels = data.skillLevels;
    if (data.languages) professional.languages = data.languages;
    if (data.projects) professional.projects = data.projects;
    if (data.certificates) professional.certificates = data.certificates;
    if (data.workingHours !== undefined) professional.workingHours = data.workingHours;
    if (data.social !== undefined) professional.social = data.social;
    if (data.availability !== undefined) professional.availability = data.availability;

    await professional.save();

    return NextResponse.json(formatProfessional(professional));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    console.error("Professional update error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
