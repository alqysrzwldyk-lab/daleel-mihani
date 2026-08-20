import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  const configured = !!(
    process.env.PAYMOB_SECRET_KEY &&
    process.env.PAYMOB_HMAC_SECRET &&
    process.env.PAYMOB_INTEGRATION_ID_CARD
  );

  const baseUrl = process.env.PAYMOB_BASE_URL || "https://accept.paymob.com";
  const sandbox = baseUrl.includes("sandbox") || !!process.env.PAYMOB_SECRET_KEY?.startsWith("sk_test");

  return NextResponse.json({
    provider: configured ? "paymob" : null,
    enabled: configured,
    currency: "YER",
    sandbox,
    configured,
    cardEnabled: process.env.NEXT_PUBLIC_CARD_ENABLED !== "false",
    bankEnabled: process.env.NEXT_PUBLIC_BANK_ENABLED !== "false",
    transferEnabled: process.env.NEXT_PUBLIC_TRANSFER_ENABLED !== "false",
    minDeposit: Number(process.env.NEXT_PUBLIC_MIN_DEPOSIT) || 100,
    maxDeposit: Number(process.env.NEXT_PUBLIC_MAX_DEPOSIT) || 10_000_000,
  });
}
