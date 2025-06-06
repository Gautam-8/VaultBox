"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Share2,
  Eye,
  EyeOff,
  FileText,
  Copy,
  Calendar,
  Loader2,
  File as FileIcon,
  LucideIcon
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

type CategoryKey = 'FINANCE' | 'HEALTH' | 'PERSONAL' | 'NOTES';

interface SharedEntry {
  id: string;
  title: string;
  category: CategoryKey;
  encryptedContent: string;
  createdAt: string;
  updatedAt: string;
  vaultOwner: {
    email: string;
  };
  file?: {
    name: string;
    mimeType: string;
  };
}

interface SharedEntryDialogProps {
  entry: SharedEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryConfig: Record<CategoryKey, {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}> = {
  FINANCE: { 
    icon: FileText,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10" 
  },
  HEALTH: { 
    icon: FileText,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10"
  },
  PERSONAL: { 
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  NOTES: { 
    icon: FileText,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
};

export function SharedEntryDialog({ entry, open, onOpenChange }: SharedEntryDialogProps) {
  const [isContentMasked, setIsContentMasked] = React.useState(true);

  const handleCopyContent = async () => {
    if (!entry?.encryptedContent) return;
    try {
      await navigator.clipboard.writeText(entry.encryptedContent);
      toast.success("Content copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  if (!entry) return null;

  const CategoryIcon = categoryConfig[entry.category]?.icon || FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Shared Entry
              {entry.file && (
                <Badge variant="outline" className="h-6 px-2 py-0">
                  <FileIcon className="mr-1 h-3 w-3" />
                  {entry.file.name.split('.').pop()?.toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
              <Share2 className="mr-1 h-3 w-3" />
              Shared
            </Badge>
            <div className={cn(
              "p-1.5 rounded-md",
              categoryConfig[entry.category]?.bgColor || "bg-purple-500/10"
            )}>
              <CategoryIcon className={cn(
                "h-3.5 w-3.5",
                categoryConfig[entry.category]?.color || "text-purple-500"
              )} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <h3 className="text-lg font-semibold">{entry.title}</h3>
            <p className="text-sm text-muted-foreground">
              Shared by {entry.vaultOwner.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(entry.createdAt), "PPP")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Content</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCopyContent}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsContentMasked(!isContentMasked)}
                >
                  {isContentMasked ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Textarea
                value={entry.encryptedContent || ""}
                className="min-h-[200px] font-mono"
                readOnly
              />
              {isContentMasked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setIsContentMasked(false)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Reveal Content
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Last updated: {format(new Date(entry.updatedAt), "PPP")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 