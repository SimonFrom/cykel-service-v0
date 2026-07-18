import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { Card } from '@/components/ui/stock components/card';
import { Link, Stack, useFocusEffect } from 'expo-router';
import { Car, MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View } from 'react-native';
import { useCustomerStore } from '@/store/customerStore';
import { useBikeStore } from '@/store/bikeStore';
import { getCustomers } from '@/crud/customers';
import { useCallback, useEffect } from 'react';
import { Customer } from '@/types/customer';

// const LOGO = {
//   light: require('@/assets/images/react-native-reusables-light.png'),
//   dark: require('@/assets/images/react-native-reusables-dark.png'),
// };

const SCREEN_OPTIONS = {
  title: '',
  headerTransparent: true,
  headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};


export default function Screen() {

const customers = useCustomerStore((s) => s.customers);
const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
const isLoading = useCustomerStore((s) => s.isLoading)



useEffect(() => {
  fetchCustomers();
}, [fetchCustomers]);

  const { colorScheme } = useColorScheme();


  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="items-center justify-start gap-8 p-4">
        {/* <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" /> */}
        <View className="gap-2 p-4">
          <Text className="ios:text-foreground heading font-mono text-primary">
            Magtenbølle Cykelservice
          </Text>
        </View>
      </View>
      <View className='grid m-3 gap-3 grid-cols-3'>
        <Card className="p-4">
          <Text className="text-muted-foreground font-mono">Reparationer til dato:</Text>
        </Card>
        <Card className="p-4">
          <Text className="text-muted-foreground font-mono">Kunder til dato: {customers.length}</Text>
        </Card>
        <Card className="p-4">
          <Text className="text-muted-foreground font-mono">Omsætning til dato: </Text>
        </Card>
      </View>
    </>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 rounded-full web:mx-4">
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
    </Button>
  );
}
