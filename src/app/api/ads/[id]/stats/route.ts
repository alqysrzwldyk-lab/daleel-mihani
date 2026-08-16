import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Ad } from "@/models/Ad";
import { AdDailyStat } from "@/models/AdDailyStat";

export const dynamic = "force-dynamic";

const VALID_DAYS = [7, 14, 30];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type Row = {
  date: string;
  views?: number;
  contacts?: number;
  shares?: number;
  favorites?: number;
};

type SeriesPoint = {
  date: string;
  label: string;
  views: number;
  contacts: number;
  shares: number;
  favorites: number;
};

function buildSeries(
  rows: Row[],
  days: number,
  endDate: Date,
  withLabels: boolean
): SeriesPoint[] {
  const byDate: Record<string, Row> = {};
  for (const r of rows) byDate[r.date] = r;

  const series: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const row = byDate[key];
    series.push({
      date: key,
      label: withLabels
        ? d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
        : "",
      views: row?.views || 0,
      contacts: row?.contacts || 0,
      shares: row?.shares || 0,
      favorites: row?.favorites || 0,
    });
  }
  return series;
}

function sumSeries(series: SeriesPoint[]) {
  return {
    views: series.reduce((a, p) => a + p.views, 0),
    contacts: series.reduce((a, p) => a + p.contacts, 0),
    shares: series.reduce((a, p) => a + p.shares, 0),
    favorites: series.reduce((a, p) => a + p.favorites, 0),
  };
}

// نسبة التغير: null تعني نشاط جديد بلا أساس سابق للمقارنة
function deltaPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? null : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

// إحصائيات إعلان (للمالك فقط): سلسلة يومية + إجماليات الفترة + نسبة التغير
export async function GET(
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

    const ad = await Ad.findById(adId).select("_id userId title status");
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }
    if (ad.userId?.toString() !== auth.userId.toString()) {
      return NextResponse.json({ error: "لا تملك صلاحية الاطلاع على هذه الإحصائيات" }, { status: 403 });
    }

    const url = new URL(request.url);
    const daysParam = Number(url.searchParams.get("days") || 14);
    const days = VALID_DAYS.includes(daysParam) ? daysParam : 14;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    const currentRows = (await AdDailyStat.find({
      adId,
      date: { $gte: formatDateKey(startDate), $lte: formatDateKey(today) },
    })
      .select("date views contacts shares favorites")
      .lean()) as unknown as Row[];

    const series = buildSeries(currentRows, days, today, true);
    const current = sumSeries(series);

    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    const prevRows = (await AdDailyStat.find({
      adId,
      date: { $gte: formatDateKey(prevStart), $lte: formatDateKey(prevEnd) },
    })
      .select("date views contacts shares favorites")
      .lean()) as unknown as Row[];

    const previous = sumSeries(buildSeries(prevRows, days, prevEnd, false));

    const deltas = {
      views: deltaPct(current.views, previous.views),
      contacts: deltaPct(current.contacts, previous.contacts),
      shares: deltaPct(current.shares, previous.shares),
      favorites: deltaPct(current.favorites, previous.favorites),
    };

    return NextResponse.json(
      {
        success: true,
        ad: { _id: String(ad._id), title: ad.title, status: ad.status },
        days,
        totals: current,
        deltas,
        series,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "فشل جلب الإحصائيات";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
