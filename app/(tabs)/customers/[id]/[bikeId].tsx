import { useBikeStore } from '@/store/bikeStore';
import { useCustomerStore } from '@/store/customerStore';
import { CreateBikeForm } from '@/components/ui/createBikeForm';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { Text } from '@/components/ui/stock components/text';
import * as React from 'react';
import CreateRepairForm from '@/components/ui/createRepairForm';
import { Button } from '@/components/ui/stock components/button';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/stock components/icon';
import { CircleArrowLeft } from 'lucide-react-native';

export default function BikeInfoScreen() {
  const bike = useBikeStore((s) => s.selectedBike);
  const customer = useCustomerStore((s) => s.selectedCustomer);

  if (!bike) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View className={'flex-row-reverse items-center gap-2'}>
        <Button
          className={'justify-self-end'}
          variant={'destructive'}
          onPress={() => router.push('/customers/${customer.id}')}>
          <Icon as={CircleArrowLeft} className="text-primary-foreground" />
        </Button>
      </View>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <View style={{ flex: 1, gap: 16, padding: 16 }}>
          <CreateBikeForm bike={bike} />
        </View>
        <View style={{ flex: 2, gap: 16, padding: 16 }}>
          <Text>Reparation:</Text>
          <Button onPress={() => router.push('/createRepairModal' as any)}>
            <Text>Opret reparation</Text>
          </Button>
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
});
