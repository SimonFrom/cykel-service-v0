import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/deleteConfirmation';
import { Button } from '@/components/ui/stock components/button';
import { Card } from '@/components/ui/stock components/card';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { BikeRepairSummary } from '@/lib/repairSort';
import { Bike, bikeTypes } from '@/types/bike';
import { Bike as BikeIcon, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

type BikeCardProps = {
  bike: Bike;
  summary: BikeRepairSummary;
  onCreateRepair: (bike: Bike) => void;
  onEdit: (bike: Bike) => void;
  onDelete: (bike: Bike) => void | Promise<void>;
};

// One of the customer's bikes: type, colour, repair counts and actions.
export function BikeCard({ bike, summary, onCreateRepair, onEdit, onDelete }: BikeCardProps) {
  const name = `${bike.make} ${bike.model}`.trim() || 'Unavngivet cykel';
  const typeLabel = bikeTypes.find((t) => t.value === bike.type)?.label;

  return (
    <Card className="gap-4 px-4 py-4">
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-primary/15">
          <Icon as={BikeIcon} size={18} className="text-primary" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-semibold" numberOfLines={1}>
            {name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            {typeLabel ? (
              <Badge variant="secondary">
                <Text>{typeLabel}</Text>
              </Badge>
            ) : null}
            {bike.colour ? <Text variant="muted">{bike.colour}</Text> : null}
          </View>
        </View>
        <DeleteConfirmationDialog
          title="Er du sikker?"
          content={`Vil du virkelig slette ${name}?`}
          onConfirm={() => onDelete(bike)}
          trigger={
            <Button variant="ghost" size="icon" accessibilityLabel={`Slet ${name}`}>
              <Icon
                as={Trash2}
                size={16}
                className="text-muted-foreground web:group-hover:text-destructive"
              />
            </Button>
          }
        />
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Text variant="muted">
          {summary.total} {summary.total === 1 ? 'reparation' : 'reparationer'}
        </Text>
        {summary.open > 0 ? (
          <Text className="text-sm font-medium text-destructive">{summary.open} åben</Text>
        ) : null}
        {summary.lastIntake ? (
          <Text variant="muted">Senest: {summary.lastIntake.toLocaleDateString('da-DK')}</Text>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" onPress={() => onCreateRepair(bike)}>
          <Icon as={Plus} size={14} className="text-primary-foreground" />
          <Text>Opret reparation</Text>
        </Button>
        <Button size="sm" variant="outline" onPress={() => onEdit(bike)}>
          <Icon as={Pencil} size={14} />
          <Text>Rediger</Text>
        </Button>
      </View>
    </Card>
  );
}
