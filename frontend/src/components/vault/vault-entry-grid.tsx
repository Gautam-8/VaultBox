"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Heart, 
  User, 
  FileText,
  Lock,
  Share2,
  Clock,
  File,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { vaultService, VaultEntry, VaultEntryCategory, VaultEntryVisibility, ContentType } from "@/services/vault";
import { format } from "date-fns";
import { EntryDetailsDialog } from "./entry-details-dialog";
import { VaultSearch, type VaultFilters } from "./vault-search";
import { CountdownTimer } from "@/components/ui/countdown-timer";

const statusConfig = {
  [VaultEntryVisibility.PRIVATE]: { color: "bg-green-500/10 text-green-500", icon: Lock },
  [VaultEntryVisibility.SHARED]: { color: "bg-blue-500/10 text-blue-500", icon: Share2 },
  [VaultEntryVisibility.UNLOCK_AFTER]: { color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
};

const categoryIcons = {
  [VaultEntryCategory.FINANCE]: Wallet,
  [VaultEntryCategory.HEALTH]: Heart,
  [VaultEntryCategory.PERSONAL]: User,
  [VaultEntryCategory.NOTES]: FileText,
};

export function VaultEntryGrid() {
  const [selectedEntry, setSelectedEntry] = React.useState<VaultEntry | null>(null);
  const [filters, setFilters] = React.useState<VaultFilters>({
    search: "",
    categories: [],
    visibility: [],
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["vault-entries"],
    queryFn: () => vaultService.getAllEntries(),
  });

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      // Search filter
      if (filters.search && !entry.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(entry.category)) {
        return false;
      }

      // Visibility filter
      if (filters.visibility.length > 0 && !filters.visibility.includes(entry.visibility)) {
        return false;
      }

      return true;
    });
  }, [entries, filters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-6 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <VaultSearch filters={filters} onFiltersChange={setFilters} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map((entry, index) => {
            const StatusIcon = statusConfig[entry.visibility].icon;
            const CategoryIcon = categoryIcons[entry.category];

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => setSelectedEntry(entry)}
              >
                <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-0 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "h-6",
                          statusConfig[entry.visibility].color
                        )}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {entry.visibility.replace(/([A-Z])/g, " $1").trim()}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {entry.contentType === ContentType.FILE && (
                          <File className="h-4 w-4 text-muted-foreground" />
                        )}
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold leading-none tracking-tight">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {entry.maskedPreview}
                    </p>
                    {entry.autoDeleteDate && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <CountdownTimer 
                          expiryDate={new Date(entry.autoDeleteDate)}
                          className="text-sm"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {format(new Date(entry.createdAt), "PPP")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <EntryDetailsDialog
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      />
    </>
  );
} 