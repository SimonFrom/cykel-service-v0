// SR-5: strict discount text parsing. parseDiscountText lives in a React Native component file.
// Stock components pull in untransformed @rn-primitives; stub them (parse fn is pure).
jest.mock('@/components/ui/stock components/button', () => ({ Button: () => null }));
jest.mock('@/components/ui/stock components/input', () => ({ Input: () => null }));
jest.mock('@/components/ui/stock components/text', () => ({ Text: () => null }));
import { parseDiscountText } from '@/components/ui/DiscountInput';
import { validateDiscount } from '@/lib/repairPricing';

describe('SR-5: parseDiscountText', () => {
  it.each(['1e3', '0x10', 'Infinity', '12,345', '5..0', 'abc', '1 000', '+5'])(
    'rejects %p as NaN, reported as "Ugyldigt tal"',
    (text) => {
      const d = parseDiscountText(text, 'amount');
      expect(d).not.toBeNull();
      expect(Number.isNaN(d!.value)).toBe(true);
      expect(validateDiscount(d, 1000)).toBe('Ugyldigt tal');
    }
  );

  it('-5 parses to a negative value that validateDiscount reports', () => {
    const d = parseDiscountText('-5', 'amount');
    expect(d).toEqual({ type: 'amount', value: -5 });
    expect(validateDiscount(d, 1000)).not.toBeNull();
  });

  it('accepts comma and dot decimals', () => {
    expect(parseDiscountText('12,5', 'amount')).toEqual({ type: 'amount', value: 12.5 });
    expect(parseDiscountText('12.50', 'percent')).toEqual({ type: 'percent', value: 12.5 });
    expect(validateDiscount(parseDiscountText('12,5', 'amount'), 1000)).toBeNull();
  });

  it('empty, whitespace and zero give null', () => {
    expect(parseDiscountText('', 'percent')).toBeNull();
    expect(parseDiscountText('   ', 'percent')).toBeNull();
    expect(parseDiscountText('0', 'amount')).toBeNull();
    expect(parseDiscountText('0,00', 'amount')).toBeNull();
  });
});
