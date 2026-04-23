import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { Link, Stack, useRouter } from 'expo-router';
import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View } from 'react-native';
import { CreateCustomerForm } from '@/components/ui/createCustomerForm';
import { CreateBikeForm } from '@/components/ui/createBikeForm';
import {useCustomerStore} from '@/store/customerStore';

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const SCREEN_OPTIONS = {
  title: 'Opret cykel',
  headerTransparent: true,
  headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};

const router = useRouter();

export default function CreateBike() {
  const { colorScheme } = useColorScheme();
  const customer = useCustomerStore((s) => s.selectedCustomer);

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="items-end justify-end">
        <Button
          className="mr-5 mt-16"
          variant="destructive"
          onPress={() =>
            router.push({
              pathname: '/customers/[id]' as any,
              params: { id: String(customer?.id) },
            })
          }>
          <Text>Tilbage</Text>
        </Button>
      </View>
      <View className="flex-1 items-center justify-center gap-8 p-4">
        <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />
        <View className="gap-2 p-4">
          <CreateBikeForm
            onSuccess={() => {
              router.push({
                pathname: 'customers/[id]' as any,
                params: { id: String(customer?.id) },
              });
            }}
          />
        </View>
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
