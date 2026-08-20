import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromCookies } from "@/lib/auth";
import { Wallet } from "@/models/Wallet";
import { Payment } from "@/models/Payment";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";
import { createPayment } from "@/lib/payments";
import { z } from "zod";
import { isRateLimited } from "@/lib/rateLimit";

const MIN_DEPOSIT = 100;
const MAX_DEPOSIT = 10_000_000;

const depositSchema = z
  .object({
    amount: z.number().int().min(MIN_DEPOSIT).max(MAX_DEPOSIT),
    method: z.enum(["card", "bank", "transfer"]),
    card: z
      .object({
        holder: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().min(8).optional(),
      })
      .optional(),
    bank: z
      .object({
        accountName: z.string().min(1),
        accountNumber: z.string().min(1),
        bankName: z.string().min(1),
        receiptUrl: z.string().url().optional(),
      })
      .optional(),
    transfer: z
      .object({
        senderName: z.string().min(1),
        referenceNumber: z.string().min(1),
        provider: z.string().min(1),
        receiptUrl: z.string().url().optional(),
        recipientName: z.string().optional(),
      })
      .optional(),
    idempotencyKey: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "card" && !data.card) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card data required",
        path: ["card"],
      });
    }
    if (data.method === "bank" && !data.bank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank data required",
        path: ["bank"],
      });
    }
    if (data.method === "transfer" && !data.transfer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transfer data required",
        path: ["transfer"],
      });
    }
  });

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(`deposit:${ip}`, { windowMs: 60000, maxRequests: 10 })) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح. حاول لاحقاً" },
        { status: 429 }
      );
    }

    if (
      isRateLimited(`deposit:${auth.userId}`, { windowMs: 60000, maxRequests: 10 })
    ) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح. حاول لاحقاً" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { amount, method, card, bank, transfer, idempotencyKey } =
      parsed.data;

    await connectDB();

    let wallet = await Wallet.findOne({ userId: auth.userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId: auth.userId, balance: 0 });
    }

    if (idempotencyKey) {
      const existing = await Payment.findOne({ idempotencyKey });
      if (existing) {
        return NextResponse.json({
          success: true,
          paymentId: existing._id,
          status: existing.status,
          checkoutUrl: existing.metadata?.checkoutUrl,
        });
      }
    }

    if (method === "card") {
      const payment = await Payment.create({
        userId: auth.userId,
        amount,
        currency: wallet.currency,
        method: "card",
        provider: "gateway",
        status: "processing",
        idempotencyKey,
        metadata: {
          cardHolder: card?.holder,
          initiatedAt: new Date().toISOString(),
        },
      });

      const specialReference = String(payment._id);

      const providerResult = await createPayment({
        userId: auth.userId,
        amount,
        currency: wallet.currency,
        method: "card",
        idempotencyKey,
        metadata: {
          specialReference,
          email: card?.email,
          phone: card?.phone,
          firstName: card?.holder,
          cardHolder: card?.holder,
        },
      });

      payment.provider = "gateway";
      payment.providerReference = providerResult.providerReference || specialReference;
      payment.providerOrderId = (providerResult.metadata?.paymobOrderId as string) || undefined;
      payment.metadata = {
        ...payment.metadata,
        checkoutUrl: providerResult.checkoutUrl,
      };
      await payment.save();

      return NextResponse.json({
        success: true,
        paymentId: payment._id,
        status: "processing",
        checkoutUrl: providerResult.checkoutUrl,
      });
    }

    if (method === "bank") {
      const payment = await Payment.create({
        userId: auth.userId,
        amount,
        currency: wallet.currency,
        method: "bank",
        provider: "manual",
        status: "pending",
        idempotencyKey,
        metadata: {
          bankName: bank?.bankName,
          accountName: bank?.accountName,
          accountNumber: bank?.accountNumber?.slice(-4),
          receiptUrl: bank?.receiptUrl,
          initiatedAt: new Date().toISOString(),
        },
        note: `تحويل بنكي من ${bank?.bankName}`,
      });

      await Notification.create({
        recipientId: auth.userId,
        title: "طلب تحويل بنكي",
        message: `تم استلام طلب تحويل بنكي بمبلغ ${amount.toLocaleString()} ${wallet.currency}. في انتظار المراجعة.`,
        type: "info",
        link: "/wallet",
      });

      return NextResponse.json({
        success: true,
        paymentId: payment._id,
        status: "pending",
      });
    }

    if (method === "transfer") {
      const payment = await Payment.create({
        userId: auth.userId,
        amount,
        currency: wallet.currency,
        method: "transfer",
        provider: "manual",
        status: "pending",
        idempotencyKey,
        metadata: {
          senderName: transfer?.senderName,
          referenceNumber: transfer?.referenceNumber,
          provider: transfer?.provider,
          receiptUrl: transfer?.receiptUrl,
          recipientName: transfer?.recipientName,
          initiatedAt: new Date().toISOString(),
        },
        note: `حوالة مالية من ${transfer?.senderName}`,
      });

      await Notification.create({
        recipientId: auth.userId,
        title: "طلب حوالة مالية",
        message: `تم استلام طلب حوالة مالية بمبلغ ${amount.toLocaleString()} ${wallet.currency}. في انتظار المراجعة.`,
        type: "info",
        link: "/wallet",
      });

      return NextResponse.json({
        success: true,
        paymentId: payment._id,
        status: "pending",
      });
    }

    return NextResponse.json(
      { error: "طريقة الدفع غير صالحة" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json(
      { error: "فشل شحن المحفظة" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    await connectDB();
    const deposits = await Transaction.find({
      fromUserId: auth.userId,
      type: { $in: ["deposit", "bank_transfer", "remittance"] },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const payments = await Payment.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, deposits, payments });
  } catch {
    return NextResponse.json(
      { error: "فشل جلب عمليات الشحن" },
      { status: 500 }
    );
  }
}
