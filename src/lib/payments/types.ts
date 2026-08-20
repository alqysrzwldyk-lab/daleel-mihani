export type PaymentMethod = "card" | "bank" | "transfer";
export type PaymentProvider = "gateway" | "manual";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

export type Currency = "YER" | "SAR" | "USD" | "EGP" | "AED" | "OMR";

export interface PaymentIntentInput {
  userId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  paymentId: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  clientSecret?: string;
  providerReference?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookPayload {
  providerReference: string;
  status: PaymentStatus;
  amount?: number;
  currency?: Currency;
  rawBody?: string;
  signature?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookResult {
  paymentId: string;
  status: PaymentStatus;
  userId: string;
  amount: number;
  currency: Currency;
  metadata?: Record<string, unknown>;
}

export interface PaymentProviderAdapter {
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  verifyWebhook(payload: WebhookPayload): Promise<WebhookResult>;
  getPaymentStatus(
    providerReference: string
  ): Promise<{ status: PaymentStatus; amount?: number }>;
}

export interface BankTransferData {
  bankName: string;
  accountName: string;
  accountNumber: string;
  receiptUrl?: string;
  referenceNumber?: string;
}

export interface RemittanceData {
  senderName: string;
  referenceNumber: string;
  provider: string;
  receiptUrl?: string;
  recipientName?: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "بانتظار المعالجة",
  processing: "جاري المعالجة",
  completed: "مكتمل",
  failed: "فشل",
  cancelled: "ملغي",
  refunded: "مسترد",
  expired: "منتهي",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "بطاقة ائتمان",
  bank: "تحويل بنكي",
  transfer: "حوالة مالية",
};
