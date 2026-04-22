import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { createCustomer } from '@/crud/customers';
import { Customer } from '@/types/customer';
import { useCustomerStore } from '@/store/customerStore';
import { router } from 'expo-router';

type FormData = Omit<Customer, 'id'>;

export default function CreateCustomerModal({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const updateCustomerInStore = useCustomerStore((s) => s.updateCustomerInStore);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Customer>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      club: '',
    },
  });

  const onSubmit = async (data: Customer) => {
    try {
      setIsLoading(true);
      await createCustomer(data);
      updateCustomerInStore(data);
      reset();
      onSuccess?.();
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* First Name */}
          <View style={styles.field}>
            <Label nativeID="firstName">Fornavn</Label>
            <Controller
              control={control}
              name="firstName"
              rules={{ required: 'Fornavn er påkrævet' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="firstName"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="firstName"
                />
              )}
            />
            {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}
          </View>

          {/* Last Name */}
          <View style={styles.field}>
            <Label nativeID="lastName">Efternavn</Label>
            <Controller
              control={control}
              name="lastName"
              rules={{ required: 'Efternavn er påkrævet' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="lastName"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="lastName"
                />
              )}
            />
            {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Label nativeID="email">Email</Label>
            <Controller
              control={control}
              name="email"
              // Rules for email pattern
              // rules={{
              //   required: 'Email er påkrævet',
              //   pattern: {
              //     value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              //     message: 'Ugyldig email',
              //   },
              // }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="email"
                />
              )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Label nativeID="phoneNumber">Telefonnummer</Label>
            <Controller
              control={control}
              name="phoneNumber"
              // rules={{ required: 'Telefonnummer er påkrævet' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="phoneNumber"
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="phoneNumber"
                />
              )}
            />
            {errors.phoneNumber && <Text style={styles.error}>{errors.phoneNumber.message}</Text>}
          </View>

          {/* Club (optional) */}
          <View style={styles.field}>
            <Label nativeID="club">Klub (valgfri)</Label>
            <Controller
              control={control}
              name="club"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  id="club"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  aria-labelledby="club"
                />
              )}
            />
          </View>

          <Button onPress={handleSubmit(onSubmit)} disabled={isLoading}>
            <Text>{isLoading ? 'Opretter...' : 'Opret kunde'}</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
