import {Repair} from "@/types/repair";
import {Customer} from "@/types/customer";

export type Bike = {
    id?: number
    customerId: number
    customer?: Customer
    make: string
    model: string
    colour: string
    type: bikeTypes
    repairs?: Repair[]
}

export enum bikeTypes {
    mtb = 'MTB',
    city = 'City',
    shopping = 'Shopping',
    kid = 'Børne',
    race = 'Racer',
}