import { create } from 'zustand';
import { Repair } from '@/types/repair';
import { getAllRepairs } from '@/crud/repairs';

type RepairStore = {
  repairs: Repair[];
  isLoading: boolean;
  error: string | null;
  fetchRepairs: () => Promise<void>;
  setRepairsInStore: (repairs: Repair[]) => void;
  selectedRepair: Repair | null;
  setSelectedRepair: (selectedRepair: Repair | null) => void;
  updateRepairInStore: (repair: Repair) => void;
  deleteRepair: (id: number) => void;
};

export const useRepairStore = create<RepairStore>((set) => ({
  repairs: [],
  isLoading: false,
  error: null,
  fetchRepairs: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getAllRepairs();
      set({ repairs: data, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },
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
