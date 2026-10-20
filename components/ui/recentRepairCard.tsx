import { Text } from '@/components/ui/stock components/text';
import { Button } from '@/components/ui/stock components/button';
import { useRouter } from 'expo-router';
import { Repair } from '@/types/repair';
import { useBikeStore } from '@/store/bikeStore';
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
  const setSelectedBike = useBikeStore((s) => s.setSelectedBike);
  const canNavigate = !!customer && !!bike;

  const handlePress = () => {
    if (!customer || !bike) return;
    setSelectedBike(bike);
    router.push({
      pathname: '/customers/[id]/[bikeId]',
      params: { id: String(customer.id), bikeId: String(bike.id) },
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
          <Text className="text-md font-mono font-semibold">Pris: {repair.totalPrice} kr.</Text>
        </CardContent>
        <CardFooter className="flex-start flex gap-1">
          <Button onPress={handlePress} disabled={!canNavigate}>
            <Text>Vis</Text>
          </Button>
        </CardFooter>
      </Card>
    </Pressable>
  );
}
