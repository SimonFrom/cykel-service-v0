import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/deleteConfirmation';
import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { cn } from '@/lib/utils';
import { Bike } from '@/types/bike';
import { Repair } from '@/types/repair';
import { ChevronRight, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type RepairCardProps = {
  repair: Repair;
  bike?: Bike;
  isLast?: boolean;
  onPress: (repair: Repair) => void;
  onDelete: (repair: Repair) => void | Promise<void>;
};

// One row in the customer's repair list: number, bike, dates, status badges and total.
export function RepairCard({ repair, bike, isLast, onPress, onDelete }: RepairCardProps) {
  return (
    <Pressable
      onPress={() => onPress(repair)}
      className={cn(
        'flex-row items-center gap-4 px-4 py-3 active:bg-muted web:transition-colors web:hover:bg-muted/60',
        !isLast && 'border-b border-border'
      )}>
      <View className="min-w-0 flex-1 gap-1.5">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-semibold">Nr. {repair.id}</Text>
          <Text variant="muted" numberOfLines={1}>
            {bike ? `${bike.make} ${bike.model}` : 'Ukendt cykel'}
          </Text>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge variant={repair.complete ? 'default' : 'destructive'}>
            <Text>{repair.complete ? 'Udleveret' : 'Ikke udleveret'}</Text>
          </Badge>
          <Badge variant={repair.paymentReceived ? 'default' : 'destructive'}>
            <Text>{repair.paymentReceived ? 'Betalt' : 'Ikke betalt'}</Text>
          </Badge>
          {repair.missingItems ? (
            <Badge variant="outline">
              <Text>Mangler dele</Text>
            </Badge>
          ) : null}
        </View>
        {repair.note ? (
          <Text variant="muted" numberOfLines={1}>
            {repair.note}
          </Text>
        ) : null}
      </View>

      <View className="items-end gap-1">
        <Text className="font-semibold">{repair.totalPrice.toFixed(2)} kr</Text>
        <Text variant="muted">Indleveret {repair.intakeDate.toLocaleDateString('da-DK')}</Text>
      </View>

      <View className="flex-row items-center gap-1">
        <DeleteConfirmationDialog
          title="Er du sikker?"
          content={`Vil du virkelig slette reparation nr. ${repair.id}?`}
          onConfirm={() => onDelete(repair)}
          trigger={
            <Button variant="ghost" size="icon" accessibilityLabel={`Slet reparation ${repair.id}`}>
              <Icon as={Trash2} size={16} className="text-muted-foreground" />
            </Button>
          }
        />
        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
      </View>
    </Pressable>
  );
}
