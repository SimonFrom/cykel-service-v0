import {RepairItem} from "@/types/repairItems";


export type Repair = {
    id: number
    bikeId: number
    customerId: number
    totalPrice: number
    note?: string
    items: RepairItem[]
    createdAt: Date
    intakeDate: Date
    deliveryDate?: Date
    complete: boolean
    paymentReceived: boolean

}


export const mockRepairs: Repair[] = [
  {
    id: 1,
    bikeId: 101,
    customerId: 1,
    totalPrice: 650,
    note: "Brake cable replacement and tune-up",
    items: [
      { id: 1, price: 150, title: "Brake cable", quantity: 2, total: 300 },
      { id: 2, price: 350, title: "Full tune-up", quantity: 1, total: 350 },
    ],
    createdAt: new Date("2026-04-20T09:00:00"),
    intakeDate: new Date("2026-04-20T09:00:00"),
    deliveryDate: new Date("2026-04-22T15:00:00"),
    complete: true,
    paymentReceived: true,
  },
  {
    id: 2,
    bikeId: 102,
    customerId: 1,
    totalPrice: 1200,
    items: [
      { id: 3, price: 800, title: "New chain", quantity: 1, total: 800 },
      { id: 4, price: 200, title: "Cassette", quantity: 2, total: 400 },
    ],
    createdAt: new Date("2026-04-25T11:30:00"),
    intakeDate: new Date("2026-04-25T11:30:00"),
    complete: false,
    paymentReceived: false,
  },
  {
    id: 3,
    bikeId: 103,
    customerId: 2,
    totalPrice: 450,
    note: "Flat tire — customer waiting",
    items: [
      { id: 5, price: 120, title: "Inner tube", quantity: 1, total: 120 },
      { id: 6, price: 330, title: "Labor", quantity: 1, total: 330 },
    ],
    createdAt: new Date("2026-04-27T14:15:00"),
    intakeDate: new Date("2026-04-27T14:15:00"),
    deliveryDate: new Date("2026-04-27T16:00:00"),
    complete: true,
    paymentReceived: false,
  },
  {
    id: 4,
    bikeId: 104,
    customerId: 3,
    totalPrice: 2400,
    items: [
      { id: 7, price: 1800, title: "Wheel build", quantity: 1, total: 1800 },
      { id: 8, price: 300, title: "Spokes", quantity: 2, total: 600 },
    ],
    createdAt: new Date("2026-04-28T08:00:00"),
    intakeDate: new Date("2026-04-28T08:00:00"),
    complete: false,
    paymentReceived: false,
  },
];