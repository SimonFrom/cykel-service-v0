import { Repair } from '@/types/repair';
import { RepairItem } from '@/types/repairItems';
import { useCustomerStore } from '@/store/customerStore';
import { useBikeStore } from '@/store/bikeStore';
import React, { useRef, useState } from 'react';
import { TriggerRef } from '@rn-primitives/select';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Label } from '@/components/ui/stock components/label';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';
import { DateSelect } from '@/components/dateSelect';
import { Button } from '@/components/ui/stock components/button';
import {CircleArrowLeft} from 'lucide-react-native';
import { Icon } from '@/components/ui/stock components/icon';
import { router } from 'expo-router';
import { Switch } from '@/components/ui/stock components/switch';

type FormData = Repair;
export default function CreateRepairForm({
  onSuccess,
  repair,
}: {
  onSuccess?: () => void;
  repair?: Repair;
}) {
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
      complete: repair?.complete ?? false
    },
  });

  const customer = useCustomerStore((s) => s.selectedCustomer);
  const bike = useBikeStore((s) => s.selectedBike);
  const [checked, setChecked] = useState(false);

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View className={'flex-row-reverse items-center gap-2'}>
          <Button className={'justify-self-end'} variant={'destructive'} onPress={() => router.back()}>
            <Icon as={CircleArrowLeft} className="text-primary-foreground" />
          </Button>
          <Button className={''} onPress={() => router.back()}>
            <Text>Tilføj linje</Text>
          </Button>
        </View>
        <View className={'mb-1 flex-row items-center gap-2'}>
          {/*TODO Add payed and follow up switches*/}
          <Label nativeID="complete">Færdig:</Label>
          <Controller
            control={control}
            name="complete"
            render={({ field: { onBlur } }) => (
              <Switch
                id="complete"
                onBlur={onBlur}
                checked={checked}
                onCheckedChange={setChecked}
                aria-labelledby="complete"
              />
            )}
          />
          {errors.complete && <Text style={styles.error}>{errors.complete.message}</Text>}
        </View>

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
                  editable={false}
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
                <DateSelect
                  value={value}
                  onValueChange={onChange}
                  placeholder="Vælg afhentnings­dato"
                />
              )}
            />
            {errors.createdAt && <Text style={styles.error}>{errors.createdAt.message}</Text>}
          </View>
          {/* intakeDate */}
          <View style={styles.field}>
            <Label nativeID="intakeDate">Modtagelse dato:</Label>
            <Controller
              control={control}
              name="intakeDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <DateSelect
                  value={value}
                  onValueChange={onChange}
                  placeholder="Vælg afhentnings­dato"
                />
              )}
            />
            {errors.intakeDate && <Text style={styles.error}>{errors.intakeDate.message}</Text>}
          </View>

          {/* deliveryDate */}
          <View style={styles.field}>
            <Label nativeID="deliveryDate">Færdig dato:</Label>
            <Controller
              control={control}
              name="deliveryDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <DateSelect
                  value={value}
                  onValueChange={onChange}
                  placeholder="Vælg afhentnings­dato"
                />
              )}
            />
            {errors.deliveryDate && <Text style={styles.error}>{errors.deliveryDate.message}</Text>}
          </View>
          {/*TODO Add total price label, note textfield*/}
          <Button className="mt-2 w-20">
            <Text>Gem</Text>
          </Button>
        </View>
      </View>
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
    maxWidth: 220
  },
  error: {
    fontSize: 12,
    color: '#E24B4A',
  },
  modal: {
    width: '90%',
    maxWidth: 1500,
    maxHeight: 1500,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 10
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
