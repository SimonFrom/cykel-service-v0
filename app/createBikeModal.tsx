import { Controller, useForm } from 'react-hook-form';
import { Bike, BikeTypes, bikeTypes } from '@/types/bike';
import { createBike } from '@/crud/bikes';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Label } from '@/components/ui/stock components/label';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';
import { useCustomerStore } from '@/store/customerStore';
import { TriggerRef } from '@rn-primitives/select';
import React, { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/stock components/select';
import { Button } from '@/components/ui/stock components/button';
import { useBikeStore } from '@/store/bikeStore';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/stock components/icon';
import { CircleArrowLeft } from 'lucide-react-native';


type FormData = Bike;

export default function CreateBikeModal({ onSuccess }: { onSuccess?: () => void }) {
  const customerId = useCustomerStore((s) => s.selectedCustomer?.id);
  const customer = useCustomerStore((s) => s.selectedCustomer);
  const updateBikeInStore = useBikeStore((s) => s.updateBikeInStore);

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
      make: '',
      model: '',
      colour: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log('onSubmit called', { customerId, data });
    if (!customerId) {
      console.log('early return: no customerId');
      return;
    }
    try {
      data.customerId = customerId;
      console.log('inserting bike:', data);
      await createBike(data);
      updateBikeInStore(data);
      reset();
      onSuccess?.();
      router.back();
    } catch (e) {
      console.error('onSubmit error:', JSON.stringify(e, null, 2));
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <ScrollView contentContainerStyle={styles.container}>
          <View className={'flex-row-reverse items-center gap-2'}>
            <Button
              className={'justify-self-end'}
              variant={'destructive'}
              onPress={() => router.back()}>
              <Icon as={CircleArrowLeft} className="text-primary-foreground" />
            </Button>
          </View>
          {/* Make */}
          <View style={styles.field}>
            <Label nativeID="make">Mærke</Label>
            <Controller
              control={control}
              name="make"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="make"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="make"
                />
              )}
            />
            {errors.make && <Text style={styles.error}>{errors.make.message}</Text>}
          </View>

          {/* Model */}
          <View style={styles.field}>
            <Label nativeID="model">Model</Label>
            <Controller
              control={control}
              name="model"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="model"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="model"
                />
              )}
            />
            {errors.model && <Text style={styles.error}>{errors.model.message}</Text>}
          </View>

          {/* Colour */}
          <View style={styles.field}>
            <Label nativeID="colour">Farve</Label>
            <Controller
              control={control}
              name="colour"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="colour"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="colour"
                />
              )}
            />
            {errors.colour && <Text style={styles.error}>{errors.colour.message}</Text>}
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Label nativeID="type">Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <Select
                  value={{ value, label: bikeTypes.find((t) => t.value === value)?.label ?? '' }}
                  onValueChange={(option) => onChange(option?.value)}>
                  <SelectTrigger ref={ref} className="w-[180px]">
                    <SelectValue placeholder="Vælg en cykel type" />
                  </SelectTrigger>
                  <SelectContent insets={contentInsets} className="w-[180px]">
                    <SelectGroup>
                      <SelectLabel>Cykel typer</SelectLabel>
                      {bikeTypes.map((bikeType) => (
                        <SelectItem
                          key={bikeType.value}
                          label={bikeType.label}
                          value={bikeType.value}>
                          {bikeType.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <Text style={styles.error}>{errors.type.message}</Text>}
          </View>
          <Button style={{ backgroundColor: 'hsl(160 60% 45%)' }} onPress={handleSubmit(onSubmit)}>
            <Text>Gem</Text>
          </Button>
        </ScrollView>
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
  },
  error: {
    fontSize: 12,
    color: '#E24B4A',
  },
  modal: {
    width: '90%',
    maxWidth: 500,
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
