// SR-6 / AC-10: read mappers in crud/repairs.ts with a mocked Supabase client.
import { getAllRepairs, getRepair } from '@/crud/repairs';

let mockRows: unknown[] = [];

jest.mock('@/utils/supabase', () => {
  const b: Record<string, unknown> = {};
  b.select = () => b;
  b.eq = () => b;
  b.returns = () => b;
  b.single = () => Promise.resolve({ data: mockRows[0], error: null });
  b.then = (res: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockRows, error: null }).then(res);
  return { supabase: { from: () => b } };
});

const row = (over: Record<string, unknown> = {}, items: Record<string, unknown>[] = []) => ({
  id: 1,
  bike_id: 2,
  customer_id: 3,
  total_price: '123.45',
  discount_type: 'percent',
  discount_value: '10',
  note: null,
  created_at: '2026-01-01T00:00:00Z',
  intake_date: '2026-01-02T00:00:00Z',
  delivery_date: null,
  complete: false,
  payment_recieved: false,
  customerContacted: false,
  repair_items: items,
  ...over,
});

const item = (over: Record<string, unknown> = {}) => ({
  id: 1,
  repair_id: 1,
  title: 'A',
  price: 100,
  quantity: 2,
  total: 200,
  discount_type: null,
  discount_value: 0,
  ...over,
});

describe('read mappers', () => {
  it('SR-6: unknown repair and line discount_type maps to null discount', async () => {
    mockRows = [
      row({ discount_type: 'bogus' }, [item({ discount_type: 'bogus', discount_value: 5 })]),
    ];
    const [r] = await getAllRepairs();
    expect(r.discount).toBeNull();
    expect(r.items[0].discount).toBeNull();
    const one = await getRepair(1);
    expect(one!.discount).toBeNull();
    expect(one!.items[0].discount).toBeNull();
  });

  it('SR-6: non-finite or null numbers map to 0, never NaN', async () => {
    mockRows = [
      row({ total_price: 'abc', discount_value: 'Infinity' }, [
        item({
          price: 'NaN',
          quantity: null,
          total: 'Infinity',
          discount_type: 'amount',
          discount_value: 'x',
        }),
      ]),
    ];
    const [r] = await getAllRepairs();
    expect(r.totalPrice).toBe(0);
    expect(r.discount).toEqual({ type: 'percent', value: 0 });
    expect(r.items[0]).toMatchObject({ price: 0, quantity: 0, total: 0 });
    expect(r.items[0].discount).toEqual({ type: 'amount', value: 0 });
  });

  it('AC-10: valid discounts and numeric strings are mapped', async () => {
    mockRows = [
      row({}, [item({ discount_type: 'amount', discount_value: '25.5', price: '10.5' })]),
    ];
    const [r] = await getAllRepairs();
    expect(r.discount).toEqual({ type: 'percent', value: 10 });
    expect(r.items[0].discount).toEqual({ type: 'amount', value: 25.5 });
    expect(r.items[0].price).toBe(10.5);
  });

  it('AC-10: totalPrice comes from total_price, not from the sum of items', async () => {
    mockRows = [row({ total_price: 7 }, [item({ total: 200 }), item({ id: 2, total: 300 })])];
    const [r] = await getAllRepairs();
    expect(r.totalPrice).toBe(7);
    const one = await getRepair(1);
    expect(one!.totalPrice).toBe(7);
  });
});
