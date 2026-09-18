import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DemoOrder } from '../model/order.types';

const mocks = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), lookup: vi.fn() }));
vi.mock('pg', () => ({ default: { Pool: class {
  query = mocks.lookup;
  connect = async () => ({ query: mocks.query, release: mocks.release });
} } }));
import { findPostgresOrder, insertPostgresOrder } from '../../../../api/_lib/postgresOrders';

const order = { id: 'nap_test', idempotencyKey: 'idem_test' } as DemoOrder;
describe('isolated PostgreSQL order repository', () => {
  beforeEach(() => vi.resetAllMocks());
  it('parameterizes the capability lookup in the Napoli schema', async () => {
    mocks.lookup.mockResolvedValue({ rows: [{ order_payload: order }] });
    expect(await findPostgresOrder('id', "' or true --")).toEqual(order);
    expect(mocks.lookup).toHaveBeenCalledWith(
      'select order_payload from napoli.orders where id = $1', ["' or true --"],
    );
  });
  it('commits the snapshot and event together', async () => {
    mocks.query.mockResolvedValue({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ order_payload: order }] });
    expect(await insertPostgresOrder(order)).toEqual({ order, created: true });
    expect(mocks.query.mock.calls.map(([sql]) => sql)).toEqual([
      'begin', expect.stringContaining('on conflict (idempotency_key) do nothing'),
      expect.stringContaining('insert into napoli.order_events'), 'commit',
    ]);
    expect(mocks.release).toHaveBeenCalledOnce();
  });
  it('returns the existing snapshot without a duplicate event after a race', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ order_payload: order }] }).mockResolvedValueOnce({ rows: [] });
    expect(await insertPostgresOrder(order)).toEqual({ order, created: false });
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes('insert into napoli.order_events'))).toBe(false);
    expect(mocks.release).toHaveBeenCalledOnce();
  });
  it('rolls back if event persistence fails and releases the connection', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ order_payload: order }] })
      .mockRejectedValueOnce(new Error('event rejected')).mockResolvedValueOnce({ rows: [] });
    await expect(insertPostgresOrder(order)).rejects.toThrow('event rejected');
    expect(mocks.query).toHaveBeenLastCalledWith('rollback');
    expect(mocks.release).toHaveBeenCalledOnce();
  });
});
