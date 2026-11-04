import { supabase } from '@/utils/supabase';
import { Bike } from '@/types/bike';

type BikeRow = {
  id: number;
  customer_id: number;
  make: string;
  model: string;
  colour: string;
  type: Bike['type'];
};

const mapBikeRow = (row: BikeRow): Bike => ({
  id: row.id,
  customerId: row.customer_id,
  make: row.make,
  model: row.model,
  colour: row.colour,
  type: row.type,
});

const toBikeRow = (bike: Bike): Omit<BikeRow, 'id'> => ({
  customer_id: bike.customerId,
  make: bike.make,
  model: bike.model,
  colour: bike.colour,
  type: bike.type,
});

export const getBikes = async (customerId: number): Promise<Bike[]> => {
  const { data, error } = await supabase
    .from('bikes')
    .select('*')
    .eq('customer_id', customerId)
    .returns<BikeRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapBikeRow);
};

export const getAllBikes = async (): Promise<Bike[]> => {
  const { data, error } = await supabase.from('bikes').select('*').returns<BikeRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapBikeRow);
};

// RLS can silently block a delete (no error, 0 rows), so check that the row was actually removed.
export const deleteBike = async (id: number) => {
  const { data, error } = await supabase.from('bikes').delete().eq('id', id).select('id');

  if (error) throw error;
  if (!data?.length)
    throw new Error('Databasen afviste sletningen (tjek RLS-regler for sletning).');
};

export const createBike = async (bike: Bike): Promise<Bike> => {
  const { data, error } = await supabase
    .from('bikes')
    .insert(toBikeRow(bike))
    .select('*')
    .single<BikeRow>();

  if (error) throw error;
  return mapBikeRow(data);
};

export const updateBike = async (bike: Bike): Promise<Bike> => {
  const { data, error } = await supabase
    .from('bikes')
    .update(toBikeRow(bike))
    .eq('id', bike.id)
    .select('*')
    .single<BikeRow>();

  if (error) throw error;
  return mapBikeRow(data);
};
