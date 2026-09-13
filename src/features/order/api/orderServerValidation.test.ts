import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateOrderCreateRequest } from '../../../../api/_lib/orderValidation';
import { POST } from '../../../../api/orders';
import { createBaseConfiguration } from '../../cart/model/cartSlice';

const now = Date.parse('2026-09-11T12:00:00.000Z');
const validRequest = () => ({
  idempotencyKey: 'idem_quote_payment_12345678',
  input: {
    quote: {
      id: 'quote-payment',
      requestKey: 'quote-request',
      lines: [{
        configuration: createBaseConfiguration('201', '201-base'),
        quantity: 1,
        name: 'Вечер на двоих',
        unitPriceMinor: 199000,
        totalMinor: 199000,
      }],
      subtotalMinor: 199000,
      discountMinor: 0,
      feeMinor: 19900,
      totalMinor: 218900,
      promo: null,
      fulfillmentMode: 'delivery',
      fulfillmentLabel: 'Тверская, 22',
      etaLabel: '35–45 мин',
      issues: [],
      expiresAt: new Date(now + 60_000).toISOString(),
    },
    contact: { name: 'Гость', phone: '+7 900 000-22-22', email: '' },
    note: '',
    fulfillment: {
      mode: 'delivery',
      label: 'Тверская, 22',
      address: { city: 'Москва', street: 'Тверская', house: '22', apartment: '', entrance: '', floor: '' },
      time: { kind: 'asap' },
    },
  },
});

describe('server order boundary validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it('accepts a coherent unexpired order snapshot', () => {
    expect(validateOrderCreateRequest(validRequest(), now)).toBe(true);
  });

  it('rejects client-tampered totals and expired quotes', () => {
    const tampered = validRequest();
    tampered.input.quote.totalMinor = 1;
    expect(validateOrderCreateRequest(tampered, now)).toBe(false);

    const expired = validRequest();
    expired.input.quote.expiresAt = new Date(now - 1).toISOString();
    expect(validateOrderCreateRequest(expired, now)).toBe(false);
  });

  it('rejects fulfillment mismatches and oversized notes', () => {
    const mismatch = validRequest();
    mismatch.input.quote.fulfillmentMode = 'pickup';
    expect(validateOrderCreateRequest(mismatch, now)).toBe(false);

    const oversized = validRequest();
    oversized.input.note = 'x'.repeat(501);
    expect(validateOrderCreateRequest(oversized, now)).toBe(false);
  });

  it('persists through server-only Supabase credentials without an Authorization header', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://database.example');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
    const request = validRequest();
    request.input.quote.expiresAt = new Date(Date.now() + 60_000).toISOString();
    const databaseFetch = vi.fn()
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ order_payload: {
        ...request.input,
        id: 'nap_0123456789abcdef0123456789abcdef',
        idempotencyKey: request.idempotencyKey,
        status: 'confirmed',
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
        tracking: { clockOffsetMs: 0, elapsedFloorMs: 0, scenario: 'default' },
      } }], { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', databaseFetch);

    const response = await POST(new Request('https://napoli.example/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    }));

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.order).toMatchObject({ status: 'confirmed' });
    expect(databaseFetch).toHaveBeenCalledTimes(3);
    const headers = new Headers(databaseFetch.mock.calls[1][1].headers);
    expect(headers.get('apikey')).toBe('sb_secret_test');
    expect(headers.has('authorization')).toBe(false);
  });
});
