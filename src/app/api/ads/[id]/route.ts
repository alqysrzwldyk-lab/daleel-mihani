import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdBoost } from "@/models/AdBoost";
import { Favorite } from "@/models/Favorite";
import { User } from "@/models/User";
import { Professional } from "@/models/Professional";
import { incrementAdStat } from "@/lib/adStats";

export const dynamic = "force-dynamic";

// شكل وثيقة الإعلان بعد تحويلها إلى كائن عادي (lean)
type AdLean = {
  _id: unknown;
  userId?: unknown;
  type: string;
  category: string;
  title: string;
  description: string;
  price?: number | null;
  currency?: string;
  location: string;
  images?: string[];
  specifications?: Record<string, string>;
  status: string;
  views: number;
  createdAt?: Date;
};

// قراءة عامة لتفاصيل إعلان واحد + معلومات البائع
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await getAuthFromCookies();
    const resolvedParams = await params;
    const adId = resolvedParams.id;

    const ad = (await Ad.findById(adId).lean()) as unknown as AdLean;
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    // زيادة عداد المشاهدات (لا يُحسب عند فتح البائع لإعلانه الخاص)
    if (!auth?.userId || auth.userId.toString() !== ad.userId?.toString()) {
      await Ad.findByIdAndUpdate(adId, { $inc: { views: 1 } });
      ad.views = (ad.views || 0) + 1;
      await incrementAdStat(ad._id, "views");
    }

    // حالة التعزيز (لشارة "معزز")
    const activeBoost = await AdBoost.findOne({
      adId: ad._id,
      status: "active",
      endDate: { $gte: new Date() },
    }).lean();

    // هل الإعلان محفوظ في مفضلة المستخدم الحالي؟
    let isFavorite = false;
    if (auth?.userId) {
      const fav = await Favorite.findOne({ userId: auth.userId, adId: ad._id }).lean();
      isFavorite = !!fav;
    }

    // بيانات البائع (مستخدم + ملف مهني إن وُجد)
    let seller: unknown = null;
    if (ad.userId) {
      const user = (await User.findById(ad.userId)
        .select("name avatar role hasProfile averageRating ratingCount")
        .lean()) as unknown as
        | {
            name?: string;
            avatar?: string;
            role?: string;
            hasProfile?: boolean;
            averageRating?: number;
            ratingCount?: number;
          }
        | null;

      const professional = (await Professional.findOne({ userId: ad.userId })
        .select(
          "name photo professions specialization averageRating ratingCount experienceYears phone social"
        )
        .lean()) as unknown as
        | {
            name?: string;
            photo?: string;
            professions?: string[];
            specialization?: string;
            averageRating?: number;
            ratingCount?: number;
            experienceYears?: string;
            phone?: string;
            social?: { whatsapp?: string };
          }
        | null;

      const adsCount = await Ad.countDocuments({ userId: ad.userId, status: "active" });

      seller = {
        userId: String(ad.userId),
        name: professional?.name || user?.name || "بائع",
        avatar: professional?.photo || user?.avatar || null,
        role: user?.role || "professional",
        hasProfile: !!professional,
        profession: professional?.professions?.[0] || professional?.specialization || null,
        averageRating: user?.averageRating || professional?.averageRating || 0,
        ratingCount: user?.ratingCount || professional?.ratingCount || 0,
        experienceYears: professional?.experienceYears || null,
        phone: professional?.phone || null,
        whatsapp: professional?.social?.whatsapp || null,
        activeAdsCount: adsCount,
      };
    }

    return NextResponse.json(
      {
        success: true,
        ad: {
          ...ad,
          adNumber: String(ad._id).slice(-6).toUpperCase(),
          specifications:
            ad.specifications instanceof Map
              ? Object.fromEntries(ad.specifications)
              : ad.specifications || undefined,
        },
        seller,
        boosted: !!activeBoost,
        isFavorite,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب تفاصيل الإعلان";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// تعديل إعلان (الصور تبقى كما هي)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالعملية" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const adId = resolvedParams.id;

    const ad = await Ad.findById(adId);
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    if (ad.userId?.toString() !== auth.userId.toString()) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل هذا الإعلان" }, { status: 403 });
    }

    const body = await request.json();
    const { category, title, description, price, currency, location, specifications } = body;

    if (!title || !description || !location) {
      return NextResponse.json({ error: "العنوان والوصف والموقع مطلوبة" }, { status: 400 });
    }

    ad.category = category || ad.category;
    ad.title = String(title).trim();
    ad.description = String(description).trim();
    ad.price = price !== undefined && price !== "" && price !== null ? Number(price) : null;
    ad.currency = currency || ad.currency;
    ad.location = String(location).trim();
    if (specifications && typeof specifications === "object") {
      ad.specifications = specifications;
    }

    await ad.save();

    return NextResponse.json({ success: true, message: "تم تحديث الإعلان بنجاح", ad }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل تحديث الإعلان";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// حذف إعلان من المحفظة
// 🌟 تم تحديث تعريف params ليكون كـ Promise متوافق مع Next.js الحديث
export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json({ error: "غير مصرح بالعملية" }, { status: 401 });
    }

    await connectDB();
    
    // 🌟 فك الوعد (Await) للـ params لاستخراج الـ id بأمان ومنع خطأ المترجم
    const resolvedParams = await params;
    const adId = resolvedParams.id;

    // التأكد من أن المستخدم هو صاحب الإعلان الفعلي قبل الحذف لحماية البيانات
    const ad = await Ad.findById(adId);
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    // التحقق من ملكية الإعلان عبر حماية تيب الـ IDs وتحويلها لنصوص
    if (ad.userId?.toString() !== auth.userId.toString()) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف هذا الإعلان" }, { status: 403 });
    }

    await Ad.findByIdAndDelete(adId);
    return NextResponse.json({ success: true, message: "تم حذف الإعلان من محفظتك بنجاح" }, { status: 200 });
    
  } catch (error) {
    // 🌟 حماية الـ catch واستخراج نص الخطأ الفعلي لتجاوز فحص TypeScript الصارم
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء الحذف";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}