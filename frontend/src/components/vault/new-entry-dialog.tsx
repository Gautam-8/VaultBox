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
  DialogTrigger,
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
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vaultService, VaultEntryCategory, VaultEntryVisibility, ContentType } from "@/services/vault";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg,.jpeg",
  "image/png": ".png",
  "image/gif": ".gif",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt"
};

const newEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.nativeEnum(VaultEntryCategory),
  content: z.string().min(1, "Content is required"),
  file: z
    .custom<File>((v) => v instanceof File, {
      message: "Invalid file",
    })
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, "File size must be less than 50MB")
    .refine(
      (file) => !file || Object.keys(ACCEPTED_FILE_TYPES).includes(file.type),
      "File type not supported"
    )
    .optional(),
  autoDeleteDate: z.date().optional(),
  visibility: z.nativeEnum(VaultEntryVisibility),
  unlockAfterDays: z.number().optional(),
});

type NewEntryFormValues = z.infer<typeof newEntrySchema>;

export function NewEntryDialog() {
  const [open, setOpen] = React.useState(false);
  const [isFileMode, setIsFileMode] = React.useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<NewEntryFormValues>({
    resolver: zodResolver(newEntrySchema),
    defaultValues: {
      title: "",
      category: VaultEntryCategory.PERSONAL,
      content: "",
      visibility: VaultEntryVisibility.PRIVATE,
    },
  });

  const { mutate: createEntry, isPending } = useMutation({
    mutationFn: async (values: NewEntryFormValues) => {
      if (isFileMode && values.file) {
        const formData = new FormData();
        formData.append("file", values.file);
        formData.append("title", values.title);
        formData.append("category", values.category);
        formData.append("visibility", values.visibility);
        formData.append("contentType", ContentType.FILE);
        
        if (values.autoDeleteDate) {
          formData.append("autoDeleteDate", values.autoDeleteDate.toISOString());
        }
        if (values.unlockAfterDays) {
          formData.append("unlockAfterDays", values.unlockAfterDays.toString());
        }
        
        return vaultService.createEntry(formData);
      }

      return vaultService.createEntry({
        ...values,
        content: values.content || "",
        contentType: ContentType.TEXT,
      });
    },
    onSuccess: () => {
      toast.success("Entry created successfully");
      queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
      setOpen(false);
      form.reset();
      setIsFileMode(false);
    },
    onError: (error: any) => {
      console.error("Error creating entry:", error);
      toast.error(error.response?.data?.message || "Failed to create entry");
    },
  });

  const visibility = form.watch("visibility");

  function onSubmit(data: NewEntryFormValues) {
    createEntry(data);
  }

  const toggleMode = () => {
    setIsFileMode(!isFileMode);
    form.setValue("content", "");
    form.setValue("file", undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Entry</DialogTitle>
          <DialogDescription>
            Add a new entry to your secure vault. All content will be encrypted.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
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
                        <SelectValue placeholder="Select a category" />
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Content</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleMode}
                >
                  Switch to {isFileMode ? "Text" : "File"} Mode
                </Button>
              </div>

              {isFileMode ? (
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          accept={Object.values(ACCEPTED_FILE_TYPES).join(",")}
                          onFileSelect={(file) => {
                            onChange(file);
                            if (file) {
                              form.setValue("content", file.name);
                            } else {
                              form.setValue("content", "");
                            }
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Enter secure content"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
                        <SelectValue placeholder="Select visibility" />
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

            {visibility === VaultEntryVisibility.UNLOCK_AFTER && (
              <FormField
                control={form.control}
                name="unlockAfterDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days Until Unlock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Enter number of days"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                  setIsFileMode(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 