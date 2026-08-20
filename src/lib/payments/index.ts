import type {
  PaymentMethod,
  PaymentProviderAdapter,
  PaymentIntentInput,
  PaymentIntentResult,
  WebhookPayload,
  WebhookResult,
} from "./types";
import { cardProvider } from "./card/provider";
import { bankProvider } from "./bank/provider";
import { transferProvider } from "./transfer/provider";

const adapters: Record<PaymentMethod, PaymentProviderAdapter> = {
  card: cardProvider,
  bank: bankProvider,
  transfer: transferProvider,
};

export function getPaymentProvider(method: PaymentMethod): PaymentProviderAdapter {
  return adapters[method];
}

export async function createPayment(
  input: PaymentIntentInput
): Promise<PaymentIntentResult> {
  const provider = getPaymentProvider(input.method);
  return provider.createPaymentIntent(input);
}

export async function handleWebhook(
  method: PaymentMethod,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const provider = getPaymentProvider(method);
  return provider.verifyWebhook(payload);
}

export type {
  PaymentMethod,
  PaymentProviderAdapter,
  PaymentIntentInput,
  PaymentIntentResult,
  WebhookPayload,
  WebhookResult,
  PaymentStatus,
  Currency,
  BankTransferData,
  RemittanceData,
  PaymentProvider,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "./types";
