import pg from 'pg';
import type { DemoOrder } from '../../src/features/order/model/order.types';

let pool: pg.Pool | undefined;
const database = () => {
  pool ??= new pg.Pool({
    connectionString: process.env.NAPOLI_DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 8_000,
    query_timeout: 8_000,
    allowExitOnIdle: true,
  });
  return pool;
};

export async function findPostgresOrder(field: 'id' | 'idempotency_key', value: string) {
  const column = field === 'id' ? 'id' : 'idempotency_key';
  const result = await database().query<{ order_payload: DemoOrder }>(
    `select order_payload from napoli.orders where ${column} = $1`, [value],
  );
  return result.rows[0]?.order_payload ?? null;
}

export async function insertPostgresOrder(order: DemoOrder) {
  const client = await database().connect();
  try {
    await client.query('begin');
    const inserted = await client.query<{ order_payload: DemoOrder }>(
      `insert into napoli.orders (id, idempotency_key, order_payload)
       values ($1, $2, $3) on conflict (idempotency_key) do nothing returning order_payload`,
      [order.id, order.idempotencyKey, order],
    );
    if (inserted.rows.length) {
      await client.query('insert into napoli.order_events (order_id, status) values ($1, $2)', [order.id, 'confirmed']);
    }
    const existing = inserted.rows.length ? inserted : await client.query<{ order_payload: DemoOrder }>(
      'select order_payload from napoli.orders where idempotency_key = $1', [order.idempotencyKey],
    );
    await client.query('commit');
    return { order: existing.rows[0].order_payload, created: inserted.rows.length > 0 };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
