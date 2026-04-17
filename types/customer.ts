import {Bike} from "@/types/bike";

export type Customer = {
    id: number
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    club?: string
    note?: string
    bikes?: Bike[]
}