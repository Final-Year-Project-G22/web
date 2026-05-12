"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagSelectOption {
  id: string;
  label: string;
  group?: string;
}

interface TagSelectProps {
  options: TagSelectOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function TagSelect({
  options,
  selected,
  onChange,
  placeholder = "Search...",
}: TagSelectProps) {
  const [query, setQuery] = useState("");

  const selectedSet = new Set(selected);

  const available = query
    ? options.filter(
        (o) =>
          !selectedSet.has(o.id) &&
          (o.label.toLowerCase().includes(query.toLowerCase()) ||
            o.group?.toLowerCase().includes(query.toLowerCase()))
      )
    : options.filter((o) => !selectedSet.has(o.id));

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
        {selected.map((id) => {
          const opt = options.find((o) => o.id === id);
          if (!opt) return null;
          return (
            <Badge key={id} variant="secondary" className="gap-1 pr-1">
              {opt.label}
              <button type="button" onClick={() => toggle(id)} className="p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-9 pl-8"
        />
      </div>

      <div className="max-h-48 overflow-auto rounded-md border">
        {available.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No items found.</p>
        ) : (
          <ul>
            {available.map((o) => (
              <li
                key={o.id}
                onClick={() => toggle(o.id)}
                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent"
              >
                <span>{o.label}</span>
                {o.group ? (
                  <span className="text-xs text-muted-foreground">{o.group}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
