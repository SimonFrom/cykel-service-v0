import { create } from 'zustand';
import { Bike } from '@/types/bike'


type BikeStore = {
  bikes: Bike[];
  setBikesInStore: (bikes: Bike[]) => void;
  selectedBike: Bike | null;
  setSelectedBike: (selectedBike: Bike) => void;
  updateBikeInStore: (bike: Bike) => void;
  deleteBike: (id: number) => void;
};

export const useBikeStore = create<BikeStore>((set) => ({
  bikes: [],
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