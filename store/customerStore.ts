import {create} from 'zustand';
import { Customer } from '@/types/customer';

type CustomerStore = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  setCustomers: (customers: Customer[]) => void;
};

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  selectedCustomer: null,
  setSelectedCustomer: (customer) => set({selectedCustomer: customer}),
  setCustomers: (customers) => set({customers}),
}));