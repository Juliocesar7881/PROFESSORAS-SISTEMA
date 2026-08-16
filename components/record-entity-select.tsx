"use client";

import { Plus } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CREATE_VALUE = "__create_entity__";
const EMPTY_VALUE = "__empty_entity__";

type RecordEntityItem = {
  id: string;
  label: string;
  supportingText?: string;
};

export function RecordEntitySelect({
  value,
  label,
  placeholder,
  items,
  emptyMessage,
  actionLabel,
  actionHint,
  onSelect,
  onAction,
}: {
  value: string;
  label: string;
  placeholder: string;
  items: RecordEntityItem[];
  emptyMessage: string;
  actionLabel: string;
  actionHint: string;
  onSelect: (id: string) => void;
  onAction: () => void;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => {
        if (!nextValue) return;
        if (nextValue === CREATE_VALUE) {
          onAction();
          return;
        }
        if (nextValue !== EMPTY_VALUE) onSelect(nextValue);
      }}
    >
      <SelectTrigger
        aria-label={label}
        className="h-11 w-full rounded-xl border-[#dcd6e8] bg-white px-3.5 text-sm font-bold text-[#17213f] shadow-sm transition-[border-color,box-shadow,background-color] duration-200 hover:border-[#b9a9f2] focus-visible:border-[#6757c8] focus-visible:ring-4 focus-visible:ring-[#6757c8]/15"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false} className="min-w-[var(--anchor-width)] rounded-xl border border-[#e4deef] p-1 shadow-[0_22px_60px_-24px_rgba(43,35,91,0.38)]">
        <SelectGroup>
          <SelectItem
            value={CREATE_VALUE}
            className="mb-1 min-h-14 cursor-pointer rounded-lg border border-[#d7cdf7] bg-[#f3efff] px-2.5 py-2 text-[#4f3ca6] data-highlighted:bg-[#e9e2ff] data-highlighted:text-[#43358e]"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#6757c8] shadow-sm">
              <Plus className="size-4" />
            </span>
            <span className="min-w-0 whitespace-normal">
              <strong className="block text-sm font-black">{actionLabel}</strong>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#746aa1]">{actionHint}</span>
            </span>
          </SelectItem>
          <SelectSeparator />
          {items.length ? items.map((item) => (
            <SelectItem key={item.id} value={item.id} className="min-h-11 cursor-pointer px-2.5 py-2">
              <span className="min-w-0 whitespace-normal">
                <strong className="block truncate text-sm font-bold">{item.label}</strong>
                {item.supportingText ? <span className="mt-0.5 block truncate text-[11px] font-medium text-[#7b788c]">{item.supportingText}</span> : null}
              </span>
            </SelectItem>
          )) : (
            <SelectItem value={EMPTY_VALUE} disabled className="min-h-12 px-3 py-2 text-xs font-semibold text-[#7b788c] opacity-100">
              {emptyMessage}
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
