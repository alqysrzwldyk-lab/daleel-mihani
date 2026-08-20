import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProviderAdapter,
  WebhookPayload,
  WebhookResult,
  PaymentStatus,
} from "../types";

export const bankProvider: PaymentProviderAdapter = {
  async createPaymentIntent(
    input: PaymentIntentInput
  ): Promise<PaymentIntentResult> {
    return {
      paymentId: "",
      status: "pending",
    };
  },

  async verifyWebhook(): Promise<WebhookResult> {
    throw new Error("Bank transfers do not support webhooks");
  },

  async getPaymentStatus(): Promise<{ status: PaymentStatus; amount?: number }> {
    return { status: "pending" };
  },
};
