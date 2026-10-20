// Write-path tests for crud/repairs.ts against spec section 5.3. Supabase is mocked.
import { createRepair, updateRepair } from '@/crud/repairs';
import type { Repair } from '@/types/repair';

type Call = { table: string; op: string; payload?: unknown; filters: [string, unknown][] };
type Result = { data?: unknown; error?: unknown };

const mockCalls: Call[] = [];
let mockRespond: (c: Call) => Result = () => ({ data: null, error: null });

jest.mock('@/utils/supabase', () => {
  const makeBuilder = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] };
    let recorded = false;
    const record = () => {
      if (!recorded) {
        recorded = true;
        mockCalls.push(call);
      }
    };
    const b: Record<string, unknown> = {};
    const setOp = (op: string) => (payload?: unknown) => {
      if (call.op === 'select' || op !== 'select') {
        call.op = op === 'select' && call.op !== 'select' ? call.op : op;
      }
      if (payload !== undefined && op !== 'select') call.payload = payload;
      record();
      return b;
    };
    b.insert = setOp('insert');
    b.update = setOp('update');
    b.delete = setOp('delete');
    b.select = () => {
      record();
      return b;
    };
    b.eq = (col: string, val: unknown) => {
      call.filters.push([col, val]);
      return b;
    };
    b.single = () => b;
    b.then = (res: (v: Result) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(mockRespond(call)).then(res, rej);
    return b;
  };
  return { supabase: { from: (t: string) => makeBuilder(t) } };
});

const baseRepair = (over: Partial<Repair> = {}): Repair => ({
  id: 5,
  bikeId: 1,
  customerId: 2,
  discount: { type: 'percent', value: 5 },
  totalPrice: 999,
  note: 'n',
  items: [
    { id: 1, title: 'A', price: 150, quantity: 2, discount: { type: 'percent', value: 10 }, total: 1 },
    { id: 2, title: 'B', price: 350, quantity: 1, discount: { type: 'amount', value: 50 }, total: 2 },
  ],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  intakeDate: new Date('2026-01-02T00:00:00Z'),
  complete: false,
  paymentReceived: false,
  customerContacted: false,
  ...over,
});

const ok = (c: Call): Result =>
  c.table === 'repairs' && c.op === 'insert' ? { data: { id: 7 }, error: null } : { error: null };

const byOp = (table: string, op: string) => mockCalls.filter((c) => c.table === table && c.op === op);

beforeEach(() => {
  mockCalls.length = 0;
  mockRespond = ok;
});

describe('createRepair', () => {
  it('AC-13/AC-8: persists calculator totals, ignoring caller totalPrice and item totals', async () => {
    const { id: _id, ...input } = baseRepair();
    const id = await createRepair(input);
    expect(id).toBe(7);
    const repairRow = byOp('repairs', 'insert')[0].payload as Record<string, unknown>;
    expect(repairRow.total_price).toBe(541.5);
    expect(repairRow.discount_type).toBe('percent');
    expect(repairRow.discount_value).toBe(5);
    const items = byOp('repair_items', 'insert')[0].payload as Record<string, unknown>[];
    expect(items.map((i) => i.total)).toEqual([270, 300]);
    expect(items.map((i) => i.discount_type)).toEqual(['percent', 'amount']);
    expect(items.map((i) => i.discount_value)).toEqual([10, 50]);
  });

  it('SR-2: repair_items insert sends exactly the whitelisted columns', async () => {
    const { id: _id, ...input } = baseRepair();
    const polluted = { ...input, foo: 1 } as Omit<Repair, 'id'>;
    polluted.items = polluted.items.map((i) => ({ ...i, evil: 1 }) as typeof i);
    await createRepair(polluted);
    const items = byOp('repair_items', 'insert')[0].payload as Record<string, unknown>[];
    for (const row of items) {
      expect(Object.keys(row).sort()).toEqual(
        ['discount_type', 'discount_value', 'price', 'quantity', 'repair_id', 'title', 'total'].sort()
      );
      expect(row.repair_id).toBe(7);
    }
    const repairRow = byOp('repairs', 'insert')[0].payload as Record<string, unknown>;
    expect(repairRow).not.toHaveProperty('id');
    expect(repairRow).not.toHaveProperty('foo');
    expect(repairRow).not.toHaveProperty('items');
  });

  it('AC-12: zero or null discount is stored as type null, value 0', async () => {
    const { id: _id, ...input } = baseRepair({
      discount: { type: 'amount', value: 0 },
      items: [{ id: 1, title: 'A', price: 10, quantity: 1, discount: { type: 'percent', value: 0 }, total: 0 }],
    });
    await createRepair(input);
    const repairRow = byOp('repairs', 'insert')[0].payload as Record<string, unknown>;
    expect(repairRow.discount_type).toBeNull();
    expect(repairRow.discount_value).toBe(0);
    const items = byOp('repair_items', 'insert')[0].payload as Record<string, unknown>[];
    expect(items[0].discount_type).toBeNull();
    expect(items[0].discount_value).toBe(0);
    expect(items[0].total).toBe(10);
  });

  it('SR-3: invalid numbers throw before any request is sent', async () => {
    const { id: _id, ...input } = baseRepair();
    for (const bad of [
      { price: NaN },
      { price: 1e300 },
      { quantity: Infinity },
      { quantity: 0 },
    ]) {
      const repair = { ...input, items: [{ ...input.items[0], ...bad }] };
      await expect(createRepair(repair)).rejects.toBeDefined();
    }
    expect(mockCalls).toHaveLength(0);
  });

  it('AC-14: a repair insert error is thrown', async () => {
    const err = { message: 'boom', code: '23514' };
    mockRespond = (c) => (c.table === 'repairs' && c.op === 'insert' ? { data: null, error: err } : { error: null });
    const { id: _id, ...input } = baseRepair();
    await expect(createRepair(input)).rejects.toBe(err);
  });

  it('AC-14/AC-17: item insert error deletes the new repair, then rethrows the original error', async () => {
    const err = { message: 'items failed' };
    mockRespond = (c) => {
      if (c.table === 'repair_items' && c.op === 'insert') return { error: err };
      return ok(c);
    };
    const { id: _id, ...input } = baseRepair();
    await expect(createRepair(input)).rejects.toBe(err);
    const del = byOp('repairs', 'delete');
    expect(del).toHaveLength(1);
    expect(del[0].filters).toEqual([['id', 7]]);
  });

  it('AC-17: original error is thrown even if the compensating delete also fails', async () => {
    const err = { message: 'items failed' };
    mockRespond = (c) => {
      if (c.table === 'repair_items' && c.op === 'insert') return { error: err };
      if (c.table === 'repairs' && c.op === 'delete') return { error: { message: 'delete failed' } };
      return ok(c);
    };
    const { id: _id, ...input } = baseRepair();
    await expect(createRepair(input)).rejects.toBe(err);
  });

  it('no lines: only the repair is inserted, total is 0 with percent discount (E6)', async () => {
    const { id: _id, ...input } = baseRepair({ items: [], discount: { type: 'percent', value: 10 } });
    await createRepair(input);
    expect((byOp('repairs', 'insert')[0].payload as Record<string, unknown>).total_price).toBe(0);
    expect(byOp('repair_items', 'insert')).toHaveLength(0);
  });
});

describe('updateRepair', () => {
  it('AC-13/AC-9: persists calculator totals, ignoring caller values', async () => {
    await updateRepair(5, baseRepair());
    const row = byOp('repairs', 'update')[0].payload as Record<string, unknown>;
    expect(row.total_price).toBe(541.5);
    expect(row.discount_type).toBe('percent');
    expect(row.discount_value).toBe(5);
    const items = byOp('repair_items', 'insert')[0].payload as Record<string, unknown>[];
    expect(items.map((i) => i.total)).toEqual([270, 300]);
    expect(byOp('repairs', 'update')[0].filters).toEqual([['id', 5]]);
  });

  it('AC-9: a new line with total 0 from the form is stored with its real total', async () => {
    const r = baseRepair({
      discount: null,
      items: [{ id: 0, title: 'New', price: 40, quantity: 3, discount: null, total: 0 }],
    });
    await updateRepair(5, r);
    const items = byOp('repair_items', 'insert')[0].payload as Record<string, unknown>[];
    expect(items[0].total).toBe(120);
    expect((byOp('repairs', 'update')[0].payload as Record<string, unknown>).total_price).toBe(120);
  });

  it('SR-2: repairs update never sends id or created_at; items use the whitelist', async () => {
    await updateRepair(5, { ...baseRepair(), foo: 1 } as Repair);
    const row = byOp('repairs', 'update')[0].payload as Record<string, unknown>;
    expect(row).not.toHaveProperty('id');
    expect(row).not.toHaveProperty('created_at');
    expect(row).not.toHaveProperty('foo');
    const items = byOp('repair_items', 'insert')[0].payload as Record<string, unknown>[];
    expect(Object.keys(items[0]).sort()).toEqual(
      ['discount_type', 'discount_value', 'price', 'quantity', 'repair_id', 'title', 'total'].sort()
    );
  });

  it('AC-12: zero discounts stored as null / 0', async () => {
    await updateRepair(
      5,
      baseRepair({
        discount: { type: 'percent', value: 0 },
        items: [{ id: 1, title: 'A', price: 10, quantity: 1, discount: { type: 'amount', value: 0 }, total: 0 }],
      })
    );
    const row = byOp('repairs', 'update')[0].payload as Record<string, unknown>;
    expect([row.discount_type, row.discount_value]).toEqual([null, 0]);
    const items = byOp('repair_items', 'insert')[0].payload as Record<string, unknown>[];
    expect([items[0].discount_type, items[0].discount_value]).toEqual([null, 0]);
  });

  it('SR-3: invalid numbers throw before any request is sent', async () => {
    const r = baseRepair();
    await expect(updateRepair(5, { ...r, items: [{ ...r.items[0], price: NaN }] })).rejects.toBeDefined();
    await expect(updateRepair(5, { ...r, items: [{ ...r.items[0], quantity: -1 }] })).rejects.toBeDefined();
    expect(mockCalls).toHaveLength(0);
  });

  it('AC-14: repair update error is thrown, not returned', async () => {
    const err = { message: 'check violation', code: '23514' };
    mockRespond = (c) => (c.op === 'update' ? { error: err } : { error: null });
    await expect(updateRepair(5, baseRepair())).rejects.toBe(err);
  });

  it('AC-14: item delete error is thrown', async () => {
    const err = { message: 'delete failed' };
    mockRespond = (c) => (c.op === 'delete' ? { error: err } : { error: null });
    await expect(updateRepair(5, baseRepair())).rejects.toBe(err);
  });

  it('AC-14/AC-16: item insert error is thrown', async () => {
    const err = { message: 'insert failed' };
    mockRespond = (c) => (c.table === 'repair_items' && c.op === 'insert' ? { error: err } : { error: null });
    await expect(updateRepair(5, baseRepair())).rejects.toBe(err);
  });

  it('AC-14: does not console.error the Supabase error (it is thrown instead)', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRespond = (c) => (c.op === 'update' ? { error: { message: 'x' } } : { error: null });
    await expect(updateRepair(5, baseRepair())).rejects.toBeDefined();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
