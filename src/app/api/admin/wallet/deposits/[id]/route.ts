import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, logAdminAction } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";
import { Notification } from "@/models/Notification";
import { creditWallet } from "@/lib/wallet";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdminFromRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }

    const { action, note } = parsed.data;

    await connectDB();

    if (action === "approve") {
      const payment = await Payment.findOneAndUpdate(
        { _id: id, status: { $in: ["pending", "processing"] } },
        {
          status: "completed",
          completedAt: new Date(),
          reviewedBy: auth.userId,
          reviewedAt: new Date(),
          reviewNote: note,
        },
        { new: true }
      );

      if (!payment) {
        return NextResponse.json(
          { error: "Payment not found or already reviewed" },
          { status: 404 }
        );
      }

      const txType =
        payment.method === "bank" ? "bank_transfer" : "remittance";
      await creditWallet(String(payment.userId), payment.amount, {
        fromUserId: String(payment.userId),
        type: txType,
        currency: payment.currency,
        status: "completed",
        paymentId: String(payment._id),
        note: payment.note || `شحن المحفظة`,
      });

      await Notification.create({
        recipientId: payment.userId,
        title: "تم الموافقة على الإيداع",
        message: `تم الموافقة على إيداع ${payment.amount.toLocaleString()} ${payment.currency}. تم إضافة المبلغ إلى محفظتك.`,
        type: "success",
        link: "/wallet",
      });

      await logAdminAction({
        admin: auth,
        action: "payment_approve",
        resource: "payment",
        resourceId: String(payment._id),
        details: {
          userId: String(payment.userId),
          amount: payment.amount,
          method: payment.method,
          note,
        },
      });

      return NextResponse.json({
        success: true,
        payment: {
          id: String(payment._id),
          status: payment.status,
        },
      });
    }

    // reject
    const payment = await Payment.findOneAndUpdate(
      { _id: id, status: { $in: ["pending", "processing"] } },
      {
        status: "failed",
        failedAt: new Date(),
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found or already reviewed" },
        { status: 404 }
      );
    }

    await Notification.create({
      recipientId: payment.userId,
      title: "تم رفض الإيداع",
      message: `تم رفض طلب الإيداع بمبلغ ${payment.amount.toLocaleString()} ${payment.currency}. ${
        note || ""
      }`,
      type: "alert",
      link: "/wallet",
    });

    await logAdminAction({
      admin: auth,
      action: "payment_reject",
      resource: "payment",
      resourceId: String(payment._id),
      details: {
        userId: String(payment.userId),
        amount: payment.amount,
        method: payment.method,
        note,
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: String(payment._id),
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Admin deposit review error:", error);
    return NextResponse.json(
      { error: "Failed to review deposit" },
      { status: 500 }
    );
  }
}
