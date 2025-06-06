"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertTriangle,
  Eye,
  EyeOff,
  History,
  Calendar,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { vaultService, VaultEntry, VaultEntryCategory, VaultEntryVisibility, ContentType } from "@/services/vault";
import { format } from "date-fns";
import { EntryDetailsDialog } from "./entry-details-dialog";
import { VaultSearch, type VaultFilters } from "./vault-search";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { CategoryFilter, type VaultCategory } from "./category-filter";

const statusConfig = {
  [VaultEntryVisibility.PRIVATE]: { 
    color: "bg-green-500/10 text-green-500", 
    icon: Lock,
    label: "Private"
  },
  [VaultEntryVisibility.SHARED]: { 
    color: "bg-blue-500/10 text-blue-500", 
    icon: Share2,
    label: "Shared"
  },
  [VaultEntryVisibility.UNLOCK_AFTER]: { 
    color: "bg-yellow-500/10 text-yellow-500", 
    icon: Clock,
    label: "Time Lock"
  },
};

const categoryConfig = {
  [VaultEntryCategory.FINANCE]: { 
    icon: Wallet,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10" 
  },
  [VaultEntryCategory.HEALTH]: { 
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10"
  },
  [VaultEntryCategory.PERSONAL]: { 
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  [VaultEntryCategory.NOTES]: { 
    icon: FileText,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
};

export function VaultEntryGrid() {
  const [selectedEntry, setSelectedEntry] = React.useState<VaultEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<VaultCategory>("all");
  const [filters, setFilters] = React.useState<VaultFilters>({
    search: "",
    visibility: [],
  });
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { data: entries = [], isLoading, isFetching } = useQuery({
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
      if (selectedCategory !== "all" && entry.category !== selectedCategory) {
        return false;
      }

      // Visibility filter
      if (filters.visibility.length > 0 && !filters.visibility.includes(entry.visibility)) {
        return false;
      }

      return true;
    });
  }, [entries, filters, selectedCategory]);

  const handleEntryClick = (entry: VaultEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="h-[180px] animate-pulse">
                <CardHeader className="space-y-2 p-3">
                  <div className="h-6 bg-muted rounded w-24" />
                  <div className="h-6 bg-muted rounded w-32" />
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="mt-auto pt-2 border-t">
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <VaultSearch filters={filters} onFiltersChange={setFilters} />
      
      {/* Overlay loading indicator when refreshing */}
      <AnimatePresence>
        {isFetching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center"
          >
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-full shadow-lg border">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Updating vault...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-full flex flex-col items-center justify-center py-12 text-center"
            >
              <File className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No entries found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </motion.div>
          ) : (
            filteredEntries.map((entry, index) => {
              const StatusIcon = statusConfig[entry.visibility].icon;
              const CategoryIcon = categoryConfig[entry.category].icon;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card 
                    className="h-[190px] p-3 flex flex-col cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                    onClick={() => handleEntryClick(entry)}
                  >
                    {/* Row 1: Category, Visibility & Lock */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "p-1 rounded-md",
                            categoryConfig[entry.category].bgColor
                          )}>
                            <CategoryIcon className={cn(
                              "h-3 w-3",
                              categoryConfig[entry.category].color
                            )} />
                          </div>
                          <span className="text-xs">
                            {entry.category}
                          </span>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "h-5 px-2 text-xs",
                            statusConfig[entry.visibility].color
                          )}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig[entry.visibility].label}
                        </Badge>
                      </div>
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>

                    {/* Row 2: Title & File Size */}
                    <div className="flex justify-between items-center mt-3">
                      <h3 className="text-sm font-medium truncate flex-1 mr-2">
                        {entry.title}
                      </h3>
                      {entry.contentType === ContentType.FILE && (
                        <div className="text-xs text-muted-foreground shrink-0">
                          PDF {formatFileSize(entry.file?.size || 0)}
                        </div>
                      )}
                    </div>

                    {/* Time Information */}
                    {entry.visibility === VaultEntryVisibility.UNLOCK_AFTER && entry.unlockAfter && (
                      <div className="space-y-0 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Unlocks {format(new Date(entry.unlockAfter), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="text-xs text-destructive">
                            <CountdownTimer expiryDate={new Date(entry.unlockAfter)} /> remaining
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Auto Delete Timer (only show if not a time lock entry) */}
                    {entry.autoDeleteDate && entry.visibility !== VaultEntryVisibility.UNLOCK_AFTER && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        <span className="text-xs text-destructive">
                          <CountdownTimer expiryDate={new Date(entry.autoDeleteDate)} /> remaining
                        </span>
                      </div>
                    )}

                    {/* Row 3: Created & Updated Dates */}
                    <div className="mt-auto flex justify-between text-[10px] text-muted-foreground">
                      <span>Created: {format(new Date(entry.createdAt), "MMM d, yyyy")}</span>
                      <span>Updated: {format(new Date(entry.updatedAt), "MMM d, yyyy")}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </AnimatePresence>

      {selectedEntry && (
        <EntryDetailsDialog
          entry={selectedEntry}
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              // Small delay to allow close animation
              setTimeout(() => {
                setSelectedEntry(null);
              }, 300);
            }
          }}
        />
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
} 