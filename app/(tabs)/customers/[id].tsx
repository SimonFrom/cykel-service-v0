import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCustomerStore } from '@/store/customerStore';
import { getCustomers, updateCustomer } from '@/crud/customers';
import { deleteBike, getBikes } from '@/crud/bikes';
import { Customer } from '@/types/customer';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import * as React from 'react';
import { useBikeStore } from '@/store/bikeStore';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { bikeTypes } from '@/types/bike';

type FormData = Customer;

export default function CustomerScreen({ onSuccess }: { onSuccess?: () => void }) {
  const customer = useCustomerStore((s) => s.selectedCustomer);
  const updateCustomerInStore = useCustomerStore((s) => s.updateCustomerInStore);
  const setCustomer = useCustomerStore((s) => s.updateCustomerInStore);

  const bikes = useBikeStore((s) => s.bikes);
  const setBikesInStore = useBikeStore((s) => s.setBikesInStore);
  const deleteBikeInStore = useBikeStore((s) => s.deleteBike);

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
    setBikesInStore(bikes);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBikes();
    }, [])
  );

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
        <Link
          href={{
            pathname: '/customers/createBike',
          }}
          push
          asChild>
          <Button className="mr-5 w-28" onPress={() => setCustomer(customer)}>
            <Text>Opret cykel</Text>
          </Button>
        </Link>
        {/*TODO View for list with height*/}
        <Animated.FlatList
          data={bikes}
          itemLayoutAnimation={LinearTransition}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={true}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>
                  {item.make} {item.model}
                </Text>
                <Text style={styles.email}>
                  {bikeTypes.find((t) => t.value === item.type)?.label}
                </Text>
                <Text style={styles.phone}>{item.colour}</Text>
              </View>
              <Button>
                <Text>Vis</Text>
              </Button>
              <Button
                variant={'destructive'}
                onPress={async () => {
                  await deleteBike(item.id);
                  deleteBikeInStore(item.id);
                }}>
                <Text>Slet</Text>
              </Button>
            </View>
          )}
        />
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
  list: {
    padding: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'orange',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
  },
  email: {
    fontSize: 13,
    color: '#888',
    marginTop: 1,
  },
  phone: {
    fontSize: 13,
    color: '#888',
  },
});
