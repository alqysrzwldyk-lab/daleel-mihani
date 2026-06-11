// app/api/auth/check/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    
    if (!auth) {
      return NextResponse.json({ 
        authenticated: false, 
        error: "No token found" 
      }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.userId).select("-password");
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: "User not found" 
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ 
      authenticated: false, 
      error: "Server error" 
    }, { status: 500 });
  }
}