import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/stock components/select';

type DateSelectProps = {
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
  daysAhead?: number;
  daysBack?: number;
  startDate?: Date;
  className?: string;
};

type Option = {
  value: string;
  label: string;
};

const labelFormatter = new Intl.DateTimeFormat('da-DK', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

const triggerFormatter = new Intl.DateTimeFormat('da-DK', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

type DateOption = { key: string; date: Date; label: string };

function toOption(d: Date): DateOption {
  const date = startOfDay(d);
  return { key: dayKey(date), date, label: labelFormatter.format(date) };
}

// Options from `daysBack` days before `anchor` to `daysAhead` days after; `include` is added if outside.
export function buildDateOptions(
  anchor: Date,
  daysBack: number,
  daysAhead: number,
  include?: Date
): DateOption[] {
  const base = startOfDay(anchor);
  const options: DateOption[] = [];

  for (let i = -daysBack; i < daysAhead; i++) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    options.push(toOption(date));
  }

  if (include && !options.some((o) => o.key === dayKey(include))) {
    options.push(toOption(include));
    options.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  return options;
}

export function DateSelect({
  value,
  onValueChange,
  placeholder = 'Vælg en dato',
  daysAhead = 30,
  daysBack = 30,
  startDate,
  className,
}: DateSelectProps) {
  const valueKey = value ? dayKey(value) : undefined;
  const options = React.useMemo(
    () => buildDateOptions(startDate ?? new Date(), daysBack, daysAhead, value),
    [startDate, daysBack, daysAhead, valueKey]
  );

  const selectedOption = React.useMemo<Option | undefined>(() => {
    if (!value) return undefined;
    const key = dayKey(value);
    const match = options.find((o) => o.key === key);

    return {
      value: key,
      label: match ? match.label : triggerFormatter.format(value),
    };
  }, [options, value]);

  return (
    <Select
      value={selectedOption}
      onValueChange={(option) => {
        const match = options.find((o) => o.key === option?.value);
        onValueChange(match?.date);
      }}
    >
      <SelectTrigger className={`w-[220px] ${className ?? ''}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="w-[220px]">
        <SelectGroup>
          <SelectLabel>Vælg dato</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.key} label={option.label} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}