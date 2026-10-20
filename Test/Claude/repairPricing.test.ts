import {
  calculateLineTotals,
  calculateRepairTotals,
  validateDiscount,
} from '@/lib/repairPricing';
import type { Discount } from '@/types/discount';

const pct = (value: number): Discount => ({ type: 'percent', value });
const amt = (value: number): Discount => ({ type: 'amount', value });

describe('AC-7: worked examples E1-E6 (spec section 3)', () => {
  it('AC-7 E1: subtotal 570.00, repair discount 28.50, total 541.50', () => {
    const r = calculateRepairTotals(
      [
        { price: 150, quantity: 2, discount: pct(10) },
        { price: 350, quantity: 1, discount: amt(50) },
      ],
      pct(5)
    );
    expect(r.lines.map((l) => l.net)).toEqual([270, 300]);
    expect(r.subtotal).toBe(570);
    expect(r.repairDiscount).toBe(28.5);
    expect(r.total).toBe(541.5);
  });

  it('AC-7 E2: 99.99 x 3, 15 % -> line 254.97, subtotal and total 254.97', () => {
    const r = calculateRepairTotals([{ price: 99.99, quantity: 3, discount: pct(15) }], null);
    expect(r.lines[0]).toEqual({ gross: 299.97, discount: 45, net: 254.97 });
    expect(r.subtotal).toBe(254.97);
    expect(r.repairDiscount).toBe(0);
    expect(r.total).toBe(254.97);
  });

  it('AC-7 E3: 200 kr flat on a 200 repair -> total 0.00', () => {
    const r = calculateRepairTotals([{ price: 200, quantity: 1, discount: null }], amt(200));
    expect(r.subtotal).toBe(200);
    expect(r.repairDiscount).toBe(200);
    expect(r.total).toBe(0);
  });

  it('AC-7 E4: 100 % line + 12.5 % repair -> subtotal 330.00, total 288.75', () => {
    const r = calculateRepairTotals(
      [
        { price: 120, quantity: 1, discount: pct(100) },
        { price: 330, quantity: 1, discount: null },
      ],
      pct(12.5)
    );
    expect(r.lines.map((l) => l.net)).toEqual([0, 330]);
    expect(r.subtotal).toBe(330);
    expect(r.repairDiscount).toBe(41.25);
    expect(r.total).toBe(288.75);
  });

  it('AC-7 E5: 33.33 % of 133.33 rounds to 44.44 -> total 88.89', () => {
    const r = calculateRepairTotals(
      [
        { price: 100, quantity: 1, discount: null },
        { price: 33.33, quantity: 1, discount: null },
      ],
      pct(33.33)
    );
    expect(r.subtotal).toBe(133.33);
    expect(r.repairDiscount).toBe(44.44);
    expect(r.total).toBe(88.89);
  });

  it('AC-7 E6: no lines with 10 % -> subtotal 0.00, total 0.00', () => {
    const r = calculateRepairTotals([], pct(10));
    expect(r).toEqual({ lines: [], subtotal: 0, repairDiscount: 0, total: 0 });
  });
});

describe('AC-1..AC-4 numbers', () => {
  it('AC-1: 150 x 2 with 10 % -> line 270.00, subtotal 270.00', () => {
    const item = { price: 150, quantity: 2, discount: pct(10) };
    expect(calculateLineTotals(item)).toEqual({ gross: 300, discount: 30, net: 270 });
    expect(calculateRepairTotals([item], null).subtotal).toBe(270);
  });

  it('AC-2: 350 x 1 with 50 kr -> line 300.00', () => {
    expect(calculateLineTotals({ price: 350, quantity: 1, discount: amt(50) }).net).toBe(300);
  });

  it('AC-2: flat line discount applies to the line total, not per unit', () => {
    expect(calculateLineTotals({ price: 100, quantity: 3, discount: amt(50) }).net).toBe(250);
  });

  it('AC-3: subtotal 570, 5 % -> Rabat 28.50, I alt 541.50', () => {
    const r = calculateRepairTotals([{ price: 570, quantity: 1, discount: null }], pct(5));
    expect([r.subtotal, r.repairDiscount, r.total]).toEqual([570, 28.5, 541.5]);
  });

  it('AC-4: subtotal 570, 100 kr -> I alt 470.00', () => {
    const r = calculateRepairTotals([{ price: 570, quantity: 1, discount: null }], amt(100));
    expect(r.total).toBe(470);
  });

  it('line discounts are applied before the repair discount', () => {
    const r = calculateRepairTotals([{ price: 100, quantity: 1, discount: pct(50) }], pct(50));
    expect(r.subtotal).toBe(50);
    expect(r.total).toBe(25);
  });
});

describe('AC-12: zero discount', () => {
  it('AC-12: a 0 discount behaves like no discount (line and repair)', () => {
    const r = calculateRepairTotals([{ price: 10, quantity: 1, discount: pct(0) }], amt(0));
    expect(r.lines[0].discount).toBe(0);
    expect(r.repairDiscount).toBe(0);
    expect(r.total).toBe(10);
  });
});

describe('rounding (spec section 3, half up)', () => {
  it('rounds half up: 0.5 % of 1.00 (0.5 ore) -> 0.01', () => {
    expect(calculateLineTotals({ price: 1, quantity: 1, discount: pct(0.5) }).discount).toBe(0.01);
  });
  it('rounds down below half: 0.4 % of 1.00 -> 0.00', () => {
    expect(calculateLineTotals({ price: 1, quantity: 1, discount: pct(0.4) }).discount).toBe(0);
  });
  it('12.5 % of 3.30 (41.25 ore) -> 0.41', () => {
    expect(calculateLineTotals({ price: 3.3, quantity: 1, discount: pct(12.5) }).discount).toBe(
      0.41
    );
  });
  it('12.5 % of 0.04 (0.5 ore) rounds up to 0.01', () => {
    expect(calculateLineTotals({ price: 0.04, quantity: 1, discount: pct(12.5) }).discount).toBe(
      0.01
    );
  });
  it('fractional quantity gross is rounded to whole ore', () => {
    expect(calculateLineTotals({ price: 0.99, quantity: 1.5, discount: null }).gross).toBe(1.49);
  });
  it('no floating-point drift: 0.1 + 0.2', () => {
    const r = calculateRepairTotals(
      [
        { price: 0.1, quantity: 1, discount: null },
        { price: 0.2, quantity: 1, discount: null },
      ],
      null
    );
    expect(r.subtotal).toBe(0.3);
  });
});

describe('SR-4: discount values rounded to 2 dp before use', () => {
  it('SR-4: percent 12.346 is used as 12.35', () => {
    const a = calculateLineTotals({ price: 100, quantity: 1, discount: pct(12.346) });
    const b = calculateLineTotals({ price: 100, quantity: 1, discount: pct(12.35) });
    expect(a).toEqual(b);
  });
  it('SR-4: percent 12.344 is used as 12.34', () => {
    const a = calculateLineTotals({ price: 100, quantity: 1, discount: pct(12.344) });
    const b = calculateLineTotals({ price: 100, quantity: 1, discount: pct(12.34) });
    expect(a).toEqual(b);
  });
  it('SR-4: percent 12.345 yields a total consistent with 12.34 or 12.35', () => {
    const r = calculateRepairTotals([{ price: 100, quantity: 1, discount: pct(12.345) }], null);
    expect([12.34, 12.35]).toContain(r.lines[0].discount);
    expect(r.total).toBe(Math.round((100 - r.lines[0].discount) * 100) / 100);
  });
  it('SR-4: amount 10.006 is used as 10.01', () => {
    expect(calculateLineTotals({ price: 100, quantity: 1, discount: amt(10.006) }).discount).toBe(
      10.01
    );
  });
  it('SR-4: percent 100.004 rounds to 100 and is accepted', () => {
    expect(calculateLineTotals({ price: 100, quantity: 1, discount: pct(100.004) }).net).toBe(0);
  });
});

describe('clamping (defensive) and non-negative totals', () => {
  it('line flat discount above gross is clamped to gross', () => {
    const l = calculateLineTotals({ price: 10, quantity: 1, discount: amt(50) });
    expect(l).toEqual({ gross: 10, discount: 10, net: 0 });
  });
  it('repair flat discount above subtotal is clamped, total is 0', () => {
    const r = calculateRepairTotals([{ price: 10, quantity: 1, discount: null }], amt(500));
    expect(r.repairDiscount).toBe(10);
    expect(r.total).toBe(0);
  });
  it('price 0 is allowed', () => {
    expect(calculateLineTotals({ price: 0, quantity: 1, discount: null }).net).toBe(0);
  });
});

describe('SR-3: throws on invalid numbers', () => {
  const ok = { price: 10, quantity: 1, discount: null };
  const line = (o: object) => () => calculateLineTotals({ ...ok, ...o } as never);

  it('SR-3: price NaN throws', () => expect(line({ price: NaN })).toThrow());
  it('SR-3: price Infinity throws', () => expect(line({ price: Infinity })).toThrow());
  it('SR-3: price negative throws', () => expect(line({ price: -1 })).toThrow());
  it('SR-3: price 1e300 throws', () => expect(line({ price: 1e300 })).toThrow());
  it('SR-3: price above 99999999.99 throws', () => expect(line({ price: 100000000 })).toThrow());
  it('SR-3: price exactly 99999999.99 is accepted', () => {
    expect(
      calculateLineTotals({ price: 99999999.99, quantity: 1, discount: null }).net
    ).toBe(99999999.99);
  });
  it('SR-3: quantity NaN throws', () => expect(line({ quantity: NaN })).toThrow());
  it('SR-3: quantity Infinity throws', () => expect(line({ quantity: Infinity })).toThrow());
  it('SR-3: quantity 0 throws', () => expect(line({ quantity: 0 })).toThrow());
  it('SR-3: quantity negative throws', () => expect(line({ quantity: -2 })).toThrow());
  it('SR-3: computed line gross above 99999999.99 throws', () => {
    expect(line({ price: 50000000, quantity: 2 })).toThrow();
  });
  it('SR-3: discount value NaN throws', () => {
    expect(line({ discount: pct(NaN) })).toThrow();
    expect(line({ discount: amt(NaN) })).toThrow();
  });
  it('SR-3: discount value Infinity throws', () => {
    expect(line({ discount: amt(Infinity) })).toThrow();
  });
  it('SR-3: discount value negative throws', () => expect(line({ discount: pct(-5) })).toThrow());
  it('SR-3: discount value above 99999999.99 throws', () => {
    expect(line({ discount: amt(100000000) })).toThrow();
  });
  it('SR-3: repair discount NaN/negative/huge throws', () => {
    const items = [ok];
    expect(() => calculateRepairTotals(items, amt(NaN))).toThrow();
    expect(() => calculateRepairTotals(items, pct(-1))).toThrow();
    expect(() => calculateRepairTotals(items, amt(1e12))).toThrow();
  });
  it('SR-3: repair subtotal above 99999999.99 throws', () => {
    const big = { price: 60000000, quantity: 1, discount: null };
    expect(() => calculateRepairTotals([big, big], null)).toThrow();
  });
  it('SR-3: invalid item anywhere in the list throws', () => {
    expect(() => calculateRepairTotals([ok, { ...ok, quantity: 0 }], null)).toThrow();
  });
});

describe('validateDiscount messages and boundaries (SR-14)', () => {
  it('null discount is valid', () => expect(validateDiscount(null, 100)).toBeNull());
  it('SR-14: 0 is valid (both types)', () => {
    expect(validateDiscount(pct(0), 100)).toBeNull();
    expect(validateDiscount(amt(0), 100)).toBeNull();
    expect(validateDiscount(amt(0), 0)).toBeNull();
  });
  it('SR-14: 100 % is valid', () => expect(validateDiscount(pct(100), 100)).toBeNull());
  it('SR-14: 100.01 % -> Procent skal være mellem 0 og 100', () => {
    expect(validateDiscount(pct(100.01), 100)).toBe('Procent skal være mellem 0 og 100');
  });
  it('AC-6: 150 % -> Procent skal være mellem 0 og 100', () => {
    expect(validateDiscount(pct(150), 100)).toBe('Procent skal være mellem 0 og 100');
  });
  it('SR-14: amount = line gross is valid', () => {
    expect(validateDiscount(amt(300), 300)).toBeNull();
  });
  it('SR-14: amount = subtotal is valid (fractional)', () => {
    expect(validateDiscount(amt(254.97), 254.97)).toBeNull();
  });
  it('AC-6: amount just above base -> Rabat kan ikke overstige beløbet', () => {
    expect(validateDiscount(amt(300.01), 300)).toBe('Rabat kan ikke overstige beløbet');
  });
  it('AC-6: amount > base 0 -> Rabat kan ikke overstige beløbet', () => {
    expect(validateDiscount(amt(1), 0)).toBe('Rabat kan ikke overstige beløbet');
  });
  it('AC-6: negative percent -> Rabat skal være 0 eller mere', () => {
    expect(validateDiscount(pct(-1), 100)).toBe('Rabat skal være 0 eller mere');
  });
  it('AC-6: negative amount -> Rabat skal være 0 eller mere', () => {
    expect(validateDiscount(amt(-0.01), 100)).toBe('Rabat skal være 0 eller mere');
  });
  it('AC-6: NaN -> Ugyldigt tal', () => {
    expect(validateDiscount(pct(NaN), 100)).toBe('Ugyldigt tal');
    expect(validateDiscount(amt(NaN), 100)).toBe('Ugyldigt tal');
  });
  it('AC-6: Infinity -> Ugyldigt tal', () => {
    expect(validateDiscount(amt(Infinity), 100)).toBe('Ugyldigt tal');
  });
  it('value above 99999999.99 -> Ugyldigt tal', () => {
    expect(validateDiscount(amt(100000000), 1e9)).toBe('Ugyldigt tal');
  });
  it('SR-14: every validator-accepted discount is accepted by the calculator', () => {
    const cases: [Discount, number][] = [
      [pct(100), 300],
      [amt(300), 300],
      [pct(0), 300],
      [amt(0), 300],
      [pct(15), 299.97],
    ];
    for (const [d, gross] of cases) {
      expect(validateDiscount(d, gross)).toBeNull();
      expect(() => calculateLineTotals({ price: gross, quantity: 1, discount: d })).not.toThrow();
    }
  });
});
