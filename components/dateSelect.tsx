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

function buildDateOptions(start: Date, days: number) {
  const base = startOfDay(start);
  const options: { key: string; date: Date; label: string }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);

    const label = labelFormatter.format(date);

    options.push({ key: dayKey(date), date, label });
  }
  return options;
}

export function DateSelect({
  value,
  onValueChange,
  placeholder = 'Vælg en dato',
  daysAhead = 30,
  startDate,
  className,
}: DateSelectProps) {
  const effectiveStartDate = React.useMemo(() => {
    if (startDate) return startDate;
    if (value) return startOfDay(value);
    return startOfDay(new Date());
  }, [startDate, value]);

  const options = React.useMemo(
    () => buildDateOptions(effectiveStartDate, daysAhead),
    [effectiveStartDate, daysAhead]
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