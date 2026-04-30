
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Control, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { Trash2 } from 'lucide-react-native';
import { Button } from '@/components/ui/stock components/button';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';
import { Icon } from '@/components/ui/stock components/icon';
import { Repair } from '@/types/repair';
import { RepairItem } from '@/types/repairItems';


type Props = {
  control: Control<Repair>;
};

export function RepairLinesSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({ control, name: 'items' });

  const grandTotal =
    watchedItems?.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    ) ?? 0;

  const handleAddLine = () => {
    append({
      id: Date.now(),
      title: '',
      price: 0,
      quantity: 1,
      total: 0,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Button onPress={handleAddLine}>
          <Text>Tilføj linje</Text>
        </Button>
      </View>

      {fields.length > 0 && (
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 3 }]}>Beskrivelse</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Antal</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Pris</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Total</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {fields.map((field, index) => {
        const price = Number(watchedItems?.[index]?.price) || 0;
        const qty = Number(watchedItems?.[index]?.quantity) || 0;
        const lineTotal = price * qty;

        return (
          <View key={field.id} style={styles.lineRow}>
            <View style={{ flex: 3, paddingRight: 8 }}>
              <Controller
                control={control}
                name={`items.${index}.title`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Titel"
                  />
                )}
              />
            </View>

            <View style={{ flex: 1, paddingRight: 8 }}>
              <Controller
                control={control}
                name={`items.${index}.quantity`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    onBlur={onBlur}
                    onChangeText={(t) => onChange(Number(t) || 0)}
                    value={value?.toString() ?? ''}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>

            <View style={{ flex: 1, paddingRight: 8 }}>
              <Controller
                control={control}
                name={`items.${index}.price`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    onBlur={onBlur}
                    onChangeText={(t) => onChange(Number(t) || 0)}
                    value={value?.toString() ?? ''}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text>{lineTotal.toFixed(2)}</Text>
            </View>

            <Button
              variant="destructive"
              size="sm"
              onPress={() => remove(index)}
              style={{ width: 40 }}>
              <Icon as={Trash2} className="text-primary-foreground" />
            </Button>
          </View>
        );
      })}

      {fields.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={{ fontWeight: '600' }}>I alt: {grandTotal.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 12,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
});
