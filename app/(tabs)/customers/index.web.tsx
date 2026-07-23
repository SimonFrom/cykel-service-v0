import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { MoonStarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Image, type ImageStyle, View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useState } from 'react';
import * as React from 'react';
import { Customer } from '@/types/customer';
import { useCallback } from 'react';
import { getCustomers, deleteCustomer } from '@/crud/customers';
import { useCustomerStore } from '@/store/customerStore';
import { DeleteConfirmationDialog } from '@/components/ui/deleteConfirmation';
import { Input } from '@/components/ui/stock components/input';
import { Value } from '@rn-primitives/select';

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const SCREEN_OPTIONS = {
  title: 'Kunder',
  headerTransparent: true,
  //headerRight: () => <ThemeToggle />,
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
  const deleteCustomerInStore = useCustomerStore((s) => s.deleteCustomerInStore);
  const handlePress = (customer: Customer) => {
    setSelectedCustomer(customer);
    router.push({
      pathname: '/customers/[id]',
      params: { id: String(customer.id) },
    });
  };

  const handleDelete = async (id: number) => {
    await deleteCustomer(id);
    deleteCustomerInStore(id);
  }

  const [query, setQuery] = useState('');
  const [data, setData] = useState(customers);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text) {
      const filtered = customers.filter((item) => {
        const itemData = item.firstName ? item.firstName.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setData(filtered);
      console.log('Filtered customers:', filtered);
    } else {
      setData(customers); // Reset to full list if search is empty
    }
  }


  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="gap-2 p-4 items-center">
        <Text className="ios:text-foreground heading font-mono text-primary">
          Magtenbølle Cykelservice
        </Text>
      </View>
      <View className="items-end justify-end">
        <Button className="mr-5 mt-16" onPress={() => router.push('/createCustomerModal' as any)}>
          <Text>Opret kunde</Text>
        </Button>
      </View>
      <View className="flex-1 flex-row w-full">
        <ScrollView className="flex-1 w-2/3 mr-auto ml-5" showsVerticalScrollIndicator={false}>
          <View className="gap-2 p-4">
            <Text className="ios:text-foreground heading font-mono text-muted-foreground">
              Oprettede kunder
            </Text>
            <View>
              <FlatList
                data={data.length > 0 ? data : customers}
                keyExtractor={(item: Customer) => item.id.toString()}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <View style={styles.info}>
                      <Text style={styles.name}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <Text style={styles.email}>{item.email}</Text>
                      <Text style={styles.phone}>{item.phoneNumber}</Text>
                    </View>
                    <View className="gap-1">
                      <Button onPress={() => handlePress(item)}>
                        <Text>Vis</Text>
                      </Button>
                      <DeleteConfirmationDialog
                        title={'Er du sikker?'}
                        buttonTitle={'Slet kunde'}
                        content={`Vil du virkelig slette ${item.firstName} ${item.lastName}`}
                        onConfirm={() => handleDelete(item.id)}
                      />
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        </ScrollView>
        <View className="ml-auto mr-0 mt-5 w-1/3">
          <Text className="ios:text-foreground heading font-mono text-muted-foreground">
            Filtrer eller søg...
          </Text>
          <Input
            placeholder="Søg efter en kundes navn..." className="mr-5"
            onChangeText={(text) => handleSearch(text)}
            value={query}
          />
        </View>
      </View >
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
    width: '100%',

  },
  separator: {
    height: 5,
    backgroundColor: '#2eb789',
    width: '100%',
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