import {RepairItem} from "@/types/repairItems";


export type Repair = {
    id: number
    bikeId: number
    customerId: number
    totalPrice: number
    note?: string[]
    items: RepairItem[]
    createdAt: Date
    intakeDate: Date
    deliveryDate?: Date

}