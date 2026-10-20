import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Control, Controller, useFieldArray, useWatch, UseFormTrigger } from 'react-hook-form';
import { Trash2 } from 'lucide-react-native';
import { Button } from '@/components/ui/stock components/button';
import { Input } from '@/components/ui/stock components/input';
import { Label } from '@/components/ui/stock components/label';
import { Text } from '@/components/ui/stock components/text';
import { Icon } from '@/components/ui/stock components/icon';
import { DiscountInput, ERROR_TEXT_COLOR, refProp } from '@/components/ui/DiscountInput';
import { calculateLineTotals, calculateRepairTotals, validateDiscount } from '@/lib/repairPricing';
import type { RepairTotals } from '@/lib/repairPricing';
import type { Discount } from '@/types/discount';
import { Repair } from '@/types/repair';
import { RepairItem } from '@/types/repairItems';

type Props = {
  control: Control<Repair>;
  // Used to revalidate discounts when the base (price, quantity, lines) changes
  trigger?: UseFormTrigger<Repair>;
  disabled?: boolean;
};

type PricedItem = Pick<RepairItem, 'price' | 'quantity' | 'discount'>;

const NARROW_BREAKPOINT = 768;

const money = (n: number) => n.toFixed(2);
const minusMoney = (n: number) => (n > 0 ? `−${money(n)}` : money(0));

// Gross of a line in DKK, 0 when price or quantity are unusable.
function lineBase(item?: PricedItem): number {
  try {
    return calculateLineTotals({ ...item!, discount: null }).gross;
  } catch {
    return 0;
  }
}

// Same result as calculateRepairTotals, but never throws: invalid parts count as 0 / no discount,
// so the display never shows NaN or negative numbers while the user is still typing.
function safeTotals(items: PricedItem[], discount: Discount | null): RepairTotals {
  try {
    return calculateRepairTotals(items, discount);
  } catch {
    const lines = items.map((item) => {
      try {
        return calculateLineTotals(item);
      } catch {
        try {
          return calculateLineTotals({ ...item, discount: null });
        } catch {
          return { gross: 0, discount: 0, net: 0 };
        }
      }
    });
    const subtotal = Math.round(lines.reduce((s, l) => s + l.net, 0) * 100) / 100;
    try {
      return { ...calculateRepairTotals([], null), ...withRepair(lines, subtotal, discount) };
    } catch {
      return { lines, subtotal, repairDiscount: 0, total: subtotal };
    }
  }
}

function withRepair(lines: RepairTotals['lines'], subtotal: number, discount: Discount | null) {
  const t = calculateRepairTotals([{ price: subtotal, quantity: 1, discount: null }], discount);
  return { lines, subtotal, repairDiscount: t.repairDiscount, total: t.total };
}

// Subtotal (after line discounts) used as base for the repair discount.
function subtotalOf(items: PricedItem[] | undefined): number {
  return safeTotals(items ?? [], null).subtotal;
}

export function RepairLinesSection({ control, trigger, disabled }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' });
  const repairDiscount = useWatch({ control, name: 'discount' }) ?? null;
  const { width } = useWindowDimensions();
  const narrow = width < NARROW_BREAKPOINT;

  const titleRefs = useRef<(TextInput | null)[]>([]);
  const addRef = useRef<View>(null);
  const addRefProp = { ref: addRef };
  const [focusTarget, setFocusTarget] = useState<number | 'add' | null>(null);

  const items: PricedItem[] = (watchedItems ?? []).map((i) => ({
    price: Number(i?.price) || 0,
    quantity: Number(i?.quantity) || 0,
    discount: i?.discount ?? null,
  }));
  const totals = safeTotals(items, repairDiscount);
  const showFooter = fields.length > 0 || repairDiscount != null;

  // Revalidate discounts when the base changes (AC-6 / ux 5.4)
  const baseKey = JSON.stringify(
    (watchedItems ?? []).map((i) => [i?.price, i?.quantity, i?.discount?.value])
  );
  useEffect(() => {
    if (!trigger) return;
    const names = (watchedItems ?? []).flatMap((item, i) =>
      item?.discount ? ([`items.${i}.discount`] as const) : []
    );
    const all = repairDiscount ? [...names, 'discount' as const] : names;
    if (all.length > 0) void trigger(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey]);

  // Move focus after add/remove, once the new row has rendered
  useEffect(() => {
    if (focusTarget === null) return;
    if (focusTarget === 'add') addRef.current?.focus();
    else titleRefs.current[focusTarget]?.focus();
    setFocusTarget(null);
  }, [focusTarget, fields.length]);

  const handleAddLine = () => {
    append({
      id: Date.now(),
      title: '',
      price: 0,
      discount: null,
      quantity: 1,
      total: 0,
    });
    setFocusTarget(fields.length);
  };

  const handleRemove = (index: number) => {
    remove(index);
    setFocusTarget(fields.length - 1 > index ? index : 'add');
  };

  const lineName = (index: number) => {
    const title = watchedItems?.[index]?.title?.trim();
    return title ? title : `linje ${index + 1}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Button {...(addRefProp as object)} onPress={handleAddLine} disabled={disabled}>
          <Text>Tilføj linje</Text>
        </Button>
      </View>

      {fields.length === 0 && !showFooter && (
        <Text className="text-sm text-muted-foreground">
          Ingen linjer endnu. Tilføj en linje for at se pris og rabat.
        </Text>
      )}

      {fields.length > 0 && !narrow && (
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 3 }]}>Beskrivelse</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Antal</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Pris</Text>
          <Text style={[styles.headerCell, { flex: 2 }]}>Rabat</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Total kr</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {fields.map((field, index) => {
        const name = lineName(index);
        const line = totals.lines[index] ?? { gross: 0, discount: 0, net: 0 };
        const cell = (flex: number) => (narrow ? styles.cellNarrow : { flex, paddingRight: 8 });
        const label = (text: string, id: string) =>
          narrow ? (
            <Label nativeID={id} className="text-xs">
              {text}
            </Label>
          ) : null;

        return (
          <Controller
            key={field.id}
            control={control}
            name={`items.${index}.discount`}
            rules={{
              validate: (d, form) =>
                validateDiscount(d, lineBase(form.items?.[index])) ?? true,
            }}
            render={({ field: discountField, fieldState }) => (
              <View
                style={[
                  narrow ? styles.lineCard : styles.lineRow,
                  fieldState.error && styles.lineRowError,
                ]}>
                <View style={cell(3)}>
                  {label('Beskrivelse', `title-${field.id}`)}
                  <Controller
                    control={control}
                    name={`items.${index}.title`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        {...refProp((r: TextInput | null) => {
                          titleRefs.current[index] = r;
                        })}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Titel"
                        editable={!disabled}
                        aria-label={narrow ? undefined : `Beskrivelse for ${name}`}
                        aria-labelledby={narrow ? `title-${field.id}` : undefined}
                      />
                    )}
                  />
                </View>

                <View style={narrow ? styles.pairRow : { flex: 2 }}>
                  <View style={cell(1)}>
                    {label('Antal', `qty-${field.id}`)}
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          onBlur={onBlur}
                          onChangeText={(t) => onChange(Number(t) || 0)}
                          value={value?.toString() ?? ''}
                          keyboardType="numeric"
                          editable={!disabled}
                          aria-label={narrow ? undefined : `Antal for ${name}`}
                          aria-labelledby={narrow ? `qty-${field.id}` : undefined}
                        />
                      )}
                    />
                  </View>
                  <View style={cell(1)}>
                    {label('Pris', `price-${field.id}`)}
                    <Controller
                      control={control}
                      name={`items.${index}.price`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          onBlur={onBlur}
                          onChangeText={(t) => onChange(Number(t) || 0)}
                          value={value?.toString() ?? ''}
                          keyboardType="numeric"
                          editable={!disabled}
                          aria-label={narrow ? undefined : `Pris for ${name}`}
                          aria-labelledby={narrow ? `price-${field.id}` : undefined}
                        />
                      )}
                    />
                  </View>
                </View>

                <View style={cell(2)}>
                  {label('Rabat', `disc-${field.id}`)}
                  <DiscountInput
                    value={discountField.value ?? null}
                    onChange={discountField.onChange}
                    onBlur={discountField.onBlur}
                    inputRef={discountField.ref}
                    label={`Rabat for ${name}`}
                    labelledBy={narrow ? `disc-${field.id}` : undefined}
                    groupLabel={`Rabattype for ${name}`}
                    error={fieldState.error?.message}
                    errorId={`disc-err-${field.id}`}
                    disabled={disabled}
                    large={narrow}
                  />
                </View>

                <View style={narrow ? styles.totalNarrow : { flex: 1, paddingTop: 8 }}>
                  {label('Total kr', `total-${field.id}`)}
                  <Text>{money(line.net)}</Text>
                  {line.discount > 0 && (
                    <Text className="text-xs text-muted-foreground">
                      {minusMoney(line.discount)}
                    </Text>
                  )}
                </View>

                <Button
                  variant="destructive"
                  size="sm"
                  aria-label={`Fjern linje ${name}`}
                  disabled={disabled}
                  onPress={() => handleRemove(index)}
                  style={{ width: 40 }}>
                  <Icon as={Trash2} className="text-primary-foreground" />
                </Button>
              </View>
            )}
          />
        );
      })}

      {showFooter && (
        <View style={[styles.footer, narrow && { alignSelf: 'stretch', maxWidth: undefined }]}>
          <View style={styles.footerRow}>
            <Text>Subtotal</Text>
            <Text style={styles.amount}>{money(totals.subtotal)}</Text>
          </View>
          <Controller
            control={control}
            name="discount"
            rules={{
              validate: (d, form) => validateDiscount(d, subtotalOf(form.items)) ?? true,
            }}
            render={({ field, fieldState }) => (
              <View style={styles.footerRow}>
                <Label nativeID="repair-discount-label">Rabat</Label>
                <View style={{ flex: 1, paddingHorizontal: 8 }}>
                  <DiscountInput
                    value={field.value ?? null}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    labelledBy="repair-discount-label"
                    groupLabel="Rabattype for reparationen"
                    error={fieldState.error?.message}
                    errorId="repair-discount-error"
                    disabled={disabled}
                    large={narrow}
                  />
                </View>
                <Text style={styles.amount}>{minusMoney(totals.repairDiscount)}</Text>
              </View>
            )}
          />
          <View style={[styles.footerRow, styles.totalRow]}>
            <Text className="text-base font-semibold">I alt</Text>
            <Text aria-live="polite" className="text-base font-semibold" style={styles.amount}>
              {money(totals.total)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 8,
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 12,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    paddingVertical: 4,
  },
  lineRowError: {
    borderLeftWidth: 3,
    borderLeftColor: ERROR_TEXT_COLOR,
    paddingLeft: 4,
  },
  lineCard: {
    gap: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
  },
  pairRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cellNarrow: {
    flex: 1,
    gap: 4,
  },
  totalNarrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    alignSelf: 'flex-end',
    width: '100%',
    maxWidth: 320,
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  amount: {
    minWidth: 80,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
