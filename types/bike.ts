import {Repair} from "@/types/repair";
import {Customer} from "@/types/customer";

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
] as const;

export type BikeTypes = typeof bikeTypes[number]['value'];


// export enum bikeTypes {
//     mtb = 'MTB',
//     city = 'City',
//     shopping = 'Shopping',
//     kid = 'Børne',
//     race = 'Racer',
// }