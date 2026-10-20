import type { Discount } from '@/types/discount';
import type { RepairItem } from '@/types/repairItems';

export type LineTotals = { gross: number; discount: number; net: number };
export type RepairTotals = {
  lines: LineTotals[];
  subtotal: number;
  repairDiscount: number;
  total: number;
};

type PricedItem = Pick<RepairItem, 'price' | 'quantity' | 'discount'>;

const MAX_AMOUNT = 99999999.99;
const MAX_ORE = Math.round(MAX_AMOUNT * 100);

// Throws unless x is a finite number within 0..MAX_AMOUNT.
function assertAmount(x: number, name: string): void {
  if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > MAX_AMOUNT) {
    throw new Error(`Invalid ${name}`);
  }
}

// Throws unless n is a safe integer.
function assertSafe(n: number, name: string): number {
  if (!Number.isSafeInteger(n)) throw new Error(`Unsafe number in ${name}`);
  return n;
}

// Throws unless the øre amount is a safe integer within 0..MAX_ORE.
function assertOre(n: number, name: string): number {
  assertSafe(n, name);
  if (n < 0 || n > MAX_ORE) throw new Error(`Out of range ${name}`);
  return n;
}

function toOre(x: number): number {
  return Math.round(x * 100);
}

function fromOre(o: number): number {
  return o / 100;
}

// Round half up on non-negative integers.
function pctOf(ore: number, bp: number): number {
  assertSafe(ore * bp + 5000, 'percentage');
  return Math.floor((ore * bp + 5000) / 10000);
}

// Validates a discount (SR-3) and rounds its value to 2 dp (SR-4).
function normalizeValue(discount: Discount): number {
  assertAmount(discount.value, 'discount value');
  const value = fromOre(toOre(discount.value));
  if (discount.type === 'percent' && value > 100) throw new Error('Invalid discount value');
  if (discount.type !== 'percent' && discount.type !== 'amount') {
    throw new Error('Invalid discount type');
  }
  return value;
}

// Discount amount in øre for a given base, clamped to the base.
function discountOre(discount: Discount | null, baseOre: number): number {
  if (discount == null) return 0;
  const value = normalizeValue(discount);
  if (value === 0) return 0;
  if (discount.type === 'percent') {
    return Math.min(pctOf(baseOre, Math.round(value * 100)), baseOre);
  }
  return Math.min(toOre(value), baseOre);
}

function lineOre(item: PricedItem): { gross: number; discount: number; net: number } {
  assertAmount(item.price, 'price');
  if (
    typeof item.quantity !== 'number' ||
    !Number.isFinite(item.quantity) ||
    item.quantity <= 0 ||
    item.quantity > MAX_AMOUNT
  ) {
    throw new Error('Invalid quantity');
  }
  const priceOre = assertSafe(toOre(item.price), 'price');
  const gross = assertOre(assertSafe(Math.round(priceOre * item.quantity), 'gross'), 'gross');
  const discount = discountOre(item.discount, gross);
  return { gross, discount, net: gross - discount };
}

// Totals for one line, in DKK with 2 decimals. Throws on invalid input.
export function calculateLineTotals(item: PricedItem): LineTotals {
  const { gross, discount, net } = lineOre(item);
  return { gross: fromOre(gross), discount: fromOre(discount), net: fromOre(net) };
}

// Totals for a repair: line discounts first, then the repair discount. Throws on invalid input.
export function calculateRepairTotals(
  items: PricedItem[],
  discount: Discount | null
): RepairTotals {
  const ores = items.map(lineOre);
  let subtotal = 0;
  for (const l of ores) subtotal = assertOre(subtotal + l.net, 'subtotal');
  const repairDiscount = discountOre(discount, subtotal);
  const total = assertOre(subtotal - repairDiscount, 'total');
  return {
    lines: ores.map((l) => ({
      gross: fromOre(l.gross),
      discount: fromOre(l.discount),
      net: fromOre(l.net),
    })),
    subtotal: fromOre(subtotal),
    repairDiscount: fromOre(repairDiscount),
    total: fromOre(total),
  };
}

// Returns a Danish error message or null. `base` = line gross or subtotal (DKK).
export function validateDiscount(discount: Discount | null, base: number): string | null {
  if (discount == null) return null;
  const { type, value } = discount;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Ugyldigt tal';
  if (value < 0) return 'Rabat skal være 0 eller mere';
  if (value > MAX_AMOUNT) return 'Ugyldigt tal';
  const rounded = fromOre(toOre(value));
  if (type === 'percent') {
    return rounded > 100 ? 'Procent skal være mellem 0 og 100' : null;
  }
  if (type === 'amount') {
    return toOre(rounded) > toOre(base) ? 'Rabat kan ikke overstige beløbet' : null;
  }
  return 'Ugyldigt tal';
}
