import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Control, Controller, useFieldArray, useWatch, UseFormTrigger } from 'react-hook-form';
import { Trash2 } from 'lucide-react-native';
import { Button } from '@/components/ui/stock components/button';
import { Input } from '@/components/ui/stock components/input';
import { Label } from '@/components/ui/stock components/label';
import { Text } from '@/components/ui/stock components/text';
import { Icon } from '@/components/ui/stock components/icon';
import { DiscountInput, refProp } from '@/components/ui/DiscountInput';
import { tryCalculateRepairTotals, validateDiscount } from '@/lib/repairPricing';
import { ERROR_TEXT_COLOR } from '@/lib/theme';
import { cn } from '@/lib/utils';
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

const NUMBER_RE = /^-?\d{1,8}([.,]\d{1,2})?$/;

// Strict parse of quantity/price text. Anything else (incl. empty) -> NaN, reported by the validator.
export function parseNumberText(text: string): number {
  const trimmed = text.trim();
  return NUMBER_RE.test(trimmed) ? Number(trimmed.replace(',', '.')) : NaN;
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? String(value).replace('.', ',') : '';
}

const validateQuantity = (v: number) =>
  !Number.isFinite(v) ? 'Ugyldigt tal' : v > 0 ? true : 'Antal skal være større end 0';
const validatePrice = (v: number) =>
  !Number.isFinite(v) ? 'Ugyldigt tal' : v >= 0 ? true : 'Pris skal være 0 eller mere';

// Replaces unusable price/quantity with a neutral line so the display never throws while typing.
function usable(items: PricedItem[]): PricedItem[] {
  return items.map((i) =>
    Number.isFinite(i.price) && i.price >= 0 && Number.isFinite(i.quantity) && i.quantity > 0
      ? i
      : { price: 0, quantity: 1, discount: null }
  );
}

// Totals for display: drops invalid discounts (lines first, then repair level) instead of throwing.
function displayTotals(items: PricedItem[], discount: Discount | null): RepairTotals {
  const base = usable(items);
  const noLineDiscounts = base.map((i) => ({ ...i, discount: null }));
  return (
    tryCalculateRepairTotals(base, discount) ??
    tryCalculateRepairTotals(noLineDiscounts, discount) ??
    tryCalculateRepairTotals(base, null) ??
    tryCalculateRepairTotals(noLineDiscounts, null) ?? {
      lines: base.map(() => ({ gross: 0, discount: 0, net: 0 })),
      subtotal: 0,
      repairDiscount: 0,
      total: 0,
    }
  );
}

// Gross of a line in DKK, 0 when price or quantity are unusable.
function lineBase(item?: PricedItem): number {
  return displayTotals(item ? [{ ...item, discount: null }] : [], null).lines[0]?.gross ?? 0;
}

// Subtotal (after line discounts) used as base for the repair discount.
function subtotalOf(items: PricedItem[] | undefined): number {
  return displayTotals(items ?? [], null).subtotal;
}

type NumberFieldProps = {
  value: number;
  onChange: (n: number) => void;
  onBlur: () => void;
  label?: string;
  labelledBy?: string;
  error?: string;
  errorId: string;
  disabled?: boolean;
  large?: boolean;
};

// Quantity/price input. Keeps the raw text so "12," can be typed; the form gets the strict parse.
function NumberField({
  value,
  onChange,
  onBlur,
  label,
  labelledBy,
  error,
  errorId,
  disabled,
  large,
}: NumberFieldProps) {
  const [raw, setRaw] = useState(formatNumber(value));

  // Sync when the form value changes from outside (reset, edit)
  useEffect(() => {
    if (Object.is(parseNumberText(raw), value)) return;
    setRaw(formatNumber(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <View>
      <Input
        value={raw}
        onChangeText={(t) => {
          setRaw(t);
          onChange(parseNumberText(t));
        }}
        onBlur={onBlur}
        keyboardType="numeric"
        inputMode="decimal"
        autoComplete="off"
        editable={!disabled}
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(large && 'h-11')}
      />
      {error ? (
        <Text nativeID={errorId} style={{ fontSize: 12, color: ERROR_TEXT_COLOR }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
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
    price: i?.price ?? NaN,
    quantity: i?.quantity ?? NaN,
    discount: i?.discount ?? null,
  }));
  const totals = displayTotals(items, repairDiscount);
  const showFooter = fields.length > 0 || repairDiscount != null;

  // Revalidate on any change to price, quantity or discounts (value and type; NaN stays distinct)
  const discountKey = (d?: Discount | null) => (d ? `${d.type}:${String(d.value)}` : '-');
  const baseKey = JSON.stringify([
    (watchedItems ?? []).map((i) => [
      String(i?.price),
      String(i?.quantity),
      discountKey(i?.discount),
    ]),
    discountKey(repairDiscount),
  ]);
  useEffect(() => {
    if (!trigger) return;
    const names = (watchedItems ?? []).flatMap((item, i) => [
      `items.${i}.quantity` as const,
      `items.${i}.price` as const,
      ...(item?.discount ? ([`items.${i}.discount`] as const) : []),
    ]);
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
                <View style={[cell(3), narrow && { paddingRight: 48 }]}>
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

                <View style={narrow ? styles.pairRow : { flex: 2, flexDirection: 'row' }}>
                  <View style={cell(1)}>
                    {label('Antal', `qty-${field.id}`)}
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      rules={{ validate: validateQuantity }}
                      render={({ field: { onChange, onBlur, value }, fieldState }) => (
                        <NumberField
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          label={`Antal for ${name}`}
                          labelledBy={narrow ? `qty-${field.id}` : undefined}
                          error={fieldState.error?.message}
                          errorId={`qty-err-${field.id}`}
                          disabled={disabled}
                          large={narrow}
                        />
                      )}
                    />
                  </View>
                  <View style={cell(1)}>
                    {label('Pris', `price-${field.id}`)}
                    <Controller
                      control={control}
                      name={`items.${index}.price`}
                      rules={{ validate: validatePrice }}
                      render={({ field: { onChange, onBlur, value }, fieldState }) => (
                        <NumberField
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          label={`Pris for ${name}`}
                          labelledBy={narrow ? `price-${field.id}` : undefined}
                          error={fieldState.error?.message}
                          errorId={`price-err-${field.id}`}
                          disabled={disabled}
                          large={narrow}
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
                  style={narrow ? styles.trashNarrow : { width: 40 }}>
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
  trashNarrow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
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
