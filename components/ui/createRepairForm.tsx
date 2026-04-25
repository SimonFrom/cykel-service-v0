import { Repair } from '@/types/repair';
import { RepairItem } from '@/types/repairItems';
import { useCustomerStore} from '@/store/customerStore';
import { useBikeStore} from '@/store/bikeStore';
import { useRef, useState } from 'react';
import { TriggerRef } from '@rn-primitives/select';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Label } from '@/components/ui/stock components/label';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';


type FormData = Repair
export default function CreateRepairForm({ 
                                           onSuccess, repair }: 
                                         { 
                                           onSuccess?: () => void; repair?: Repair} 
) {
  // Select props
  const ref = useRef<TriggerRef>(null);
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
    left: 12,
    right: 12,
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      id: repair?.id ?? 0,
      customerId: repair?.customerId ?? 0,
      bikeId: repair?.bikeId ?? 0,
      note: repair?.note ?? [],
      createdAt: repair?.createdAt ?? new Date(),
      intakeDate: repair?.intakeDate ?? new Date(),
      deliveryDate: repair?.deliveryDate ?? new Date(),
    },
  });


  
  
  const customer = useCustomerStore((s) => s.selectedCustomer);
  const bike = useBikeStore((s) => s.selectedBike);
  const [selected, setSelected] = useState<DateType>();

  
  return (
    <View>
      {/* id */}
      <View style={styles.field}>
        <Label nativeID="id">Reperations nr:</Label>
        <Controller
          control={control}
          name="id"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              id="id"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value.toString()}
              aria-labelledby="id"
            />
          )}
        />
        {errors.id && <Text style={styles.error}>{errors.id.message}</Text>}
      </View>
      {/* createdAt */}
      <View style={styles.field}>
        <Label nativeID="createdAt">Oprettelses dato:</Label>
        <Controller
          control={control}
          name="createdAt"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              id="createdAt"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value.toString()}
              aria-labelledby="createdAt"
              textContentType="dateTime"
            />
          )}
        />
        {errors.createdAt && <Text style={styles.error}>{errors.createdAt.message}</Text>}
      </View>

      {/*TODO Figure out a date picker*/}
      {/*/!* intakeDate *!/*/}
      {/*<View style={styles.field}>*/}
      {/*  <Label nativeID="intakeDate">Modtagelse dato:</Label>*/}
      {/*  <Controller*/}
      {/*    control={control}*/}
      {/*    name="intakeDate"*/}
      {/*    render={({ field: { onChange, onBlur, value } }) => (*/}
      {/*      */}
      {/*    )}*/}
      {/*  />*/}
      {/*  {errors.intakeDate && <Text style={styles.error}>{errors.intakeDate.message}</Text>}*/}
      {/*</View>*/}

      {/*/!* deliveryDate *!/*/}
      {/*<View style={styles.field}>*/}
      {/*  <Label nativeID="deliveryDate">Færdig dato:</Label>*/}
      {/*  <Controller*/}
      {/*    control={control}*/}
      {/*    name="deliveryDate"*/}
      {/*    render={({ field: { onChange, onBlur, value } }) => (*/}
      {/*      */}
      {/*    )}*/}
      {/*  />*/}
      {/*  {errors.deliveryDate && <Text style={styles.error}>{errors.deliveryDate.message}</Text>}*/}
      {/*</View>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  field: {
    gap: 4,
  },
  error: {
    fontSize: 12,
    color: '#E24B4A',
  },
});