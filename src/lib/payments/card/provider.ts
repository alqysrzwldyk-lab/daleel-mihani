import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProviderAdapter,
  WebhookPayload,
  WebhookResult,
  PaymentStatus,
  Currency,
} from "../types";

const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY || "";
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY || "";
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET || "";
const PAYMOB_INTEGRATION_ID = Number(process.env.PAYMOB_INTEGRATION_ID_CARD) || 0;
const PAYMOB_BASE_URL =
  process.env.PAYMOB_BASE_URL || "https://accept.paymob.com";
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";

const CURRENCY_MAP: Record<string, string> = {
  YER: "YER",
  SAR: "SAR",
  USD: "USD",
  EGP: "EGP",
  AED: "AED",
  OMR: "OMR",
};

export const cardProvider: PaymentProviderAdapter = {
  async createPaymentIntent(
    input: PaymentIntentInput
  ): Promise<PaymentIntentResult> {
    if (!PAYMOB_SECRET_KEY) {
      throw new Error("PAYMOB_SECRET_KEY not configured");
    }
    if (!PAYMOB_INTEGRATION_ID) {
      throw new Error("PAYMOB_INTEGRATION_ID_CARD not configured");
    }

    const amountCents = Math.round(input.amount * 100);
    const currency = CURRENCY_MAP[input.currency] || input.currency;
    const meta = input.metadata || {};
    const email = (meta.email as string) || "customer@example.com";
    const phone = (meta.phone as string) || "+966500000000";
    const firstName = (meta.firstName as string) || (meta.cardHolder as string) || "Customer";
    const lastName = (meta.lastName as string) || "User";
    const specialReference = input.metadata?.specialReference as string;

    const payload = {
      amount: amountCents,
      currency,
      payment_methods: [PAYMOB_INTEGRATION_ID],
      items: [],
      special_reference: specialReference,
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        state: "NA",
        country: "EGY",
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email,
      },
      notification_url: `${APP_URL}/api/payments/webhook/card`,
      redirection_url: `${APP_URL}/wallet`,
    };

    const res = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${PAYMOB_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Paymob intention API error:", res.status, err);
      throw new Error(`Paymob API error: ${res.status}`);
    }

    const data = await res.json();
    const clientSecret = data.client_secret as string;
    const paymobOrderId = String(data.id || "");
    const checkoutUrl = `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`;

    return {
      paymentId: "",
      status: "processing",
      checkoutUrl,
      providerReference: paymobOrderId || specialReference || "",
      clientSecret,
      metadata: { paymobOrderId },
    };
  },

  async verifyWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    if (!PAYMOB_HMAC_SECRET) {
      throw new Error("PAYMOB_HMAC_SECRET not configured — webhook rejected");
    }
    if (!payload.rawBody || !payload.signature) {
      throw new Error("Missing webhook body or HMAC signature");
    }

    let obj: Record<string, unknown>;
    try {
      const parsed = JSON.parse(payload.rawBody);
      obj = parsed.obj || parsed;
    } catch {
      throw new Error("Invalid webhook JSON");
    }

    const fields = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      (obj.order as Record<string, unknown>)?.id,
      obj.owner,
      obj.pending,
      (obj.source_data as Record<string, unknown>)?.pan,
      (obj.source_data as Record<string, unknown>)?.sub_type,
      (obj.source_data as Record<string, unknown>)?.type,
      obj.success,
    ];

    const computed = createHmac("sha512", PAYMOB_HMAC_SECRET)
      .update(fields.map(String).join(""))
      .digest("hex");

    if (computed.length !== payload.signature.length) {
      throw new Error("HMAC length mismatch");
    }
    if (
      !timingSafeEqual(
        Buffer.from(computed, "utf8"),
        Buffer.from(payload.signature, "utf8")
      )
    ) {
      throw new Error("HMAC verification failed");
    }

    let status: PaymentStatus;
    if (obj.success === true && obj.pending === false) {
      status = "completed";
    } else if (obj.success === false) {
      status = "failed";
    } else if (obj.is_voided === true) {
      status = "cancelled";
    } else {
      status = "processing";
    }

    const amountCents = (obj.amount_cents as number) || 0;
    const currencyRaw = (obj.currency as string) || "YER";
    const sourceData = (obj.source_data || {}) as Record<string, string>;

    return {
      paymentId: "",
      status,
      userId: "",
      amount: amountCents / 100,
      currency: currencyRaw as Currency,
      metadata: {
        paymobTransactionId: obj.id,
        orderId: (obj.order as Record<string, unknown>)?.id,
        paymobStatus: obj.success,
        cardBrand: sourceData.type,
        cardSubType: sourceData.sub_type,
        cardPan: sourceData.pan,
      },
    };
  },

  async getPaymentStatus(
    _providerReference: string
  ): Promise<{ status: PaymentStatus; amount?: number }> {
    return { status: "processing" };
  },
};
