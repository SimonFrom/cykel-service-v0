import {RepairItem} from "@/types/repairItems";
import {Bike} from "@/types/bike";
import {Customer} from "@/types/customer";


export type Repair = {
    id?: number
    customer?: Customer
    customerId: number
    totalPrice: number
    note?: string[]
    items: RepairItem[]
    bike?: Bike
    bikeId: number
    createdAt: string
    intakeDate: string
    deliveryDate?: string

}