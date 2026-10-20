import { Repair } from '@/types/repair';
import { createRepair, updateRepair } from '@/crud/repairs';
import { RepairLinesSection } from '@/components/ui/RepairLinesSection';
import { useCustomerStore } from '@/store/customerStore';
import { useBikeStore } from '@/store/bikeStore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TriggerRef } from '@rn-primitives/select';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { Label } from '@/components/ui/stock components/label';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';
import { DateSelect } from '@/components/dateSelect';
import { Button } from '@/components/ui/stock components/button';
import { CircleAlert, CircleArrowLeft } from 'lucide-react-native';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/stock components/alert';
import { ERROR_TEXT_COLOR } from '@/components/ui/DiscountInput';
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
    trigger,
    formState: { errors },
  } = useForm<Repair>({
    defaultValues: {
      id: repair?.id ?? 0,
      note: repair?.note ?? '',
      createdAt: repair?.createdAt ?? new Date(),
      intakeDate: repair?.intakeDate ?? new Date(),
      deliveryDate: repair?.deliveryDate ?? new Date(),
      complete: repair?.complete ?? false,
      items: repair?.items ?? [],
      discount: repair?.discount ?? null,
      paymentReceived: repair?.paymentReceived ?? false,
      customerContacted: repair?.customerContacted ?? false,
    },
  });

  useEffect(() => {
    reset({
      id: repair?.id ?? 0,
      note: repair?.note ?? '',
      createdAt: repair?.createdAt ? new Date(repair.createdAt) : new Date(),
      intakeDate: repair?.intakeDate ? new Date(repair.intakeDate) : new Date(),
      deliveryDate: repair?.deliveryDate ? new Date(repair.deliveryDate) : new Date(),
      complete: repair?.complete ?? false,
      items: repair?.items ?? [],
      discount: repair?.discount ?? null,
      paymentReceived: repair?.paymentReceived ?? false,
      customerContacted: repair?.customerContacted ?? false,
    });
  }, [repair, reset]);



  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const { width } = useWindowDimensions();
  const narrow = width < 768;

  const [checkedComplete, setCheckedComplete] = useState(repair?.complete ?? false);
  const [checkedPayment, setCheckedPayment] = useState(repair?.paymentReceived ?? false);

  // Closes the modal only on success. On failure the form keeps all values (SR-11, SR-12).
  const onSubmit = async (data: Repair) => {
    if (!customer?.id || !bike?.id) {
      console.error('Missing customer or bike');
      setSaveError(true);
      return;
    }
    setSaveError(false);
    setIsSaving(true);
    try {
      if (data.id === 0) {
        await createRepair({ ...data, customerId: customer.id, bikeId: bike.id });
      } else {
        await updateRepair(data.id, data);
      }
    } catch (error) {
      console.error(error);
      setSaveError(true);
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    reset();
    onSuccess?.();
    router.back();
  };


  const handleBack = () => {
    setSelectedRepairInStore(null)
    router.back();
  }


  const submitButton = (
    <Button className="mt-2 w-28" onPress={handleSubmit(onSubmit)} disabled={isSaving}>
      <Text>{isSaving ? 'Gemmer…' : repair && repair.id !== 0 ? 'Opdater' : 'Opret'}</Text>
    </Button>
  );

  return (
    <View style={styles.overlay}>
      <ScrollView style={styles.modal} contentContainerStyle={{ padding: 10 }}>
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
            render={({ field: { onBlur, value, onChange } }) => (
              <Switch
                id="complete"
                onBlur={onBlur}
                checked={value ?? false}
                onCheckedChange={(checked) => {onChange(checked)}}
                aria-labelledby="complete"
              />
            )}
          />
          <Label nativeID="paymentReceived">Betalt:</Label>
          <Controller
            control={control}
            name="paymentReceived"
            render={({ field: { onBlur, value, onChange } }) => (
              <Switch
                id="paymentReceived"
                onBlur={onBlur}
                checked={value ?? false}
                onCheckedChange={(checked) => {onChange(checked)}}
                aria-labelledby="paymentReceived"
              />
            )}
          />
          <Label nativeID="customerContacted">Kunde kontaktet:</Label>
          <Controller
            control={control}
            name="customerContacted"
            render={({ field: { onBlur, value, onChange } }) => (
              <Switch
                id="customerContacted"
                onBlur={onBlur}
                checked={value ?? false}
                onCheckedChange={(checked) => {onChange(checked)}}
                aria-labelledby="customerContacted"
              />
            )}
          />
          {errors.paymentReceived && (
            <Text style={styles.error}>{errors.paymentReceived.message}</Text>
          )}
        </View>
        <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 8, alignItems: 'flex-start' }}>
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
                defaultValue={new Date()}
                render={({ field: { onChange, onBlur, value } }) => (
                  <DateSelect
                    value={value ?? new Date()}
                    onValueChange={onChange}
                    
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
                defaultValue={new Date()}
                render={({ field: { onChange, onBlur, value } }) => (
                  <DateSelect
                    value={value ?? new Date()}
                    onValueChange={onChange}
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
                defaultValue={new Date()}
                render={({ field: { onChange, onBlur, value } }) => (
                  <DateSelect
                    value={value ?? new Date()}
                    onValueChange={onChange}
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
            {!narrow && submitButton}
          </View>
          <View style={{ flex: 1, alignSelf: 'stretch' }}>
            {saveError && (
              <Alert variant="destructive" icon={CircleAlert} className="mb-2">
                <AlertTitle>Reparationen kunne ikke gemmes</AlertTitle>
                <AlertDescription>Prøv igen. Dine ændringer er ikke tabt.</AlertDescription>
              </Alert>
            )}
            <RepairLinesSection control={control} trigger={trigger} disabled={isSaving} />
            {narrow && submitButton}
          </View>
        </View>
      </ScrollView>
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
    color: ERROR_TEXT_COLOR,
  },
  modal: {
    width: '90%',
    maxWidth: 1500,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
