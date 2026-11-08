import { buildDateOptions } from '@/components/dateSelect';

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe('buildDateOptions', () => {
  it('includes past dates so repairs can be backdated (#21)', () => {
    const options = buildDateOptions(day(2026, 10, 15), 30, 30);
    expect(options).toHaveLength(60);
    expect(options[0].date).toEqual(day(2026, 9, 15));
    expect(options[options.length - 1].date).toEqual(day(2026, 11, 13));
  });

  it('adds a value outside the range, keeping options sorted', () => {
    const old = day(2026, 1, 2);
    const options = buildDateOptions(day(2026, 10, 15), 2, 2, old);
    expect(options.map((o) => o.date)).toEqual([
      old,
      day(2026, 10, 13),
      day(2026, 10, 14),
      day(2026, 10, 15),
      day(2026, 10, 16),
    ]);
  });

  it('does not duplicate a value already in range', () => {
    const options = buildDateOptions(day(2026, 10, 15), 2, 2, day(2026, 10, 14));
    expect(options).toHaveLength(4);
  });
});
