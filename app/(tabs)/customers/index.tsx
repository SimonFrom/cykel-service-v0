import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { MoonStarIcon, SunIcon } from 'lucide-react-native';
import {useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View, StyleSheet, FlatList } from 'react-native';
import { Customer } from '@/types/customer';
import { useCallback } from 'react';
import { getCustomers, deleteCustomer } from '@/crud/customers';
import { useCustomerStore } from '@/store/customerStore';
import { DeleteConfirmationDialog } from '@/components/ui/deleteConfirmation';

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const SCREEN_OPTIONS = {
  title: 'Kunder',
  headerTransparent: true,
  headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};

export default function Screen() {
  const { colorScheme } = useColorScheme();

  const customers = useCustomerStore(s => s.customers);
  const fetchCustomers = async () => {
    const customers = await getCustomers();
    setCustomersInStore(customers);
  };

  const setSelectedCustomer = useCustomerStore(s => s.setSelectedCustomer);
  const setCustomersInStore = useCustomerStore(s => s.setCustomersInStore);
  const deleteCustomerInStore = useCustomerStore(s => s.deleteCustomerInStore);
  const handlePress = (customer: Customer) => {
    setSelectedCustomer(customer);
    router.push({
      pathname: '/(tabs)/customers/[id]' as any,
      params: { id: customer.id },
    });
  }

  const handleDelete = async (id: number) => {
    await deleteCustomer(id);
    deleteCustomerInStore(id);
  }

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="items-end justify-end">
        <Button className="mr-5 mt-16" onPress={() => router.push('/createCustomerModal' as any)}>
          <Text>Opret kunde</Text>
        </Button>
      </View>
      <View className="flex-1 items-center justify-center gap-8 p-4">
        <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />
        <View className="gap-2 p-4">
          <Text className="ios:text-foreground heading font-mono text-muted-foreground">
            Customers
          </Text>
          <FlatList
            data={customers}
            keyExtractor={(item: Customer) => item.id.toString()}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.firstName[0]}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
                <Text style={styles.phone}>{item.phoneNumber}</Text>
                <Button onPress={() => handlePress(item)}>
                  <Text>Vis</Text>
                </Button>
                <DeleteConfirmationDialog
                  title={"Er du sikker?"}
                  buttonTitle={"Slet kunde"}
                  content={`Vil du virkelig slette ${item.firstName} ${item.lastName}`}
                  onConfirm={() => handleDelete(item.id)}
                />
              </View>
            )}
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
const styles = StyleSheet.create({
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