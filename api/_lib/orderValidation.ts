import type { DemoOrderInput } from '../../src/features/order/model/order.types';

export interface OrderCreateRequest {
  input: DemoOrderInput;
  idempotencyKey: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBoundedString = (value: unknown, maximum: number) =>
  typeof value === 'string' && value.length <= maximum;

const isMinor = (value: unknown) =>
  Number.isSafeInteger(value) && Number(value) >= 0;

export const validateOrderCreateRequest = (
  value: unknown,
  now = Date.now(),
): value is OrderCreateRequest => {
  if (!isRecord(value) || !isRecord(value.input)) return false;
  const { input, idempotencyKey } = value;
  if (
    typeof idempotencyKey !== 'string' ||
    !/^idem_[a-zA-Z0-9_-]{8,180}$/.test(idempotencyKey) ||
    !isRecord(input.quote) ||
    !isRecord(input.contact) ||
    !isRecord(input.fulfillment)
  ) return false;

  const { quote, contact, fulfillment } = input;
  if (
    !isBoundedString(contact.name, 80) ||
    !isBoundedString(contact.phone, 32) ||
    !isBoundedString(contact.email, 160) ||
    !isBoundedString(input.note, 500) ||
    !Array.isArray(quote.lines) ||
    quote.lines.length < 1 ||
    quote.lines.length > 50 ||
    !Array.isArray(quote.issues) ||
    quote.issues.length !== 0 ||
    typeof quote.expiresAt !== 'string' ||
    Date.parse(quote.expiresAt) <= now ||
    (fulfillment.mode !== 'delivery' && fulfillment.mode !== 'pickup') ||
    quote.fulfillmentMode !== fulfillment.mode
  ) return false;

  let subtotal = 0;
  for (const line of quote.lines) {
    if (
      !isRecord(line) ||
      !isRecord(line.configuration) ||
      !Number.isSafeInteger(line.quantity) ||
      Number(line.quantity) < 1 ||
      Number(line.quantity) > 50 ||
      !isMinor(line.unitPriceMinor) ||
      !isMinor(line.totalMinor) ||
      Number(line.totalMinor) !== Number(line.unitPriceMinor) * Number(line.quantity)
    ) return false;
    subtotal += Number(line.totalMinor);
  }

  return (
    isMinor(quote.subtotalMinor) &&
    Number(quote.subtotalMinor) === subtotal &&
    isMinor(quote.discountMinor) &&
    Number(quote.discountMinor) <= subtotal &&
    isMinor(quote.feeMinor) &&
    isMinor(quote.totalMinor) &&
    Number(quote.totalMinor) ===
      subtotal - Number(quote.discountMinor) + Number(quote.feeMinor)
  );
};
