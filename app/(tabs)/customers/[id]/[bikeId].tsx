import { useBikeStore } from '@/store/bikeStore';
import { useCustomerStore } from '@/store/customerStore';
import { useRepairStore } from '@/store/repairStore';
import { deleteRepair } from '@/crud/repairs';
import { CreateBikeForm } from '@/components/ui/createBikeForm';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { Text } from '@/components/ui/stock components/text';
import * as React from 'react';
import { Button } from '@/components/ui/stock components/button';
import { router, useFocusEffect } from 'expo-router';
import { Icon } from '@/components/ui/stock components/icon';
import { CircleArrowLeft } from 'lucide-react-native';
import { getRepairs } from '@/crud/repairs';
import { Repair } from '@/types/repair';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { DeleteConfirmationDialog } from '@/components/ui/deleteConfirmation';
import { useCallback, useEffect } from 'react';
import { deleteBike } from '@/crud/bikes';

export default function BikeInfoScreen() {
  const bike = useBikeStore((s) => s.selectedBike);
  const customer = useCustomerStore((s) => s.selectedCustomer);


  const repairs = useRepairStore((s) => s.repairs)
  const deleteRepairInStore = useRepairStore((s) => s.deleteRepair);
  const setRepairsInStore = useRepairStore((s) => s.setRepairsInStore);
  const setRepairInStore = useRepairStore((s) => s.setSelectedRepair)


  const fetchRepairs = async () => {
    const repairs = await getRepairs(bike.id);
    setRepairsInStore(repairs);
  }

  useFocusEffect(
    useCallback(() => {
      fetchRepairs();
    }, [])
  );

  const handleDelete = async (id: number) => {
    await deleteRepair(id);
    deleteRepairInStore(id);
  };

  const handleShowRepair = (repair: Repair) => {
    setRepairInStore(repair);
    router.push('/createRepairModal');
  }


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
                      Reperations nummer: {item.id}
                    </Text>
                    <Text style={styles.name}>
                      Total pris: {item.totalPrice} kr
                    </Text>
                    <Text style={styles.name}>Oprettet: {item.createdAt.toLocaleDateString()}</Text>
                  </View>
                  <Button onPress={() => handleShowRepair(item)}>
                    <Text>Vis</Text>
                  </Button>
                  <DeleteConfirmationDialog
                    title={'Er du sikker?'}
                    buttonTitle={'Slet'}
                    content={`Vil du virkelig slette reperation nr ${item.id}?`}
                    onConfirm={() => handleDelete(item.id)}
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
