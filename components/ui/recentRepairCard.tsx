import { Text } from '@/components/ui/stock components/text';
import { Button } from '@/components/ui/stock components/button';
import { useCustomerStore } from '@/store/customerStore';
import { useRouter } from 'expo-router';
import { Repair } from '@/types/repair';
import { useBikeStore } from '@/store/bikeStore';
import { Customer } from '@/types/customer';
import { Bike } from '@/types/bike';
import { Card, CardDescription, CardTitle, CardContent, CardHeader, CardFooter } from '@/components/ui/stock components/card';
import { Pressable } from 'react-native';

export default function RecentRepairCard({ repair, customer, bike }: { repair: Repair, customer?: Customer, bike?: Bike }) {

  const setSelectedBike = useBikeStore((s) => s.setSelectedBike);

  const handlePress = (bike: Bike) => {
      setSelectedBike(bike);
      router.push({
        pathname: '/customers/[id]/[bikeId]',
        params: { id: String(customer?.id), bikeId: String(bike.id) },
      });
    };
  

  const router = useRouter();
  return (
    <Button onPress={() => handlePress(bike!)} className="w-72 h-80">
    <Card className="w-72 h-80">
      <CardHeader>
        <Text className="text-lg text-muted-foreground font-mono">Reperation nr: {repair.id}</Text>
        <Text className="text-muted-foreground font-mono">Indleveret: {repair.intakeDate.toLocaleDateString()}</Text>
      </CardHeader>
      <CardDescription>
        <Text className="ml-5 text-md font-semibold font-mono">Kunde: {customer?.firstName} {customer?.lastName}</Text>
      </CardDescription>
      <Text className="ml-5 text-md font-muted-foreground font-mono">Cykel: {bike?.make} {bike?.model}</Text>
      <CardContent>
      <Text className="text-md font-semibold font-mono">Note: {repair.note}</Text>
      <Text className="text-md font-semibold font-mono">Pris: {repair.totalPrice} kr.</Text>
      </CardContent>
      <CardFooter className="flex flex-start gap-1">
        <Button className="" onPress={() => handlePress(bike!)}>
            <Text>Vis</Text>
        </Button>
      </CardFooter>
    </Card>
    </Button>
  );
}
