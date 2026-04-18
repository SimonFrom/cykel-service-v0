import { Controller, useForm } from 'react-hook-form';
import { Bike, bikeTypes } from '@/types/bike';
import { createBike } from '@/crud/bikes';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams } from 'expo-router';



type FormData = Bike;

export function CreateBikeForm({ onSuccess }: { onSuccess?: () => void }) {
  // TODO

  let bikeId = "";
  bikeId = useLocalSearchParams(bikeId);
  const customerId = useLocalSearchParams(customerId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      id: parseInt(bikeId),
      customerId: 0,
      make: '',
      model: '',
      colour: '',
      type: bikeTypes.city
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      
      await createBike(data);
      reset();
      onSuccess?.();
    } catch (e) {
      console.error(e);
    } finally {
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ID */}
      <View style={styles.field}>
        <Label nativeID="id">ID</Label>
        <Controller
          control={control}
          name="id"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              id="id"
              onBlur={onBlur}
              onChangeText={onChange}
              value={String(value)}
              aria-labelledby="id"
            />
          )}
        />
        {errors.id && <Text style={styles.error}>{errors.id.message}</Text>}
      </View>

      {/* Customer ID */}
      <View style={styles.field}>
        <Label nativeID="customerId">Kunde ID</Label>
        <Controller
          control={control}
          name="customerId"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              id="customerId"
              onBlur={onBlur}
              onChangeText={onChange}
              value={String(value)}
              aria-labelledby="customerId"
            />
          )}
        />
        {errors.customerId && <Text style={styles.error}>{errors.customerId.message}</Text>}
      </View>
    </ScrollView>
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