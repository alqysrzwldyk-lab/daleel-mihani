import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import { Professional, type IProfessional } from "@/models/Professional";
import { Rating, type IRating } from "@/models/Rating";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  photo: z.string().optional(),
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
});

function formatProfessional(professional: IProfessional) {
  return {
    _id: String(professional._id),
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

    return NextResponse.json({
      ...formatProfessional(professional),
      userRating,
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
    if (data.bio !== undefined) professional.bio = data.bio;
    if (data.skills) professional.skills = data.skills;
    if (data.workExperience) professional.workExperience = data.workExperience;
    if (data.location !== undefined) professional.location = data.location;
    if (data.phone !== undefined) professional.phone = data.phone;

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
