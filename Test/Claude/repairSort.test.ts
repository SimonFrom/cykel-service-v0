// #26: sorting and per-bike summary for the customer page repair list.
import { repairStatusRank, sortRepairs, summarizeBikeRepairs } from '@/lib/repairSort';
import { Repair } from '@/types/repair';

const repair = (over: Partial<Repair>): Repair => ({
  id: 1,
  bikeId: 1,
  customerId: 1,
  discount: null,
  totalPrice: 0,
  items: [],
  createdAt: new Date('2026-01-01'),
  intakeDate: new Date('2026-01-01'),
  complete: false,
  paymentReceived: false,
  customerContacted: false,
  missingItems: false,
  ...over,
});

const a = repair({ id: 1, intakeDate: new Date('2026-01-01'), totalPrice: 300, complete: true });
const b = repair({ id: 2, intakeDate: new Date('2026-03-01'), totalPrice: 100 });
const c = repair({
  id: 3,
  bikeId: 2,
  intakeDate: new Date('2026-02-01'),
  totalPrice: 200,
  complete: true,
  paymentReceived: true,
});
const ids = (list: Repair[]) => list.map((r) => r.id);

describe('sortRepairs', () => {
  it('sorts by intake date', () => {
    expect(ids(sortRepairs([a, b, c], 'newest'))).toEqual([2, 3, 1]);
    expect(ids(sortRepairs([a, b, c], 'oldest'))).toEqual([1, 3, 2]);
  });

  it('sorts by price', () => {
    expect(ids(sortRepairs([a, b, c], 'priceDesc'))).toEqual([1, 3, 2]);
    expect(ids(sortRepairs([a, b, c], 'priceAsc'))).toEqual([2, 3, 1]);
  });

  it('sorts open first, then unpaid, then done', () => {
    expect(ids(sortRepairs([c, a, b], 'status'))).toEqual([2, 1, 3]);
  });

  it('breaks ties by newest id and does not mutate the input', () => {
    const x = repair({ id: 5 });
    const y = repair({ id: 6 });
    const input = [x, y];
    expect(ids(sortRepairs(input, 'newest'))).toEqual([6, 5]);
    expect(ids(input)).toEqual([5, 6]);
  });
});

describe('repairStatusRank', () => {
  it('ranks by completion and payment', () => {
    expect([b, a, c].map(repairStatusRank)).toEqual([0, 1, 2]);
  });
});

describe('summarizeBikeRepairs', () => {
  it('counts total and open repairs and finds the last intake', () => {
    expect(summarizeBikeRepairs([a, b, c], 1)).toEqual({
      total: 2,
      open: 1,
      lastIntake: new Date('2026-03-01'),
    });
  });

  it('handles a bike without repairs', () => {
    expect(summarizeBikeRepairs([a], 9)).toEqual({ total: 0, open: 0, lastIntake: null });
  });
});
