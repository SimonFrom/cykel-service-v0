import { View, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCustomerStore } from '@/store/customerStore';
import { getCustomers, updateCustomer } from '@/crud/customers';
import { getBikes } from '@/crud/bikes';
import { Customer } from '@/types/customer';
import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import * as React from 'react';
import { Bike } from '@/types/bike';


type FormData = Customer;

export default function CustomerScreen({ onSuccess }: { onSuccess?: () => void }) {
  const customer = useCustomerStore((s) => s.selectedCustomer);
  const updateCustomerInStore = useCustomerStore((s) => s.updateCustomerInStore);
  const setCustomer = useCustomerStore((s) => s.updateCustomerInStore);

  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      id: customer?.id ?? 0,
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
      email: customer?.email ?? '',
      phoneNumber: customer?.phoneNumber ?? '',
      club: customer?.club ?? '',
      note: customer?.note ?? '',
    },
  });

  const fetchBikes = async () => {
    const bikes = await getBikes(customer?.id ?? 0);
  };

  const [bikes, setBikes] = React.useState<Bike[]>([]);

  useEffect(() => {
    fetchBikes()
  }, [])

  const onSubmit = async (data: FormData) => {
    try {
      await updateCustomer(data.id, data);
      updateCustomerInStore(data);
      reset();
      router.back();
      onSuccess?.();
    } catch (e) {
      console.error(e);
    }
  };

  if (!customer) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <View style={{ flex: 1, gap: 16, padding: 16 }}>
          <View style={styles.field}>
            <Label nativeID="firstName">Fornavn</Label>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, value } }) => (
                <Input aria-labelledby="firstName" onChangeText={onChange} value={value} />
              )}
            />
          </View>

          <View style={styles.field}>
            <Label nativeID="lastName">Efternavn</Label>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, value } }) => (
                <Input aria-labelledby="lastName" onChangeText={onChange} value={value} />
              )}
            />
          </View>

          <View style={styles.field}>
            <Label nativeID="phoneNumber">Telefon</Label>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, value } }) => (
                <Input aria-labelledby="phoneNumber" onChangeText={onChange} value={value} />
              )}
            />
          </View>

          <View style={styles.field}>
            <Label nativeID="email">Email</Label>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input aria-labelledby="email" onChangeText={onChange} value={value} />
              )}
            />
          </View>
          {customer.club && (
            <View style={styles.field}>
              <Label nativeID="club">Klub</Label>
              <Controller
                control={control}
                name="club"
                render={({ field: { onChange, value } }) => (
                  <Input aria-labelledby="club" onChangeText={onChange} value={value ?? ''} />
                )}
              />
            </View>
          )}
          <View style={styles.field}>
            <Label nativeID="note">Noter</Label>
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, value } }) => (
                <Textarea aria-labelledby="note" onChangeText={onChange} value={value ?? ''} />
              )}
            />
          </View>


          <Button className="w-3/12" onPress={handleSubmit(onSubmit)}>
            <Text>Gem</Text>
          </Button>
        </View>


        <View style={{ flex: 1, gap: 16, padding: 16 }}>
          <Text>Reparationer:</Text>
        </View>
      </View>
      <View>
        <Text>Cykler:</Text>
        <Link href={{
          pathname: "/customers/createBike"}} push asChild>
        <Button className="mr-5 w-28" onPress={() => setCustomer(customer)}>
          <Text>Opret cykel</Text>
        </Button>
      </Link>
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
    width: '60%',
  },
  error: {
    fontSize: 12,
    color: '#E24B4A',
  },
});
