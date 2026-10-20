import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/deleteConfirmation';
import { Button } from '@/components/ui/stock components/button';
import { Icon } from '@/components/ui/stock components/icon';
import { Text } from '@/components/ui/stock components/text';
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customer';
import { ChevronRight, Mail, Phone, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type CustomerListItemProps = {
  customer: Customer;
  isLast?: boolean;
  onPress: (customer: Customer) => void;
  onDelete: (customer: Customer) => void | Promise<void>;
};

function getInitials(customer: Customer) {
  return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
}

// One row in the customer list: avatar, name/club, contact info and actions.
// Empty contact fields are hidden on narrow screens and shown as '—' in the desktop columns.
export function CustomerListItem({ customer, isLast, onPress, onDelete }: CustomerListItemProps) {
  const fullName = `${customer.firstName} ${customer.lastName}`;

  return (
    <Pressable
      onPress={() => onPress(customer)}
      className={cn(
        'flex-row items-center gap-4 px-4 py-3 active:bg-muted web:transition-colors web:hover:bg-muted/60',
        !isLast && 'border-b border-border'
      )}>
      <View className="size-10 items-center justify-center rounded-full bg-primary/15">
        <Text className="text-sm font-semibold text-primary">{getInitials(customer)}</Text>
      </View>

      <View className="min-w-0 flex-1 gap-1 md:flex-row md:items-center md:gap-6">
        <View className="min-w-0 flex-row items-center gap-2 md:w-1/3">
          <Text className="font-medium" numberOfLines={1}>
            {fullName}
          </Text>
          {customer.club ? (
            <Badge variant="secondary">
              <Text numberOfLines={1}>{customer.club}</Text>
            </Badge>
          ) : null}
        </View>

        <View
          className={cn(
            'min-w-0 flex-row items-center gap-1.5 md:flex md:flex-1',
            !customer.email && 'hidden'
          )}>
          <Icon as={Mail} className="text-muted-foreground" />
          <Text variant="muted" numberOfLines={1}>
            {customer.email || '—'}
          </Text>
        </View>

        <View
          className={cn(
            'flex-row items-center gap-1.5 md:flex md:w-36',
            !customer.phoneNumber && 'hidden'
          )}>
          <Icon as={Phone} className="text-muted-foreground" />
          <Text variant="muted" numberOfLines={1}>
            {customer.phoneNumber || '—'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1">
        <DeleteConfirmationDialog
          title="Er du sikker?"
          content={`Vil du virkelig slette ${fullName}?`}
          onConfirm={() => onDelete(customer)}
          trigger={
            <Button variant="ghost" size="icon" accessibilityLabel={`Slet ${fullName}`}>
              <Icon as={Trash2} size={16} className="text-muted-foreground" />
            </Button>
          }
        />
        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
      </View>
    </Pressable>
  );
}
