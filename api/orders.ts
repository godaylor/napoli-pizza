import { randomUUID } from 'node:crypto';

import type { DemoOrder } from '../src/features/order/model/order.types';
import { validateOrderCreateRequest } from './_lib/orderValidation.js';

// Never log database messages, URLs or order payloads: only bounded error codes.
const reportDatabaseFailure = (error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    && typeof error.code === 'string' && /^[A-Z0-9_]{2,60}$/.test(error.code)
    ? error.code : 'UNKNOWN';
  console.error('napoli_database_failure', code);
};

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'none'",
    },
  });

const configuration = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
};

const databaseRequest = async (
  path: string,
  init: RequestInit = {},
) => {
  const config = configuration();
  if (!config) return null;
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
};

const findOrder = async (field: 'id' | 'idempotency_key', value: string) => {
  if (process.env.NAPOLI_DATABASE_URL) {
    try {
      const { findPostgresOrder } = await import('./_lib/postgresOrders.js');
      return { order: await findPostgresOrder(field, value) };
    } catch (error) {
      reportDatabaseFailure(error);
      return { failed: true as const };
    }
  }
  const response = await databaseRequest(
    `napoli_orders?${field}=eq.${encodeURIComponent(value)}&select=order_payload&limit=1`,
    { headers: { accept: 'application/json' } },
  );
  if (!response) return { unavailable: true as const };
  if (!response.ok) return { failed: true as const };
  const rows = await response.json() as Array<{ order_payload: DemoOrder }>;
  return { order: rows[0]?.order_payload ?? null };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const idempotencyKey = url.searchParams.get('idempotencyKey');
  const orderId = url.searchParams.get('orderId');
  const field = idempotencyKey ? 'idempotency_key' : 'id';
  const value = idempotencyKey ?? orderId;
  if (!value || value.length > 220) return json({ error: 'invalid-query' }, 400);
  const result = await findOrder(field, value);
  if ('unavailable' in result) return json({ error: 'backend-not-configured' }, 503);
  if ('failed' in result) return json({ error: 'database-unavailable' }, 502);
  return result.order ? json({ order: result.order }) : json({ order: null }, 404);
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 64_000) {
    return json({ error: 'payload-too-large' }, 413);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid-json' }, 400);
  }
  if (!validateOrderCreateRequest(body)) {
    return json({ error: 'invalid-order' }, 422);
  }
  const existing = await findOrder('idempotency_key', body.idempotencyKey);
  if ('unavailable' in existing) return json({ error: 'backend-not-configured' }, 503);
  if ('failed' in existing) return json({ error: 'database-unavailable' }, 502);
  if (existing.order) return json({ order: existing.order });

  const timestamp = new Date().toISOString();
  const order: DemoOrder = {
    ...body.input,
    id: `nap_${randomUUID().replaceAll('-', '')}`,
    idempotencyKey: body.idempotencyKey,
    status: 'confirmed',
    createdAt: timestamp,
    updatedAt: timestamp,
    tracking: { clockOffsetMs: 0, elapsedFloorMs: 0, scenario: 'default' },
  };
  if (process.env.NAPOLI_DATABASE_URL) {
    try {
      const { insertPostgresOrder } = await import('./_lib/postgresOrders.js');
      const result = await insertPostgresOrder(order);
      return json({ order: result.order }, result.created ? 201 : 200);
    } catch (error) {
      reportDatabaseFailure(error);
      return json({ error: 'database-unavailable' }, 502);
    }
  }
  const response = await databaseRequest('napoli_orders?on_conflict=idempotency_key', {
    method: 'POST',
    headers: { prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({
      id: order.id,
      idempotency_key: order.idempotencyKey,
      status: order.status,
      fulfillment_mode: order.fulfillment.mode,
      total_minor: order.quote.totalMinor,
      order_payload: order,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    }),
  });
  if (!response?.ok) {
    const raced = await findOrder('idempotency_key', body.idempotencyKey);
    if ('order' in raced && raced.order) return json({ order: raced.order });
    return json({ error: 'database-unavailable' }, 502);
  }
  const inserted = await response.json() as Array<{ order_payload: DemoOrder }>;
  if (!inserted[0]?.order_payload) {
    const raced = await findOrder('idempotency_key', body.idempotencyKey);
    if ('order' in raced && raced.order) return json({ order: raced.order });
    return json({ error: 'database-unavailable' }, 502);
  }
  await databaseRequest('napoli_order_events', {
    method: 'POST',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ order_id: order.id, status: 'confirmed' }),
  });
  return json({ order: inserted[0].order_payload }, 201);
}
