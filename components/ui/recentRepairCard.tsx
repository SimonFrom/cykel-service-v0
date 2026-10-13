import { View } from 'react-native';
import { Text } from '@/components/ui/stock components/text';
import { Button } from '@/components/ui/stock components/button';
import { useCustomerStore } from '@/store/customerStore';
import { Repair } from '@/types/repair';
import { useBikeStore } from '@/store/bikeStore';
import { Card, CardDescription, CardTitle, CardContent, CardHeader, CardFooter } from '@/components/ui/stock components/card';

export default function RecentRepairCard({ repair }: { repair: Repair }) {


  return (
    <Card>
      <CardHeader>
        <Text className="text-lg text-muted-foreground font-mono">Reperation nr: {repair.id}</Text>
        <Text className="text-muted-foreground font-mono">Indleveret: {repair.intakeDate.toLocaleDateString()}</Text>
      </CardHeader>
      <CardContent>
      <Text className="text-base font-semibold font-mono">Kunde: {repair.customer?.firstName} {repair.customer?.lastName}</Text>
      <Text className="text-base font-semibold font-mono">Cykel: {repair.bike?.make} {repair.bike?.model}</Text>
      <Text className="text-base font-semibold font-mono">Note: {repair.note}</Text>
      <Text className="text-base font-semibold font-mono">Pris: {repair.totalPrice} kr.</Text>
      </CardContent>
      <CardFooter className="flex flex-start gap-1">
        <Button className="" onPress={() => { /* Handle button press */ }}>
            <Text>Vis</Text>
        </Button>
      </CardFooter>
    </Card>
  );
}
