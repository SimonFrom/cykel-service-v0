import { Repair, mockRepairs } from '@/types/repair';
import { createRepair, updateRepair } from '@/crud/repairs';
import { RepairLinesSection } from '@/components/ui/RepairLinesSection';
import { useCustomerStore } from '@/store/customerStore';
import { useBikeStore } from '@/store/bikeStore';
import React, { useCallback, useRef, useState } from 'react';
import { TriggerRef } from '@rn-primitives/select';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StyleSheet, View } from 'react-native';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { Label } from '@/components/ui/stock components/label';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';
import { DateSelect } from '@/components/dateSelect';
import { Button } from '@/components/ui/stock components/button';
import { CircleArrowLeft } from 'lucide-react-native';
import { Icon } from '@/components/ui/stock components/icon';
import { router } from 'expo-router';
import { Switch } from '@/components/ui/stock components/switch';
import { Textarea } from '@/components/ui/stock components/textarea';
import { useRepairStore } from '@/store/repairStore';

type FormData = Repair;
export default function CreateRepairForm({
  onSuccess,
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
  const customer = useCustomerStore((s) => s.selectedCustomer);
  const bike = useBikeStore((s) => s.selectedBike);
  const repair = useRepairStore((s) => s.selectedRepair);
  const setSelectedRepairInStore = useRepairStore((s) => s.setSelectedRepair);
  const updateRepairInStore = useRepairStore((s) => s.updateRepairInStore)

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Repair>({
    defaultValues: {
      id: repair?.id ?? 0,
      note: repair?.note ?? '',
      createdAt: repair?.createdAt ?? new Date(),
      intakeDate: repair?.intakeDate ?? new Date(),
      deliveryDate: repair?.deliveryDate ?? new Date(),
      complete: repair?.complete ?? false,
      items: repair?.items ?? []
    },
  });



  const [checkedComplete, setCheckedComplete] = useState(false);
  const [checkedPayment, setCheckedPayment] = useState(false);

  const onSubmit = async (data: Repair) => {
    if (!customer?.id || !bike?.id) {
      console.error('Missing customer or bike');
      return;
    }
    if (data.id == 0) {
      try {
        await createRepair({
          ...data,
          customerId: customer.id,
          bikeId: bike.id,
        });

      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        // TODO
        await updateRepair(repair?.id, repair);
      } catch (error) {
        console.error(error);
      } finally {
        reset();
        onSuccess?.();
        router.back();
      }
    }
  };


  const handleBack = () => {
    setSelectedRepairInStore(null)
    router.back();
  }


  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View className={'flex-row-reverse items-center gap-2'}>
          <Button
            className={'justify-self-end'}
            variant={'destructive'}
            onPress={() => handleBack()}>
            <Icon as={CircleArrowLeft} className="text-primary-foreground" />
          </Button>
        </View>
        <View className={'mb-1 flex-row items-center gap-2'}>
          <Label nativeID="complete">Færdig:</Label>
          <Controller
            control={control}
            name="complete"
            render={({ field: { onBlur } }) => (
              <Switch
                id="complete"
                onBlur={onBlur}
                checked={checkedComplete}
                onCheckedChange={setCheckedComplete}
                aria-labelledby="complete"
              />
            )}
          />
          <Label nativeID="paymentReceived">Betalt:</Label>
          <Controller
            control={control}
            name="paymentReceived"
            render={({ field: { onBlur } }) => (
              <Switch
                id="paymentReceived"
                onBlur={onBlur}
                checked={checkedPayment}
                onCheckedChange={setCheckedPayment}
                aria-labelledby="paymentReceived"
              />
            )}
          />
          {errors.paymentReceived && (
            <Text style={styles.error}>{errors.paymentReceived.message}</Text>
          )}
        </View>
        <View className={'flex-row items-center gap-2'}>
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
              {errors.deliveryDate && (
                <Text style={styles.error}>{errors.deliveryDate.message}</Text>
              )}
            </View>

            {/* note */}
            <View style={styles.field}>
              <Label nativeID="note">Note:</Label>
              <Controller
                control={control}
                name="note"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Textarea
                    value={value ?? ''}
                    onChangeText={onChange}
                    aria-labelledby="note"
                    placeholder="Skriv det du mener du uden tvivl kan huske her..."
                  />
                )}
              />
              {errors.note && <Text style={styles.error}>{errors.note.message}</Text>}
            </View>

            {/*TODO Add total price label in the table arangement*/}
            <Button className="mt-2 w-20" onPress={handleSubmit(onSubmit)}>
              <Text>Opret</Text>
            </Button>
          </View>
          <View className={'flex-row-reverse items-center gap-2'}>
            <RepairLinesSection control={control} />
          </View>
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
    maxWidth: 220,
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
    padding: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
