"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { 
  Calendar as CalendarIcon, 
  Download, 
  Trash, 
  Eye, 
  EyeOff,
  History,
  Copy,
  CheckCircle2,
  Loader2,
  Shield,
  FileCheck,
  Clock,
  Share2,
  Lock,
  Wallet,
  Heart,
  User,
  FileText,
  File as FileIcon,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vaultService, VaultEntry, VaultEntryCategory, VaultEntryVisibility, ContentType } from "@/services/vault";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";

const updateEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.nativeEnum(VaultEntryCategory),
  content: z.string().min(1, "Content is required"),
  autoDeleteDate: z.date().optional(),
  visibility: z.nativeEnum(VaultEntryVisibility),
});

type UpdateEntryFormValues = z.infer<typeof updateEntrySchema>;

interface EntryDetailsDialogProps {
  entry: VaultEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function EntryDetailsDialog({ entry, open, onOpenChange }: EntryDetailsDialogProps) {
  type DeleteStep = 'confirming' | 'deleting' | 'done' | 'idle';
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"view" | "edit">("view");
  const [isContentMasked, setIsContentMasked] = React.useState(true);
  const [showHistory, setShowHistory] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateStep, setUpdateStep] = React.useState<'encrypting' | 'saving' | 'done' | null>(null);
  const [deleteStep, setDeleteStep] = React.useState<DeleteStep>('idle');

  const isDeleting = (step: DeleteStep): boolean => step === 'deleting';
  const isConfirmingOrIdle = (step: DeleteStep): boolean => 
    step === 'confirming' || step === 'idle';

  const queryClient = useQueryClient();

  const { data: entryDetails, isLoading } = useQuery({
    queryKey: ["vault-entry", entry?.id],
    queryFn: () => entry ? vaultService.getEntry(entry.id) : null,
    enabled: !!entry,
  });

  const form = useForm<UpdateEntryFormValues>({
    resolver: zodResolver(updateEntrySchema),
    values: entryDetails ? {
      title: entryDetails.title,
      category: entryDetails.category,
      content: entryDetails.encryptedContent || "",
      autoDeleteDate: entryDetails.autoDeleteDate ? new Date(entryDetails.autoDeleteDate) : undefined,
      visibility: entryDetails.visibility,
    } : {
      title: "",
      category: VaultEntryCategory.PERSONAL,
      content: "",
      visibility: VaultEntryVisibility.PRIVATE,
    },
  });

  const { mutate: updateEntry } = useMutation({
    mutationFn: async (values: UpdateEntryFormValues) => {
      try {
        setIsUpdating(true);
        
        // Encrypting animation
        setUpdateStep('encrypting');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Saving animation
        setUpdateStep('saving');
        await vaultService.updateEntry(entry!.id, values);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Success animation
        setUpdateStep('done');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
        queryClient.invalidateQueries({ queryKey: ["vault-entry", entry?.id] });
        toast.success("Entry updated successfully");
        onOpenChange(false);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to update entry");
      } finally {
        setIsUpdating(false);
        setUpdateStep(null);
      }
    }
  });

  const handleDeleteAlertOpenChange = (open: boolean) => {
    if (!open) {
      // Don't allow closing during deletion
      if (isDeleting(deleteStep)) return;
      
      setShowDeleteAlert(false);
      setDeleteStep('idle');
    } else {
      setShowDeleteAlert(true);
      setDeleteStep('confirming');
    }
  };

  const { mutate: deleteEntry } = useMutation({
    mutationFn: async () => {
      setDeleteStep('deleting');
      
      // Perform the deletion
      const result = await vaultService.deleteEntry(entry!.id);

      // Add artificial delay to show the deleting state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set success state
      setDeleteStep('done');

      // Add delay to show success state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return the result
      return result;
    },
    onSuccess: () => {
      // Update UI and close modals
      queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
      setShowDeleteAlert(false);
      onOpenChange(false);
      setDeleteStep('idle');
      toast.success("Entry deleted successfully");
    },
    onError: (error: any) => {
      setDeleteStep('idle');
      toast.error(error.response?.data?.message || "Failed to delete entry");
    }
  });

  const handleDelete = () => {
    deleteEntry();
  };

  const handleCopyContent = async () => {
    if (!entryDetails?.encryptedContent) return;
    try {
      await navigator.clipboard.writeText(entryDetails.encryptedContent);
      toast.success("Content copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  function onSubmit(data: UpdateEntryFormValues) {
    updateEntry(data);
  }

  async function handleDownload() {
    if (!entryDetails || entryDetails.contentType !== ContentType.FILE || !entryDetails.file) return;

    try {
      // Convert base64 to binary
      const binaryStr = atob(entryDetails.encryptedContent);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      // Create blob with proper mime type
      const blob = new Blob([bytes], { type: entryDetails.file.mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Download with proper filename
      const a = document.createElement("a");
      a.href = url;
      a.download = entryDetails.file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download file");
    }
  }

  if (!entry) return null;

  const StatusIcon = statusConfig[entryDetails?.visibility || VaultEntryVisibility.PRIVATE].icon;
  const CategoryIcon = categoryConfig[entryDetails?.category || VaultEntryCategory.PERSONAL].icon;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <VisuallyHidden>
                <DialogTitle>Loading Vault Entry</DialogTitle>
              </VisuallyHidden>
              <div className="relative">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <motion.div
                  className="absolute inset-0 h-8 w-8 rounded-full border-2 border-primary"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Loading Entry</h3>
                <p className="text-sm text-muted-foreground">
                  Decrypting your data securely...
                </p>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    Entry Details
                    {entryDetails?.contentType === ContentType.FILE && (
                      <Badge variant="outline" className="h-6 px-2 py-0">
                        <FileIcon className="mr-1 h-3 w-3" />
                        {entryDetails.file?.name.split('.').pop()?.toUpperCase()}
                      </Badge>
                    )}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowDeleteAlert(true)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "h-6 px-2 py-0",
                      statusConfig[entryDetails?.visibility || VaultEntryVisibility.PRIVATE].color
                    )}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig[entryDetails?.visibility || VaultEntryVisibility.PRIVATE].label}
                  </Badge>
                  <div className={cn(
                    "p-1.5 rounded-md",
                    categoryConfig[entryDetails?.category || VaultEntryCategory.PERSONAL].bgColor
                  )}>
                    <CategoryIcon className={cn(
                      "h-3.5 w-3.5",
                      categoryConfig[entryDetails?.category || VaultEntryCategory.PERSONAL].color
                    )} />
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "view" | "edit")} className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="view">View</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{entryDetails?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {format(new Date(entryDetails?.createdAt || Date.now()), "PPP")}
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
                      {entryDetails?.contentType === ContentType.FILE ? (
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm">{entryDetails.file?.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({formatFileSize(entryDetails.file?.size || 0)})
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownload}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Textarea
                            value={entryDetails?.encryptedContent || ""}
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
                      )}
                    </div>

                    {entryDetails?.autoDeleteDate && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/5 border border-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <CountdownTimer 
                          expiryDate={new Date(entryDetails.autoDeleteDate)}
                          className="text-sm text-destructive"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="mt-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(VaultEntryCategory).map(([key, value]) => (
                                  <SelectItem key={key} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {entryDetails?.contentType === ContentType.TEXT && (
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="autoDeleteDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Auto-Delete Date and Time (Optional)</FormLabel>
                            <FormControl>
                              <DateTimePicker
                                date={field.value}
                                onDateChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visibility</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(VaultEntryVisibility).map(([key, value]) => (
                                  <SelectItem key={key} value={value}>
                                    {value.replace(/([A-Z])/g, " $1").trim()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("view")}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isUpdating}
                          className="min-w-[100px] relative"
                        >
                          <AnimatePresence mode="wait">
                            {!isUpdating && (
                              <motion.div
                                key="default"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center"
                              >
                                Save Changes
                              </motion.div>
                            )}
                            {updateStep === 'encrypting' && (
                              <motion.div
                                key="encrypting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center absolute inset-0 justify-center"
                              >
                                <Shield className="mr-2 h-4 w-4 animate-pulse" />
                                Encrypting...
                              </motion.div>
                            )}
                            {updateStep === 'saving' && (
                              <motion.div
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center absolute inset-0 justify-center"
                              >
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </motion.div>
                            )}
                            {updateStep === 'done' && (
                              <motion.div
                                key="done"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center absolute inset-0 justify-center"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Done!
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>

              {isUpdating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-card p-4 rounded-lg shadow-lg border max-w-[250px]">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <AnimatePresence mode="wait">
                        {updateStep === 'encrypting' && (
                          <motion.div
                            key="encrypting-detail"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center"
                          >
                            <div className="relative">
                              <Shield className="h-8 w-8 text-primary animate-pulse" />
                              <Lock className="h-4 w-4 text-primary absolute bottom-0 right-0 animate-bounce" />
                            </div>
                            <h3 className="font-semibold mt-2">Encrypting Your Changes</h3>
                            <p className="text-sm text-muted-foreground">
                              Securing your updated information
                            </p>
                          </motion.div>
                        )}
                        {updateStep === 'saving' && (
                          <motion.div
                            key="saving-detail"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center"
                          >
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            <h3 className="font-semibold mt-2">Saving Changes</h3>
                            <p className="text-sm text-muted-foreground">
                              Updating your vault entry
                            </p>
                          </motion.div>
                        )}
                        {updateStep === 'done' && (
                          <motion.div
                            key="done-detail"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center"
                          >
                            <div className="relative">
                              <FileCheck className="h-8 w-8 text-primary" />
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full"
                              />
                            </div>
                            <h3 className="font-semibold mt-2">Changes Saved!</h3>
                            <p className="text-sm text-muted-foreground">
                              Your entry has been updated securely
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={showDeleteAlert} 
        onOpenChange={handleDeleteAlertOpenChange}
      >
        <AlertDialogContent>
          {deleteStep === 'deleting' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <VisuallyHidden>
                <AlertDialogTitle>Deleting Entry</AlertDialogTitle>
              </VisuallyHidden>
              <div className="relative">
                <Loader2 className="h-8 w-8 text-destructive animate-spin" />
                <motion.div
                  className="absolute inset-0 h-8 w-8 rounded-full border-2 border-destructive"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-destructive">Deleting Entry</h3>
                <p className="text-sm text-muted-foreground">
                  Securely removing your data...
                </p>
              </div>
            </div>
          )}
          {deleteStep === 'done' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <VisuallyHidden>
                <AlertDialogTitle>Entry Deleted</AlertDialogTitle>
              </VisuallyHidden>
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center">
                  <Trash className="h-4 w-4 text-destructive-foreground" />
                </div>
                <motion.div
                  className="absolute -inset-2 rounded-full border-2 border-destructive"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              </motion.div>
              <div className="text-center">
                <h3 className="font-semibold">Entry Deleted</h3>
                <p className="text-sm text-muted-foreground">
                  Your data has been securely removed
                </p>
              </div>
            </div>
          )}
          {isConfirmingOrIdle(deleteStep) && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  vault entry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteStep === 'deleting'}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={deleteStep === 'deleting'}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 