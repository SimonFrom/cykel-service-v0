import { Text } from '@/components/ui/stock components/text';
import { Button } from '@/components/ui/stock components/button';
import { useRouter } from 'expo-router';
import { Repair } from '@/types/repair';
import { useCustomerStore } from '@/store/customerStore';
import { useBikeStore } from '@/store/bikeStore';
import { useRepairStore } from '@/store/repairStore';
import { Customer } from '@/types/customer';
import { Bike } from '@/types/bike';
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/stock components/card';
import { Pressable } from 'react-native';

// Opens the customer page with this repair's modal on top.
// Navigation is disabled until the repair's customer and bike are loaded
export default function RecentRepairCard({
  repair,
  customer,
  bike,
}: {
  repair: Repair;
  customer?: Customer;
  bike?: Bike;
}) {
  const router = useRouter();
  const setSelectedCustomer = useCustomerStore((s) => s.setSelectedCustomer);
  const setSelectedBike = useBikeStore((s) => s.setSelectedBike);
  const setSelectedRepair = useRepairStore((s) => s.setSelectedRepair);
  const canNavigate = !!customer && !!bike;

  const handlePress = () => {
    if (!customer || !bike) return;
    setSelectedCustomer(customer);
    setSelectedBike(bike);
    setSelectedRepair(repair);
    router.push({
      pathname: '/customers/[id]',
      params: { id: String(customer.id), openRepair: '1' },
    });
  };

  return (
    <Pressable onPress={handlePress} disabled={!canNavigate} className="h-80 w-72">
      <Card className="h-80 w-72">
        <CardHeader>
          <Text className="font-mono text-lg text-muted-foreground">
            Reperation nr: {repair.id}
          </Text>
          <Text className="font-mono text-muted-foreground">
            Indleveret: {repair.intakeDate.toLocaleDateString()}
          </Text>
        </CardHeader>
        <CardDescription>
          <Text className="text-md ml-5 font-mono font-semibold">
            Kunde: {customer?.firstName} {customer?.lastName}
          </Text>
        </CardDescription>
        <Text className="text-md font-muted-foreground ml-5 font-mono">
          Cykel: {bike?.make} {bike?.model}
        </Text>
        <CardContent>
          <Text className="text-md font-mono font-semibold">Note: {repair.note}</Text>
          <Text className="text-md font-mono font-semibold">
            Pris: {repair.totalPrice.toFixed(2)} kr.
          </Text>
        </CardContent>
        {/* Visual only: the card handles the press, a second handler would navigate twice */}
        <CardFooter className="flex-start flex gap-1" pointerEvents="none">
          <Button disabled={!canNavigate}>
            <Text>Vis</Text>
          </Button>
        </CardFooter>
      </Card>
    </Pressable>
  );
}
