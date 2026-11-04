import { CreateBikeForm } from '@/components/ui/createBikeForm';
import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { useBikeStore } from '@/store/bikeStore';
import { router } from 'expo-router';
import { CircleArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Creates a bike, or edits `selectedBike` when one is set.
export default function CreateBikeModal() {
  const bike = useBikeStore((s) => s.selectedBike);

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View className="flex-row items-center justify-between px-6 pt-6">
          <Text className="text-lg font-semibold">{bike ? 'Rediger cykel' : 'Opret cykel'}</Text>
          <Button variant="destructive" onPress={() => router.back()}>
            <Icon as={CircleArrowLeft} className="text-primary-foreground" />
          </Button>
        </View>
        <CreateBikeForm key={bike?.id ?? 'new'} bike={bike ?? undefined} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
