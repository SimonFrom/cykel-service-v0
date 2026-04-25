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
  /** How many days forward to show. Defaults to 30. */
  daysAhead?: number;
  /** Day to start from. Defaults to today. */
  startDate?: Date;
  className?: string;
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

/** Strips time so two Dates representing the same calendar day compare equal. */
function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** ISO key (yyyy-mm-dd) — stable string identity for a calendar day. */
function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

function buildDateOptions(start: Date, days: number) {
  const base = startOfDay(start);
  const options: { key: string; date: Date; label: string }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);

    let label = labelFormatter.format(date);
    if (i === 0) label = `I dag · ${label}`;
    else if (i === 1) label = `I morgen · ${label}`;
    else if (i === 2) label = `I overmorgen · ${label}`;

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
  // Recompute options if startDate or daysAhead changes, but otherwise stable.
  const options = React.useMemo(
    () => buildDateOptions(startDate ?? new Date(), daysAhead),
    [startDate, daysAhead]
  );

  const selectedKey = value ? dayKey(value) : undefined;
  const selectedLabel = value ? triggerFormatter.format(value) : '';

  return (
    <Select
      value={selectedKey ? { value: selectedKey, label: selectedLabel } : undefined}
      onValueChange={(option) => {
        const match = options.find((o) => o.key === option?.value);
        onValueChange(match?.date);
      }}>
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
