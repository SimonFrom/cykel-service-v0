import { create } from 'zustand';
import { Repair } from '@/types/repair';

type RepairStore = {
  repairs: Repair[];
  setRepairsInStore: (repairs: Repair[]) => void;
  selectedRepair: Repair | null;
  setSelectedRepair: (selectedRepair: Repair) => void;
  updateRepairInStore: (repair: Repair) => void;
  deleteRepair: (id: number) => void;
};

export const useRepairStore = create<RepairStore>((set) => ({
  repairs: [],
  setRepairsInStore: (repairs) => set({ repairs }),
  selectedRepair: null,
  setSelectedRepair: (repair) => set({ selectedRepair: repair }),
  updateRepairInStore: (updated) =>
    set((state) => ({
      selectedRepair: updated,
      repairs: state.repairs.map((r) => (r.id === updated.id ? updated : r)),
    })),
  deleteRepair: (id) =>
    set((state) => ({
      repairs: state.repairs.filter((r) => r.id.toString() !== id.toString()),
    })),
}));
