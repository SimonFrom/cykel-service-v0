import { CustomerListItem } from '@/components/ui/customerListItem';
import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';
import { deleteCustomer } from '@/crud/customers';
import { useCustomerStore } from '@/store/customerStore';
import { Customer } from '@/types/customer';
import { router, Stack, useFocusEffect } from 'expo-router';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, Users, X } from 'lucide-react-native';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

const SCREEN_OPTIONS = {
  title: 'Kunder',
};

// Case-insensitive match on name, email, phone and club.
function matchesQuery(customer: Customer, query: string) {
  const haystack = [
    customer.firstName,
    customer.lastName,
    customer.email,
    customer.phoneNumber,
    customer.club,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

type SortKey = 'name' | 'email' | 'phone';
type SortState = { key: SortKey; direction: 'asc' | 'desc' };

const SORT_VALUE: Record<SortKey, (customer: Customer) => string> = {
  name: (c) => `${c.firstName} ${c.lastName}`,
  email: (c) => c.email ?? '',
  phone: (c) => c.phoneNumber ?? '',
};

function compareText(a: string, b: string) {
  return a.localeCompare(b, 'da', { numeric: true, sensitivity: 'base' });
}

// Sorts by the given column; customers missing the value always go last, ties fall back to name.
function compareCustomers(a: Customer, b: Customer, { key, direction }: SortState) {
  const valueA = SORT_VALUE[key](a).trim();
  const valueB = SORT_VALUE[key](b).trim();
  if (!valueA !== !valueB) return valueA ? -1 : 1;
  const result = direction === 'asc' ? compareText(valueA, valueB) : compareText(valueB, valueA);
  return result || compareText(SORT_VALUE.name(a), SORT_VALUE.name(b));
}

export default function Screen() {
  const customers = useCustomerStore((s) => s.customers);
  const isLoading = useCustomerStore((s) => s.isLoading);
  const error = useCustomerStore((s) => s.error);
  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const setSelectedCustomer = useCustomerStore((s) => s.setSelectedCustomer);
  const deleteCustomerInStore = useCustomerStore((s) => s.deleteCustomerInStore);

  const [query, setQuery] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' });

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [fetchCustomers])
  );

  const filteredCustomers = useMemo(() => {
    const trimmed = query.trim();
    const list = trimmed ? customers.filter((c) => matchesQuery(c, trimmed)) : customers;
    return [...list].sort((a, b) => compareCustomers(a, b, sort));
  }, [customers, query, sort]);

  // Pressing the active column flips direction; a new column starts ascending.
  const handleSort = (key: SortKey) =>
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const handlePress = (customer: Customer) => {
    setSelectedCustomer(customer);
    router.push({
      pathname: '/customers/[id]',
      params: { id: String(customer.id) },
    });
  };

  const handleDelete = async (customer: Customer) => {
    try {
      setDeleteError(null);
      await deleteCustomer(customer.id);
      deleteCustomerInStore(customer.id);
    } catch (e) {
      setDeleteError((e as Error).message);
    }
  };

  const openCreateCustomer = () => router.push('/createCustomerModal' as never);

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 md:p-8">
        <View className="mx-auto w-full max-w-5xl gap-6">
          <View className="flex-row flex-wrap items-end justify-between gap-4">
            <View className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                Magtenbølle Cykelservice
              </Text>
              <Text className="text-3xl font-bold tracking-tight">Kunder</Text>
              <Text variant="muted">
                {customers.length} {customers.length === 1 ? 'kunde' : 'kunder'} i alt
              </Text>
            </View>
            <Button onPress={openCreateCustomer}>
              <Icon as={Plus} size={16} className="text-primary-foreground" />
              <Text>Opret kunde</Text>
            </Button>
          </View>

          <View className="relative justify-center">
            <Icon
              as={Search}
              size={16}
              className="pointer-events-none absolute left-3 z-10 text-muted-foreground"
            />
            <Input
              placeholder="Søg på navn, email, telefon eller klub…"
              className="pl-9 pr-9"
              value={query}
              onChangeText={setQuery}
            />
            {query ? (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 size-8 sm:size-8"
                accessibilityLabel="Ryd søgning"
                onPress={() => setQuery('')}>
                <Icon as={X} size={14} className="text-muted-foreground" />
              </Button>
            ) : null}
          </View>

          {error || deleteError ? (
            <View className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
              <Text className="text-sm text-destructive">
                {deleteError ? 'Kunden kunne ikke slettes: ' : 'Kunderne kunne ikke hentes: '}
                {deleteError ?? error}
              </Text>
            </View>
          ) : null}

          <View className="overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-black/5">
            <View className="hidden flex-row items-center gap-4 border-b border-border bg-muted/40 px-4 py-2 md:flex">
              <View className="w-10" />
              <View className="flex-1 flex-row gap-6">
                <SortHeader
                  label="Navn"
                  column="name"
                  sort={sort}
                  onSort={handleSort}
                  className="w-1/3"
                />
                <SortHeader
                  label="Email"
                  column="email"
                  sort={sort}
                  onSort={handleSort}
                  className="flex-1"
                />
                <SortHeader
                  label="Telefon"
                  column="phone"
                  sort={sort}
                  onSort={handleSort}
                  className="w-36"
                />
              </View>
              <View className="w-[58px]" />
            </View>

            {isLoading && customers.length === 0 ? (
              <View className="items-center py-16">
                <ActivityIndicator />
              </View>
            ) : filteredCustomers.length === 0 ? (
              <EmptyState
                hasCustomers={customers.length > 0}
                query={query}
                onCreate={openCreateCustomer}
              />
            ) : (
              filteredCustomers.map((customer, index) => (
                <CustomerListItem
                  key={customer.id}
                  customer={customer}
                  isLast={index === filteredCustomers.length - 1}
                  onPress={handlePress}
                  onDelete={handleDelete}
                />
              ))
            )}
          </View>

          {query && filteredCustomers.length > 0 ? (
            <Text variant="muted" className="text-center">
              Viser {filteredCustomers.length} af {customers.length}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

// Pressable column header that shows the current sort direction.
function SortHeader({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sort.key === column;
  const SortIcon = !isActive ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <Pressable
      onPress={() => onSort(column)}
      accessibilityRole="button"
      accessibilityLabel={`Sortér efter ${label.toLowerCase()}`}
      className={cn('group flex-row items-center gap-1 self-start', className)}>
      <Text
        className={cn(
          'text-xs font-medium uppercase text-muted-foreground web:group-hover:text-foreground',
          isActive && 'text-foreground'
        )}>
        {label}
      </Text>
      <Icon
        as={SortIcon}
        size={12}
        className={cn(
          'text-muted-foreground opacity-40 web:group-hover:opacity-100',
          isActive && 'text-foreground opacity-100'
        )}
      />
    </Pressable>
  );
}

// Shown when there are no customers at all, or none matching the search.
function EmptyState({
  hasCustomers,
  query,
  onCreate,
}: {
  hasCustomers: boolean;
  query: string;
  onCreate: () => void;
}) {
  return (
    <View className="items-center gap-3 px-4 py-16">
      <View className="size-12 items-center justify-center rounded-full bg-muted">
        <Icon as={hasCustomers ? Search : Users} size={20} className="text-muted-foreground" />
      </View>
      {hasCustomers ? (
        <>
          <Text className="font-medium">Ingen kunder matcher “{query.trim()}”</Text>
          <Text variant="muted">Prøv et andet navn, en email eller et telefonnummer.</Text>
        </>
      ) : (
        <>
          <Text className="font-medium">Ingen kunder endnu</Text>
          <Text variant="muted">Opret din første kunde for at komme i gang.</Text>
          <Button variant="outline" className="mt-2" onPress={onCreate}>
            <Icon as={Plus} size={16} />
            <Text>Opret kunde</Text>
          </Button>
        </>
      )}
    </View>
  );
}
