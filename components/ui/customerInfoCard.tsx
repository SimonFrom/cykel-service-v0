import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/components/ui/customerListItem';
import { Button } from '@/components/ui/stock components/button';
import { Card } from '@/components/ui/stock components/card';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { Customer } from '@/types/customer';
import { Mail, Pencil, Phone, StickyNote } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

// Read-only customer details with an edit action; empty fields are hidden.
export function CustomerInfoCard({ customer, onEdit }: { customer: Customer; onEdit: () => void }) {
  return (
    <Card className="gap-4 px-4 py-4 md:px-6">
      <View className="flex-row items-center gap-4">
        <View className="size-14 items-center justify-center rounded-full bg-primary/15">
          <Text className="text-lg font-semibold text-primary">{getInitials(customer)}</Text>
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-2xl font-bold tracking-tight" numberOfLines={1}>
            {customer.firstName} {customer.lastName}
          </Text>
          {customer.club ? (
            <Badge variant="secondary">
              <Text>{customer.club}</Text>
            </Badge>
          ) : null}
        </View>
        <Button variant="outline" onPress={onEdit}>
          <Icon as={Pencil} size={14} />
          <Text>Rediger</Text>
        </Button>
      </View>

      <View className="gap-2 md:flex-row md:flex-wrap md:gap-6">
        <InfoLine icon={Phone} value={customer.phoneNumber} />
        <InfoLine icon={Mail} value={customer.email} />
        <InfoLine icon={StickyNote} value={customer.note} />
      </View>
    </Card>
  );
}

function InfoLine({ icon, value }: { icon: LucideIcon; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center gap-2">
      <Icon as={icon} size={14} className="text-muted-foreground" />
      <Text variant="muted">{value}</Text>
    </View>
  );
}
