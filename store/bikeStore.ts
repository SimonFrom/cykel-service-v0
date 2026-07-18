import { create } from 'zustand';
import { Bike } from '@/types/bike'
import { getAllBikes, getBikes } from '@/crud/bikes';


type BikeStore = {
  bikes: Bike[];
  isLoading: boolean;
  error: string | null;
  totalNumberOfBikes: number;
  setBikesInStore: (bikes: Bike[]) => void;
  selectedBike: Bike | null;
  setSelectedBike: (selectedBike: Bike) => void;
  updateBikeInStore: (bike: Bike) => void;
  deleteBike: (id: number) => void;
  fetchAllBikes: () => Promise<void>;
};

export const useBikeStore = create<BikeStore>((set) => ({
  bikes: [],
  totalNumberOfBikes: 0,
  isLoading: false,
  error: null,

  fetchAllBikes: async () => {
    set({ isLoading: true, error: null });
    try { 
      const data = await getAllBikes();
      set({ totalNumberOfBikes: data.length, bikes: data });
    } catch (error) {
      console.error('Error fetching bikes length:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  setBikesInStore: (bikes) => set({bikes}),
  selectedBike: null,
  setSelectedBike: (bike) => set({selectedBike: bike}),
  updateBikeInStore: (updated) => set((state) => ({
    selectedBike: updated,
    bikes: state.bikes.map((b) => b.id === updated.id ? updated : b)
  })),
  deleteBike: (id) => set((state) => ({
    bikes: state.bikes.filter((b) => b.id.toString() !== id.toString()),
  }))
}))