import {Discount} from "@/types/discount";

export type RepairItem = {
    id: number
    price: number
    // In time i want to build a catalog of the most common lines
    title: string
    quantity: number
    discount: Discount | null
    // DERIVED: net line total after line discount, set by lib/repairPricing
    total: number
}