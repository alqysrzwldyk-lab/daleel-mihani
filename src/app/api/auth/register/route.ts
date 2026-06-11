import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";
import { signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema, validationMessageKey } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    await connectDB();

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "emailExists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashed,
      role: data.role,
    });

    if (data.role === "professional") {
      await Professional.create({
        userId: user._id,
        name: data.name,
        email: data.email.toLowerCase(),
        profession: "other",
        skills: [],
        workExperience: [],
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "validation", field: validationMessageKey(error) },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("ECONNREFUSED") ||
      message.includes("connect") ||
      message.includes("MongoServerSelectionError")
    ) {
      return NextResponse.json({ error: "databaseUnavailable" }, { status: 503 });
    }

    console.error("Register error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
