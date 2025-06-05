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
import { Calendar as CalendarIcon, Download, Trash } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vaultService, VaultEntry, VaultEntryCategory, VaultEntryVisibility, ContentType } from "@/services/vault";
import { toast } from "sonner";
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

export function EntryDetailsDialog({ entry, open, onOpenChange }: EntryDetailsDialogProps) {
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: entryDetails } = useQuery({
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

  const { mutate: updateEntry, isPending: isUpdating } = useMutation({
    mutationFn: (values: UpdateEntryFormValues) => 
      vaultService.updateEntry(entry!.id, values),
    onSuccess: () => {
      toast.success("Entry updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
      queryClient.invalidateQueries({ queryKey: ["vault-entry", entry?.id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update entry");
    },
  });

  const { mutate: deleteEntry, isPending: isDeleting } = useMutation({
    mutationFn: () => vaultService.deleteEntry(entry!.id),
    onSuccess: () => {
      toast.success("Entry deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete entry");
    },
  });

  function onSubmit(data: UpdateEntryFormValues) {
    updateEntry(data);
  }

  async function handleDownload() {
    if (!entryDetails || entryDetails.contentType !== ContentType.FILE) return;

    try {
      const blob = new Blob([atob(entryDetails.encryptedContent)], { type: entryDetails.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = entryDetails.fileName || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download file");
    }
  }

  if (!entry) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Entry Details</DialogTitle>
            <DialogDescription>
              View or update your vault entry. All content is encrypted.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-2 mb-4">
            {entryDetails?.contentType === ContentType.FILE && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

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
                    <FormLabel>Auto-Delete Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              vault entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEntry()}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 