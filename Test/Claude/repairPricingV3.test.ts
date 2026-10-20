// Contract v3 additions to lib/repairPricing.ts (fails until the backend merge).
import * as pricing from '@/lib/repairPricing';

// Typed loosely so the file compiles before the exports exist.
const { roundMoney, tryCalculateRepairTotals, calculateRepairTotals } = pricing as unknown as {
  roundMoney: (v: number) => number;
  tryCalculateRepairTotals: (
    items: unknown[],
    d: unknown
  ) => ReturnType<typeof pricing.calculateRepairTotals> | null;
  calculateRepairTotals: typeof pricing.calculateRepairTotals;
};

describe('contract v3: roundMoney', () => {
  it('rounds to 2 decimals, half up', () => {
    expect(roundMoney(99.994)).toBe(99.99);
    expect(roundMoney(0.125)).toBe(0.13);
    expect(roundMoney(0.375)).toBe(0.38);
    expect(roundMoney(10)).toBe(10);
    expect(roundMoney(0)).toBe(0);
  });
});

describe('contract v3: tryCalculateRepairTotals', () => {
  it('returns null for invalid input instead of throwing', () => {
    const bad = [
      [{ price: NaN, quantity: 1, discount: null }],
      [{ price: 10, quantity: 0, discount: null }],
      [{ price: 1e300, quantity: 1, discount: null }],
    ];
    for (const items of bad) expect(tryCalculateRepairTotals(items, null)).toBeNull();
    expect(
      tryCalculateRepairTotals([{ price: 10, quantity: 1, discount: null }], {
        type: 'percent',
        value: 101,
      })
    ).toBeNull();
  });

  it('equals calculateRepairTotals for valid input', () => {
    const items = [{ price: 150, quantity: 2, discount: { type: 'percent' as const, value: 10 } }];
    const d = { type: 'amount' as const, value: 5 };
    expect(tryCalculateRepairTotals(items, d)).toEqual(calculateRepairTotals(items, d));
    expect(tryCalculateRepairTotals([], null)?.total).toBe(0);
  });
});
