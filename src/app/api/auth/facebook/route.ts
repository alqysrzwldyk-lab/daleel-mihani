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

    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "missing access token" }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: "Facebook not configured" }, { status: 500 });
    }

    const debugResp = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
    );
    if (!debugResp.ok) {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const debugData = await debugResp.json() as {
      data: { user_id: string; is_valid: boolean };
    };

    if (!debugData.data.is_valid) {
      return NextResponse.json({ error: "token expired" }, { status: 401 });
    }

    const fbUserId = debugData.data.user_id;

    const meResp = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`
    );
    if (!meResp.ok) {
      return NextResponse.json({ error: "failed to fetch profile" }, { status: 500 });
    }

    const profile = await meResp.json() as {
      id: string;
      name: string;
      email?: string;
      picture?: { data: { url: string } };
    };

    await connectDB();

    const fbEmail = profile.email
      ? profile.email.toLowerCase()
      : `fb_${fbUserId}@facebook.daleel`;

    let user = await User.findOne({ facebookId: fbUserId });
    if (!user) {
      user = await User.findOne({ email: fbEmail });
      if (user) {
        user.facebookId = fbUserId;
        if (!user.avatar) user.avatar = profile.picture?.data.url;
        await user.save();
      }
    }

    if (!user) {
      user = await User.create({
        name: profile.name,
        email: fbEmail,
        role: "employer",
        facebookId: fbUserId,
        avatar: profile.picture?.data.url,
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
    console.error("Facebook OAuth error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}