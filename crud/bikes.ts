import {supabase} from "@/utils/supabase";
import {Bike} from "@/types/bike";

export const getBikes = async (id:number): Promise<Bike[]> => {
    const {data, error} = await supabase
        .from("bikes")
        .select("*")
        .eq('customer_id', id)

    if (error) throw error;
    return data ?? [];
}

export const deleteBike = async (id:number): Promise<void> => {
    const {error} = await supabase
        .from('bikes').delete()
        .eq('id', id)
    if (error) console.log(error);
}