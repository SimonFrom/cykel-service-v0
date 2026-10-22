import {Repair} from "@/types/repair";

export type Bike = {
  id: number;
  customerId: number;
  make: string;
  model: string;
  colour: string;
  type: BikeTypes;
  repairs?: Repair[];
};

export const bikeTypes = [
  { label: 'MTB', value: 'mtb' },
  { label: 'City', value: 'city' },
  { label: 'Shopping', value: 'shoppping' },
  { label: 'Børne', value: 'kid' },
  { label: 'Racer', value: 'racer' },
  { label: 'Elcykel', value: 'electric' }
] as const;

export type BikeTypes = typeof bikeTypes[number]['value'];


// export enum bikeTypes {
//     mtb = 'MTB',
//     city = 'City',
//     shopping = 'Shopping',
//     kid = 'Børne',
//     race = 'Racer',
// }