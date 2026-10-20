import { calculateRepairTotals } from '@/lib/repairPricing';

describe('repairPricing smoke', () => {
  it('E1: subtotal 570.00, total 541.50', () => {
    const r = calculateRepairTotals(
      [
        { price: 150, quantity: 2, discount: { type: 'percent', value: 10 } },
        { price: 350, quantity: 1, discount: { type: 'amount', value: 50 } },
      ],
      { type: 'percent', value: 5 }
    );
    expect(r.lines.map((l) => l.net)).toEqual([270, 300]);
    expect(r.subtotal).toBe(570);
    expect(r.repairDiscount).toBe(28.5);
    expect(r.total).toBe(541.5);
  });
});
