import { BikeCard } from '@/components/ui/bikeCard';
import { CustomerInfoCard } from '@/components/ui/customerInfoCard';
import { RepairCard } from '@/components/ui/repairCard';
import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { deleteBike } from '@/crud/bikes';
import { deleteRepair } from '@/crud/repairs';
import {
  RepairSortKey,
  repairSortOptions,
  sortRepairs,
  summarizeBikeRepairs,
} from '@/lib/repairSort';
import { cn } from '@/lib/utils';
import { useBikeStore } from '@/store/bikeStore';
import { useCustomerStore } from '@/store/customerStore';
import { useRepairStore } from '@/store/repairStore';
import { Bike } from '@/types/bike';
import { Repair } from '@/types/repair';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Wrench } from 'lucide-react-native';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

// Single page for one customer: info, bikes and all repairs. Editing happens in modals.
// `openRepair=1` opens the repair modal for the repair/bike already selected in the stores.
export default function CustomerScreen() {
  const params = useLocalSearchParams<{ id: string; openRepair?: string }>();
  const customerId = Number(params.id);

  const selectedCustomer = useCustomerStore((s) => s.selectedCustomer);
  const customers = useCustomerStore((s) => s.customers);
  const customersLoading = useCustomerStore((s) => s.isLoading);
  const fetchCustomers = useCustomerStore((s) => s.fetchCustomers);
  const setSelectedCustomer = useCustomerStore((s) => s.setSelectedCustomer);

  const bikes = useBikeStore((s) => s.bikes);
  const fetchBikes = useBikeStore((s) => s.fetchBikes);
  const setSelectedBike = useBikeStore((s) => s.setSelectedBike);
  const deleteBikeInStore = useBikeStore((s) => s.deleteBike);

  const allRepairs = useRepairStore((s) => s.repairs);
  const fetchRepairs = useRepairStore((s) => s.fetchRepairs);
  const setSelectedRepair = useRepairStore((s) => s.setSelectedRepair);
  const deleteRepairInStore = useRepairStore((s) => s.deleteRepair);

  const [sort, setSort] = useState<RepairSortKey>('newest');
  const [bikeFilter, setBikeFilter] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fall back to the customer list so a page reload on web still works
  const customer =
    selectedCustomer?.id === customerId
      ? selectedCustomer
      : (customers.find((c) => c.id === customerId) ?? null);

  const repairOpened = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!useCustomerStore.getState().customers.some((c) => c.id === customerId)) {
        fetchCustomers();
      }
      fetchBikes(customerId);
      fetchRepairs();
      // Ref, not setParams: setParams right before push drops the push on web
      if (params.openRepair && !repairOpened.current) {
        repairOpened.current = true;
        router.push('/createRepairModal');
      }
    }, [customerId, params.openRepair, fetchCustomers, fetchBikes, fetchRepairs])
  );

  // Modals read the customer from the store
  useEffect(() => {
    if (customer && selectedCustomer?.id !== customer.id) setSelectedCustomer(customer);
  }, [customer, selectedCustomer, setSelectedCustomer]);

  const customerBikes = useMemo(
    () => bikes.filter((b) => b.customerId === customerId),
    [bikes, customerId]
  );
  const customerRepairs = useMemo(
    () => allRepairs.filter((r) => r.customerId === customerId),
    [allRepairs, customerId]
  );
  const activeFilter = customerBikes.some((b) => b.id === bikeFilter) ? bikeFilter : null;
  const visibleRepairs = useMemo(
    () =>
      sortRepairs(
        activeFilter === null
          ? customerRepairs
          : customerRepairs.filter((r) => r.bikeId === activeFilter),
        sort
      ),
    [customerRepairs, activeFilter, sort]
  );

  const openRepair = (repair: Repair | null, bike: Bike) => {
    setSelectedBike(bike);
    setSelectedRepair(repair);
    router.push('/createRepairModal');
  };

  const handleOpenRepair = (repair: Repair) => {
    const bike = customerBikes.find((b) => b.id === repair.bikeId);
    if (bike) openRepair(repair, bike);
  };

  const handleEditBike = (bike: Bike | null) => {
    setSelectedBike(bike);
    router.push('/createBikeModal');
  };

  const handleDeleteBike = async (bike: Bike) => {
    try {
      setActionError(null);
      await deleteBike(bike.id);
      deleteBikeInStore(bike.id);
    } catch (e) {
      // 23503 = foreign key violation: the bike still has repairs.
      const isReferenced = (e as { code?: string }).code === '23503';
      setActionError(
        isReferenced
          ? `${bike.make} ${bike.model} har reparationer registreret. Slet reparationerne først.`
          : `Cyklen kunne ikke slettes: ${(e as Error).message}`
      );
    }
  };

  const handleDeleteRepair = async (repair: Repair) => {
    try {
      setActionError(null);
      await deleteRepair(repair.id);
      deleteRepairInStore(repair.id);
    } catch (e) {
      setActionError(`Reparationen kunne ikke slettes: ${(e as Error).message}`);
    }
  };

  const goBack = () => router.navigate('/customers');

  if (!customer) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-4">
        {customersLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text className="font-medium">Kunden blev ikke fundet</Text>
            <Button variant="outline" onPress={goBack}>
              <Text>Til kunder</Text>
            </Button>
          </>
        )}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${customer.firstName} ${customer.lastName}` }} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 md:p-8">
        <View className="mx-auto w-full max-w-5xl gap-6">
          <Button variant="ghost" className="self-start" onPress={goBack}>
            <Icon as={ArrowLeft} size={16} />
            <Text>Kunder</Text>
          </Button>

          <CustomerInfoCard
            customer={customer}
            onEdit={() =>
              router.push({ pathname: '/createCustomerModal', params: { mode: 'edit' } })
            }
          />

          {actionError ? (
            <View className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
              <Text className="text-sm text-destructive">{actionError}</Text>
            </View>
          ) : null}

          <View className="gap-3">
            <SectionHeader title="Cykler" count={customerBikes.length}>
              <Button size="sm" onPress={() => handleEditBike(null)}>
                <Icon as={Plus} size={14} className="text-primary-foreground" />
                <Text>Tilføj cykel</Text>
              </Button>
            </SectionHeader>
            {customerBikes.length === 0 ? (
              <EmptyCard text="Kunden har ingen cykler endnu." />
            ) : (
              <View className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {customerBikes.map((bike) => (
                  <BikeCard
                    key={bike.id}
                    bike={bike}
                    summary={summarizeBikeRepairs(customerRepairs, bike.id)}
                    onCreateRepair={(b) => openRepair(null, b)}
                    onEdit={handleEditBike}
                    onDelete={handleDeleteBike}
                  />
                ))}
              </View>
            )}
          </View>

          <View className="gap-3">
            <SectionHeader title="Reparationer" count={customerRepairs.length} />
            <View className="flex-row flex-wrap items-center justify-between gap-3">
              <View className="flex-row flex-wrap gap-2">
                {customerBikes.length > 1 ? (
                  <>
                    <Chip
                      label="Alle cykler"
                      active={activeFilter === null}
                      onPress={() => setBikeFilter(null)}
                    />
                    {customerBikes.map((bike) => (
                      <Chip
                        key={bike.id}
                        label={`${bike.make} ${bike.model}`}
                        active={activeFilter === bike.id}
                        onPress={() => setBikeFilter(bike.id)}
                      />
                    ))}
                  </>
                ) : null}
              </View>
              <View className="flex-row flex-wrap items-center gap-2">
                <Text variant="muted">Sortér:</Text>
                {repairSortOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    active={sort === option.value}
                    onPress={() => setSort(option.value)}
                  />
                ))}
              </View>
            </View>

            {visibleRepairs.length === 0 ? (
              <EmptyCard
                text={
                  customerBikes.length === 0
                    ? 'Tilføj en cykel for at oprette en reparation.'
                    : 'Ingen reparationer endnu. Opret en fra en cykel ovenfor.'
                }
              />
            ) : (
              <View className="overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-black/5">
                {visibleRepairs.map((repair, index) => (
                  <RepairCard
                    key={repair.id}
                    repair={repair}
                    bike={customerBikes.find((b) => b.id === repair.bikeId)}
                    isLast={index === visibleRepairs.length - 1}
                    onPress={handleOpenRepair}
                    onDelete={handleDeleteRepair}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function SectionHeader({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-row items-baseline gap-2">
        <Text className="text-xl font-semibold">{title}</Text>
        <Text variant="muted">{count}</Text>
      </View>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={cn(
        'rounded-full border px-3 py-1 web:transition-colors',
        active ? 'border-primary bg-primary' : 'border-border bg-card web:hover:bg-muted'
      )}>
      <Text
        className={cn(
          'text-xs font-medium',
          active ? 'text-primary-foreground' : 'text-foreground'
        )}>
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View className="items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10">
      <Icon as={Wrench} size={18} className="text-muted-foreground" />
      <Text variant="muted">{text}</Text>
    </View>
  );
}
