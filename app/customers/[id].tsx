import { View, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCustomerStore } from '@/store/customerStore';
import { updateCustomer} from '@/crud/customers';
import { Customer } from '@/types/customer';

type FormData = Customer;

export default function CustomerScreen({ onSuccess }: { onSuccess?: () => void }) {
  const customer = useCustomerStore((s) => s.selectedCustomer);

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

  const onSubmit = async (data: FormData) => {
    try {
      await updateCustomer(data.id, data);
      reset();
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
