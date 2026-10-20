// crud/repairs.ts
import { supabase } from '@/utils/supabase';
import { Repair } from '@/types/repair';
import { RepairItem } from '@/types/repairItems';
import { Discount } from '@/types/discount';
import { calculateRepairTotals } from '@/lib/repairPricing';

type RepairItemRow = {
  id: number;
  repair_id: number;
  title: string;
  price: number | string | null;
  quantity: number | string | null;
  total: number | string | null;
  discount_type: string | null;
  discount_value: number | string | null;
};

type RepairRow = {
  id: number;
  bike_id: number;
  customer_id: number;
  total_price: number | string | null;
  discount_type: string | null;
  discount_value: number | string | null;
  note: string | null;
  created_at: string;
  intake_date: string;
  delivery_date: string | null;
  complete: boolean;
  payment_recieved: boolean;
  customerContacted: boolean;
  repair_items?: RepairItemRow[] | null;
};

type DiscountColumns = { discount_type: Discount['type'] | null; discount_value: number };

// Number() that maps null and non-finite values to 0 (SR-6).
const toNumber = (value: number | string | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// Only 'percent' and 'amount' map to a discount; anything else is null (SR-6).
const mapDiscount = (
  type: string | null,
  value: number | string | null | undefined
): Discount | null =>
  type === 'percent' || type === 'amount' ? { type, value: toNumber(value) } : null;

// Discount columns for a write: a null or zero discount is stored as type null, value 0 (AC-12).
const discountColumns = (discount: Discount | null): DiscountColumns =>
  discount == null || discount.value === 0
    ? { discount_type: null, discount_value: 0 }
    : { discount_type: discount.type, discount_value: Math.round(discount.value * 100) / 100 };

// Helpers to keep mapping in one place
const mapItemRow = (row: RepairItemRow): RepairItem => ({
  id: row.id,
  title: row.title,
  price: toNumber(row.price),
  quantity: toNumber(row.quantity),
  discount: mapDiscount(row.discount_type, row.discount_value),
  total: toNumber(row.total),
});

const mapRepairRow = (row: RepairRow): Repair => ({
  id: row.id,
  bikeId: row.bike_id,
  customerId: row.customer_id,
  discount: mapDiscount(row.discount_type, row.discount_value),
  totalPrice: toNumber(row.total_price),
  note: row.note ?? undefined,
  items: (row.repair_items ?? []).map(mapItemRow),
  createdAt: new Date(row.created_at),
  intakeDate: new Date(row.intake_date),
  deliveryDate: row.delivery_date ? new Date(row.delivery_date) : undefined,
  complete: row.complete,
  paymentReceived: row.payment_recieved,
  customerContacted: row.customerContacted,
});

// repair_items insert payload with computed line totals; caller totals are ignored (SR-1, SR-2).
// Throws on invalid input, so call it before the first request (SR-3).
const buildItemRows = (repairId: number, repair: Pick<Repair, 'items' | 'discount'>) => {
  const { lines } = calculateRepairTotals(repair.items, repair.discount);
  return repair.items.map((item, i) => {
    const d = discountColumns(item.discount);
    return {
      repair_id: repairId,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      total: lines[i].net,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
    };
  });
};

export const getRepairs = async (bikeId: number): Promise<Repair[]> => {
  // One round-trip using a nested select; supabase pulls items in the same query
  const { data, error } = await supabase
    .from('repairs')
    .select('*, repair_items(*)')
    .eq('bike_id', bikeId)
    .returns<RepairRow[]>();

  if (error) throw error;

  return (data ?? []).map(mapRepairRow);
};

export const getAllRepairs = async (): Promise<Repair[]> => {
  const { data, error } = await supabase
    .from('repairs')
    .select('*, repair_items(*)')
    .returns<RepairRow[]>();

  if (error) throw error;

  return (data ?? []).map(mapRepairRow);
};

export const getRepair = async (id: number): Promise<Repair | null> => {
  const { data, error } = await supabase
    .from('repairs')
    .select('*, repair_items(*)')
    .eq('id', id)
    .single<RepairRow>();

  if (error) {
    console.error(error);
    return null;
  }

  return mapRepairRow(data);
};

// Totals are computed from the lines; the caller's totalPrice and item totals are ignored.
export const createRepair = async (repair: Omit<Repair, 'id'>): Promise<number> => {
  // Both run before any request, so invalid input sends nothing (SR-3)
  const totals = calculateRepairTotals(repair.items, repair.discount);
  buildItemRows(0, repair);
  const d = discountColumns(repair.discount);

  // Insert the repair first so we get the generated id
  const { data, error } = await supabase
    .from('repairs')
    .insert({
      bike_id: repair.bikeId,
      customer_id: repair.customerId,
      total_price: totals.total,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      note: repair.note ?? null,
      created_at: repair.createdAt.toISOString(),
      intake_date: repair.intakeDate.toISOString(),
      delivery_date: repair.deliveryDate?.toISOString() ?? null,
      complete: repair.complete,
      payment_recieved: repair.paymentReceived,
      customerContacted: repair.customerContacted,
    })
    .select('id')
    .single();

  if (error) throw error;

  const repairId: number = data.id;

  // Then insert all items pointing at the new repair
  const itemRows = buildItemRows(repairId, repair);
  if (itemRows.length > 0) {
    const { error: itemsError } = await supabase.from('repair_items').insert(itemRows);

    if (itemsError) {
      // Compensating delete so a retry creates exactly one repair (best effort, SR-13)
      await supabase.from('repairs').delete().eq('id', repairId);
      throw itemsError;
    }
  }

  return repairId;
};

export const updateRepair = async (id: number, repair: Repair): Promise<void> => {
  // Both run before any request, so invalid input sends nothing (SR-3)
  const totals = calculateRepairTotals(repair.items, repair.discount);
  const itemRows = buildItemRows(id, repair);
  const d = discountColumns(repair.discount);

  // Update the repair row
  const { error } = await supabase
    .from('repairs')
    .update({
      bike_id: repair.bikeId,
      customer_id: repair.customerId,
      total_price: totals.total,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      note: repair.note ?? null,
      intake_date: repair.intakeDate.toISOString(),
      delivery_date: repair.deliveryDate?.toISOString() ?? null,
      complete: repair.complete,
      payment_recieved: repair.paymentReceived,
      customerContacted: repair.customerContacted,
      // note: createdAt is intentionally not updated
    })
    .eq('id', id);

  if (error) throw error;

  // Simplest reliable approach for items: delete all, re-insert (not atomic, see spec 5.3).
  const { error: deleteError } = await supabase.from('repair_items').delete().eq('repair_id', id);

  if (deleteError) throw deleteError;

  if (itemRows.length > 0) {
    const { error: insertError } = await supabase.from('repair_items').insert(itemRows);

    if (insertError) throw insertError;
  }
};

export const deleteRepair = async (id: number): Promise<void> => {
  // repair_items cascade-deletes via the FK, so this one call is enough
  const { error } = await supabase.from('repairs').delete().eq('id', id);

  if (error) throw error;
};
