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
import { mockRepairs } from '@/types/repair';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { DeleteConfirmationDialog } from '@/components/ui/deleteConfirmation';

export default function BikeInfoScreen() {
  const bike = useBikeStore((s) => s.selectedBike);
  const customer = useCustomerStore((s) => s.selectedCustomer);
  const repairs = mockRepairs;

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
          <View>
            <Animated.FlatList
              data={repairs}
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
                      {item.id}
                    </Text>
                    <Text style={styles.name}>
                      Total pris: {item.totalPrice}
                    </Text>
                    <Text style={styles.name}>{item.createdAt.toString()}</Text>
                  </View>
                  <Button >
                    <Text>Vis</Text>
                  </Button>
                  <DeleteConfirmationDialog
                    title={'Er du sikker?'}
                    buttonTitle={'Slet'}
                    content={`Vil du virkelig slette reperation nr ${item.id}?`}

                  />
                </View>
              )}
            />
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  list: {
    padding: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
  },
});
