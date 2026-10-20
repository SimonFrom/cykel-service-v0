import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/ui/stock components/button';
import { Input } from '@/components/ui/stock components/input';
import { Text } from '@/components/ui/stock components/text';
import { ERROR_TEXT_COLOR } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { Discount, DiscountType } from '@/types/discount';

const DECIMAL_RE = /^\d{1,8}([.,]\d{1,2})?$/;
const NEGATIVE_RE = /^-\d{1,8}([.,]\d{1,2})?$/;

// Strict parse (SR-5). Empty/zero -> null. Negative -> negative value (validator reports it).
// Anything else -> NaN value (validator reports "Ugyldigt tal").
export function parseDiscountText(text: string, type: DiscountType): Discount | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  if (DECIMAL_RE.test(trimmed)) {
    const n = Number(trimmed.replace(',', '.'));
    return n === 0 ? null : { type, value: n };
  }
  if (NEGATIVE_RE.test(trimmed)) return { type, value: Number(trimmed.replace(',', '.')) };
  return { type, value: NaN };
}

// The stock Input type omits `ref`, but it forwards props (incl. ref) to TextInput.
export function refProp(ref: React.Ref<TextInput> | undefined): object {
  return { ref };
}

function formatValue(value: number): string {
  return Number.isFinite(value) ? String(value).replace('.', ',') : '';
}

function sameDiscount(a: Discount | null, b: Discount | null): boolean {
  if (a == null || b == null) return a == b;
  return a.type === b.type && Object.is(a.value, b.value);
}

type Props = {
  value: Discount | null;
  onChange: (discount: Discount | null) => void;
  onBlur?: () => void;
  // Accessible name of the input when there is no visible label
  label?: string;
  // id of a visible label element
  labelledBy?: string;
  // Accessible name of the type group
  groupLabel: string;
  error?: string;
  disabled?: boolean;
  inputRef?: React.Ref<TextInput>;
  errorId: string;
  large?: boolean;
};

// Value input plus a %/kr toggle group. Keeps the raw text locally so "12," can be typed.
export function DiscountInput({
  value,
  onChange,
  onBlur,
  label,
  labelledBy,
  groupLabel,
  error,
  disabled,
  inputRef,
  errorId,
  large,
}: Props) {
  const [raw, setRaw] = useState(value ? formatValue(value.value) : '');
  const [type, setType] = useState<DiscountType>(value?.type ?? 'percent');

  // Sync when the form value changes from outside (reset, edit)
  useEffect(() => {
    if (sameDiscount(parseDiscountText(raw, type), value)) return;
    setRaw(value ? formatValue(value.value) : '');
    if (value) setType(value.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleText = (text: string) => {
    setRaw(text);
    onChange(parseDiscountText(text, type));
  };

  const handleType = (next: DiscountType) => {
    setType(next);
    onChange(parseDiscountText(raw, next));
  };

  const options: { type: DiscountType; text: string; name: string }[] = [
    { type: 'percent', text: '%', name: '% (procent)' },
    { type: 'amount', text: 'kr', name: 'kr (kroner)' },
  ];

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        <View style={{ flex: 1, minWidth: 64 }}>
          <Input
            {...refProp(inputRef)}
            value={raw}
            onChangeText={handleText}
            onBlur={onBlur}
            placeholder="0"
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
        </View>
        <View role="group" aria-label={groupLabel} style={{ flexDirection: 'row', gap: 2 }}>
          {options.map((o) => (
            <Button
              key={o.type}
              size="sm"
              variant={type === o.type ? 'default' : 'outline'}
              aria-pressed={type === o.type}
              aria-label={o.name}
              disabled={disabled}
              onPress={() => handleType(o.type)}
              className={cn('min-w-9', large && 'h-11 min-w-11')}>
              <Text>{o.text}</Text>
            </Button>
          ))}
        </View>
      </View>
      {error ? (
        <Text nativeID={errorId} style={{ fontSize: 12, color: ERROR_TEXT_COLOR }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
