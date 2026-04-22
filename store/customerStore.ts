import {create} from 'zustand';
import { Customer } from '@/types/customer';

type CustomerStore = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  setCustomersInStore: (customers: Customer[]) => void;
  updateCustomerInStore: (customer: Customer) => void;
  deleteCustomerInStore: (id: number) => void;
};

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  selectedCustomer: null,
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