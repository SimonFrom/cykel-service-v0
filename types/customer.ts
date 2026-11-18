import {Bike} from "@/types/bike";

export type Customer = {
    id: number
    firstName: string
    lastName: string
    streetName: string
    streetNumber: string
    postalCode: string
    city: string
    email: string
    phoneNumber: string
    club?: string
    note?: string
    bikes?: Bike[]
}
