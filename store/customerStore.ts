import {create} from 'zustand';
import { Customer } from '@/types/customer';
import { getCustomers } from '@/crud/customers';

type CustomerStore = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  setSelectedCustomer: (customer: Customer) => void;
  setCustomersInStore: (customers: Customer[]) => void;
  updateCustomerInStore: (customer: Customer) => void;
  deleteCustomerInStore: (id: number) => void;
};

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getCustomers();
      set({ customers: data, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },
  setSelectedCustomer: (customer) => set({selectedCustomer: customer}),
  setCustomersInStore: (customers) => set({customers}),
  updateCustomerInStore: (updated) => set((state) => ({
    selectedCustomer: updated,
    customers: state.customers.map((c) => c.id === updated.id ? updated : c),
  })),
  deleteCustomerInStore: (id) => set((state) => ({
    customers: state.customers.filter((c) => c.id.toString() !== id.toString()),
  })),
}))