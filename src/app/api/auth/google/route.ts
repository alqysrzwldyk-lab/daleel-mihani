import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (isRateLimited(ip, { windowMs: 60 * 1000, maxRequests: 10 })) {
      return NextResponse.json({ error: "محاولات كثيرة. حاول بعد دقيقة." }, { status: 429 });
    }

    const { credential } = await req.json();
    if (!credential) {
      return NextResponse.json({ error: "missing credential" }, { status: 400 });
    }

    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!resp.ok) {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const payload = await resp.json() as {
      sub: string;
      email: string;
      name: string;
      picture: string;
      email_verified: string;
    };

    if (!payload.email_verified || payload.email_verified !== "true") {
      return NextResponse.json({ error: "email not verified" }, { status: 403 });
    }

    await connectDB();

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email: payload.email.toLowerCase() });
      if (user) {
        user.googleId = payload.sub;
        if (!user.avatar) user.avatar = payload.picture;
        await user.save();
      }
    }

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email.toLowerCase(),
        role: "employer",
        googleId: payload.sub,
        avatar: payload.picture,
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;

  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}