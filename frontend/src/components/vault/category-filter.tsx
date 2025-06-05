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

export type VaultCategory = "all" | "finance" | "health" | "personal" | "notes";

const categories = [
  { id: "all", label: "All", icon: Grid2x2 },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "health", label: "Health", icon: Heart },
  { id: "personal", label: "Personal", icon: User },
  { id: "notes", label: "Notes", icon: FileText },
] as const;

export function CategoryFilter() {
  const [category, setCategory] = React.useState<VaultCategory>("all");

  return (
    <Tabs
      value={category}
      onValueChange={(value) => setCategory(value as VaultCategory)}
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