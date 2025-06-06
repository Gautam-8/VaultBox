import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VaultEntryVisibility } from "@/services/vault";

export interface VaultFilters {
  search: string;
  visibility: VaultEntryVisibility[];
}

interface VaultSearchProps {
  filters: VaultFilters;
  onFiltersChange: (filters: VaultFilters) => void;
}

export function VaultSearch({ filters, onFiltersChange }: VaultSearchProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const toggleVisibility = (visibility: VaultEntryVisibility) => {
    const visibilities = filters.visibility.includes(visibility)
      ? filters.visibility.filter((v) => v !== visibility)
      : [...filters.visibility, visibility];
    onFiltersChange({ ...filters, visibility: visibilities });
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vault entries..."
          value={filters.search}
          onChange={handleSearchChange}
          className="pl-8"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Visibility</DropdownMenuLabel>
          {Object.values(VaultEntryVisibility).map((visibility) => (
            <DropdownMenuCheckboxItem
              key={visibility}
              checked={filters.visibility.includes(visibility)}
              onCheckedChange={() => toggleVisibility(visibility)}
            >
              {visibility.replace(/([A-Z])/g, " $1").trim()}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 