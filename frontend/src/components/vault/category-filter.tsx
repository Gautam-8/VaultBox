"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Heart, 
  User, 
  FileText, 
  Grid2x2 
} from "lucide-react";
import { VaultEntryCategory } from "@/services/vault";

export type VaultCategory = "all" | VaultEntryCategory;

const categories = [
  { id: "all", label: "All", icon: Grid2x2 },
  { id: VaultEntryCategory.FINANCE, label: "Finance", icon: Wallet },
  { id: VaultEntryCategory.HEALTH, label: "Health", icon: Heart },
  { id: VaultEntryCategory.PERSONAL, label: "Personal", icon: User },
  { id: VaultEntryCategory.NOTES, label: "Notes", icon: FileText },
] as const;

interface CategoryFilterProps {
  selectedCategory: VaultCategory;
  onCategoryChange: (category: VaultCategory) => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <Tabs
      value={selectedCategory}
      onValueChange={(value) => onCategoryChange(value as VaultCategory)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-5 lg:w-auto">
        {categories.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
} 