import { useBikeStore } from '@/store/bikeStore';
import { CreateBikeForm } from '@/components/ui/createBikeForm';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { Text } from '@/components/ui/stock components/text';
import * as React from 'react';

export default function BikeInfoScreen() {
  const bike = useBikeStore((s) => s.selectedBike);

  if (!bike) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <View style={{ flex: 1, gap: 16, padding: 16 }}>
          <CreateBikeForm bike={bike} />
        </View>
        <View style={{ flex: 2, gap: 16, padding: 16 }}>
          <Text>Reparation:</Text>
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
