// utils/repairsCrud.ts
import { supabase } from '@/utils/supabase';
import { Repair } from '@/types/repair';
import { RepairItem } from '@/types/repairItems';
import { useCustomerStore } from '@/store/customerStore';
import { useBikeStore } from '@/store/bikeStore';

// Helpers to keep mapping in one place
const mapRepairRow = (row: any, items: RepairItem[]): Repair => ({
  id: row.id,
  bikeId: row.bike_id,
  customerId: row.customer_id,
  totalPrice: row.total_price,
  note: row.note ?? undefined,
  items,
  createdAt: new Date(row.created_at),
  intakeDate: new Date(row.intake_date),
  deliveryDate: row.delivery_date ? new Date(row.delivery_date) : undefined,
  complete: row.complete,
  paymentReceived: row.payment_received,
});

const mapItemRow = (row: any): RepairItem => ({
  id: row.id,
  title: row.title,
  price: row.price,
  quantity: row.quantity,
  total: row.total,
});

const customer = useCustomerStore((s) => s.selectedCustomer);
const bike = useBikeStore((s) => s.selectedBike);

export const getRepairs = async (): Promise<Repair[]> => {
  // One round-trip using a nested select — supabase pulls items in the same query
  const { data, error } = await supabase.from('repairs').select('*, repair_items(*)');

  if (error) throw error;

  return (data ?? []).map((row) => mapRepairRow(row, (row.repair_items ?? []).map(mapItemRow)));
};

export const getRepair = async (id: number): Promise<Repair | null> => {
  const { data, error } = await supabase
    .from('repairs')
    .select('*, repair_items(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return mapRepairRow(data, (data.repair_items ?? []).map(mapItemRow));
};

export const createRepair = async (repair: Omit<Repair, 'id'>): Promise<number> => {
  // Insert the repair first so we get the generated id
  const { data, error } = await supabase
    .from('repairs')
    .insert({
      bike_id: bike?.id,
      customer_id: customer?.id,
      total_price: repair.totalPrice,
      note: repair.note ?? null,
      created_at: repair.createdAt.toISOString(),
      intake_date: repair.intakeDate.toISOString(),
      delivery_date: repair.deliveryDate?.toISOString() ?? null,
      complete: repair.complete,
      payment_received: repair.paymentReceived,
    })
    .select('id')
    .single();

  if (error) throw error;

  const repairId = data.id;

  // Then insert all items pointing at the new repair
  if (repair.items.length > 0) {
    const { error: itemsError } = await supabase.from('repair_items').insert(
      repair.items.map((item) => ({
        repair_id: repairId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      }))
    );

    if (itemsError) throw itemsError;
  }

  return repairId;
};

export const updateRepair = async (id: number, repair: Repair) => {
  // Update the repair row
  const { error } = await supabase
    .from('repairs')
    .update({
      bike_id: repair.bikeId,
      customer_id: repair.customerId,
      total_price: repair.totalPrice,
      note: repair.note ?? null,
      intake_date: repair.intakeDate.toISOString(),
      delivery_date: repair.deliveryDate?.toISOString() ?? null,
      complete: repair.complete,
      payment_received: repair.paymentReceived,
      // note: createdAt is intentionally not updated
    })
    .eq('id', id);

  if (error) {
    console.error(error);
    return error;
  }

  // Simplest reliable approach for items: delete all, re-insert.
  // Works fine for small line counts (typical for a repair).
  const { error: deleteError } = await supabase.from('repair_items').delete().eq('repair_id', id);

  if (deleteError) {
    console.error(deleteError);
    return deleteError;
  }

  if (repair.items.length > 0) {
    const { error: insertError } = await supabase.from('repair_items').insert(
      repair.items.map((item) => ({
        repair_id: id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      }))
    );

    if (insertError) {
      console.error(insertError);
      return insertError;
    }
  }
};

export const deleteRepair = async (id: number) => {
  // repair_items cascade-deletes via the FK, so this one call is enough
  const { error } = await supabase.from('repairs').delete().eq('id', id);

  if (error) {
    console.error(error);
    return error;
  }
};
