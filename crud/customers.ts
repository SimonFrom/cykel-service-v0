import {supabase} from "@/utils/supabase";
import {Customer} from "@/types/customer";

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phoneNumber: row.phone_number,
    club: row.club ?? undefined,
    note: row.note ?? undefined,
  }));
};



export const getCustomer = async (id:number): Promise<Customer | null> => {
    const {data, error} = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

    if (error) console.error(error);
    return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phoneNumber: data.phone_number,
        club: data.club,
    };
}

export const createCustomer = async (customer: Omit<Customer, 'id'>) => {
  const { error } = await supabase.from('customers').insert({
    first_name: customer.firstName,
    last_name: customer.lastName,
    email: customer.email,
    phone_number: customer.phoneNumber,
    club: customer.club || null,
  });

  if (error) throw error;
};

export const deleteCustomer = async (id: number) => {
    const {data, error} = await supabase
        .from('customers').delete()
        .eq('id', id)

    if (error) return error;

}

export const updateCustomer = async (id: number, customer: Customer) => {
    const {error} = await supabase
        .from('customers')
        .update({
            first_name: customer.firstName,
            last_name: customer.lastName,
            email: customer.email,
            phone_number: customer.phoneNumber,
            club: customer.club,
        })
        .eq('id', id);
    if (error) {
        console.log(error);
        return error;
    }
}