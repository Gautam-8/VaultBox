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
  LucideIcon,
  Download,
  Shield,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { trustedContactService } from "@/services/trusted-contact";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { ContentType } from "@/types/vault";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
  contentType: ContentType;
  file?: {
    name: string;
    mimeType: string;
    size?: number;
  } | null;
  autoDeleteDate?: string;
  unlockAfter?: string;
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
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"details" | "content">("details");

  const handleCopyContent = async () => {
    if (!entry?.encryptedContent) return;
    try {
      await navigator.clipboard.writeText(entry.encryptedContent);
      toast.success("Content copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  const handleDownload = async () => {
    if (!entry || entry.contentType !== ContentType.FILE || !entry.file) return;

    try {
      setIsDownloading(true);
      
      // Convert base64 to binary
      const binaryStr = atob(entry.encryptedContent);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      // Create blob with proper mime type
      const blob = new Blob([bytes], { type: entry.file.mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Download with proper filename
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!entry) return null;

  const CategoryIcon = categoryConfig[entry.category]?.icon || FileText;
  const isFile = entry.contentType === ContentType.FILE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Shared Entry
              {isFile && entry.file && (
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

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "details" | "content")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{entry.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Shared by {entry.vaultOwner.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(entry.createdAt), "PPP")}
                </p>
              </div>

              {entry.unlockAfter && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/5 border border-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <CountdownTimer 
                    expiryDate={new Date(entry.unlockAfter)}
                    className="text-sm text-yellow-500"
                  />
                </div>
              )}

              {entry.autoDeleteDate && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/5 border border-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CountdownTimer 
                    expiryDate={new Date(entry.autoDeleteDate)}
                    className="text-sm text-destructive"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last updated: {format(new Date(entry.updatedAt), "PPP")}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            {isFile ? (
              <div className="space-y-2">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{entry.file?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.file?.size ? formatFileSize(entry.file.size) : 'Unknown size'})
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 