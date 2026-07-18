import {supabase} from "@/utils/supabase";
import {Bike} from "@/types/bike";
import { Customer } from '@/types/customer';

export const getBikes = async (id:number): Promise<Bike[]> => {
    const {data, error} = await supabase
        .from("bikes")
        .select("*")
        .eq('customer_id', id)

    if (error) throw error;
    return data ?? [];
}

export const getAllBikes = async (): Promise<Bike[]> => {
    const {data, error} = await supabase
        .from("bikes")
        .select("*") 

    if (error) throw error;
    return data ?? [];
}

export const deleteBike = async (id: number) => {
  const { error } = await supabase.from('bikes').delete().eq('id', id);
  if (error) console.log(error);
};

export const createBike = async (bike: Bike) => {
  const { error } = await supabase.from('bikes').insert({
    customer_id: bike.customerId,
    make: bike.make,
    model: bike.model,
    colour: bike.colour,
    type: bike.type,
  });

  if (error) {
    console.error('createBike error:', JSON.stringify(error, null, 2));
    throw error;
  }
};

export const updateBike = async (bike: Bike) => {
  const { error } = await supabase
    .from('bikes')
    .update({
      customer_id: bike.customerId,
      make: bike.make,
      model: bike.model,
      colour: bike.colour,
      type: bike.type,
  }).eq('id', bike.id);
  if (error) {
    console.error('updateBike error:', JSON.stringify(error, null, 2));
  }
}