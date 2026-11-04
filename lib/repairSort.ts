import { Repair } from '@/types/repair';

export type RepairSortKey = 'newest' | 'oldest' | 'priceDesc' | 'priceAsc' | 'status';

export const repairSortOptions: { label: string; value: RepairSortKey }[] = [
  { label: 'Nyeste', value: 'newest' },
  { label: 'Ældste', value: 'oldest' },
  { label: 'Pris (høj–lav)', value: 'priceDesc' },
  { label: 'Pris (lav–høj)', value: 'priceAsc' },
  { label: 'Status', value: 'status' },
];

// 0 = not delivered, 1 = delivered but unpaid, 2 = done
export function repairStatusRank(repair: Repair) {
  if (!repair.complete) return 0;
  return repair.paymentReceived ? 2 : 1;
}

const byNewest = (a: Repair, b: Repair) =>
  b.intakeDate.getTime() - a.intakeDate.getTime() || b.id - a.id;

const COMPARATORS: Record<RepairSortKey, (a: Repair, b: Repair) => number> = {
  newest: byNewest,
  oldest: (a, b) => -byNewest(a, b),
  priceDesc: (a, b) => b.totalPrice - a.totalPrice || byNewest(a, b),
  priceAsc: (a, b) => a.totalPrice - b.totalPrice || byNewest(a, b),
  status: (a, b) => repairStatusRank(a) - repairStatusRank(b) || byNewest(a, b),
};

// Returns a new array; the input is not mutated.
export function sortRepairs(repairs: Repair[], key: RepairSortKey): Repair[] {
  return [...repairs].sort(COMPARATORS[key]);
}

export type BikeRepairSummary = { total: number; open: number; lastIntake: Date | null };

// Repair counts and the latest intake date for one bike.
export function summarizeBikeRepairs(repairs: Repair[], bikeId: number): BikeRepairSummary {
  const forBike = repairs.filter((r) => r.bikeId === bikeId);
  const lastIntake = forBike.reduce<Date | null>(
    (latest, r) => (!latest || r.intakeDate > latest ? r.intakeDate : latest),
    null
  );
  return {
    total: forBike.length,
    open: forBike.filter((r) => !r.complete).length,
    lastIntake,
  };
}
