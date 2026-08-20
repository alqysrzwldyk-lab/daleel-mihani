import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";
import { getPaymentProvider } from "@/lib/payments";
import { creditWallet } from "@/lib/wallet";
import { Notification } from "@/models/Notification";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (provider !== "card") {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "webhook";
  if (isRateLimited(`webhook:${ip}`, { maxRequests: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const rawBody = await req.text();
    const hmac = req.nextUrl.searchParams.get("hmac") || "";

    if (!hmac) {
      return NextResponse.json(
        { error: "Missing HMAC signature" },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const obj = (body.obj || body) as Record<string, unknown>;
    const paymobTransactionId = String(obj.id || "");
    const paymobOrderId = String(
      (obj.order as Record<string, unknown>)?.id || ""
    );
    const merchantOrderId = String(
      (obj.order as Record<string, unknown>)?.merchant_order_id || ""
    );
    const success = obj.success === true;
    const pending = obj.pending === true;

    if (!paymobOrderId && !merchantOrderId) {
      return NextResponse.json(
        { error: "Missing order identifiers" },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.findOne({
      $or: [
        { providerOrderId: paymobOrderId },
        { providerOrderId: merchantOrderId },
        { providerReference: merchantOrderId },
        { _id: merchantOrderId || undefined },
      ],
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.method !== "card") {
      return NextResponse.json(
        { error: "Payment method mismatch" },
        { status: 400 }
      );
    }

    if (payment.status === "completed") {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const adapter = getPaymentProvider("card");
    const verified = await adapter.verifyWebhook({
      providerReference: String(payment._id),
      status: success && !pending ? "completed" : "failed",
      amount: obj.amount_cents
        ? (obj.amount_cents as number) / 100
        : payment.amount,
      currency: (obj.currency as string) || payment.currency,
      rawBody,
      signature: hmac,
    });

    if (verified.amount !== payment.amount) {
      console.error("Amount mismatch:", {
        paymentId: payment._id,
        expected: payment.amount,
        received: verified.amount,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    if (verified.currency && verified.currency !== payment.currency) {
      console.error("Currency mismatch:", {
        paymentId: payment._id,
        expected: payment.currency,
        received: verified.currency,
      });
      return NextResponse.json(
        { error: "Currency mismatch" },
        { status: 400 }
      );
    }

    if (verified.status === "completed") {
      payment.status = "completed";
      payment.completedAt = new Date();
      payment.providerTransactionId = paymobTransactionId || undefined;
      payment.metadata = {
        ...payment.metadata,
        ...verified.metadata,
        webhookReceivedAt: new Date().toISOString(),
      };
      await payment.save();

      await creditWallet(String(payment.userId), payment.amount, {
        type: "deposit",
        currency: payment.currency,
        status: "completed",
        paymentId: String(payment._id),
        note: "شحن المحفظة عبر بطاقة ائتمان",
      });

      await Notification.create({
        recipientId: payment.userId,
        title: "تم شحن محفظتك",
        message: `تم إضافة ${payment.amount.toLocaleString()} ${payment.currency} إلى محفظتك بنجاح`,
        type: "success",
        link: "/wallet",
      });

      return NextResponse.json({ success: true });
    }

    if (verified.status === "failed") {
      payment.status = "failed";
      payment.failedAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        ...verified.metadata,
        failureReason: "payment_declined",
      };
      await payment.save();

      await Notification.create({
        recipientId: payment.userId,
        title: "فشل الدفع",
        message: `فشلت عملية شحن المحفظة بمبلغ ${payment.amount.toLocaleString()} ${payment.currency}. يرجى المحاولة مرة أخرى.`,
        type: "alert",
        link: "/wallet",
      });

      return NextResponse.json({ success: true, status: "failed" });
    }

    if (verified.status === "cancelled") {
      payment.status = "cancelled";
      payment.metadata = {
        ...payment.metadata,
        ...verified.metadata,
      };
      await payment.save();
    }

    return NextResponse.json({ success: true, status: verified.status });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
