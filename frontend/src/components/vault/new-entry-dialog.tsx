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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Plus, Shield, Lock, FileCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vaultService, VaultEntryCategory, VaultEntryVisibility, ContentType } from "@/services/vault";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILE_SIZE = 50 * 1024; // 50KB
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
  content: z.string().optional(),
  file: z.custom<File>().optional(),
  autoDeleteDate: z.date().optional(),
  unlockAfter: z.date().optional(),
  visibility: z.nativeEnum(VaultEntryVisibility),
});

type NewEntryFormValues = z.infer<typeof newEntrySchema>;

export function NewEntryDialog() {
  const [open, setOpen] = React.useState(false);
  const [isFileMode, setIsFileMode] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<'encrypting' | 'saving' | 'done' | null>(null);
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
        
        if (values.autoDeleteDate) {
          formData.append("autoDeleteDate", values.autoDeleteDate.toISOString());
        }
        
        if (values.unlockAfter) {
          formData.append("unlockAfter", values.unlockAfter.toISOString());
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

  const onSubmit = async (values: NewEntryFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Encrypting animation - exactly 1 second
      setCurrentStep('encrypting');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Saving animation - exactly 1 second
      setCurrentStep('saving');
      // Small delay before API call
      await new Promise(resolve => setTimeout(resolve, 200));
      await createEntry(values);
      // Show saving state for remaining time to complete 1 second
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Success animation - exactly 1 second
      setCurrentStep('done');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
      toast.success("Entry created successfully");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create entry");
    } finally {
      setIsSubmitting(false);
      setCurrentStep(null);
    }
  };

  const toggleMode = () => {
    setIsFileMode(!isFileMode);
    form.setValue("content", "");
    form.setValue("file", undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
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

            <div>
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
                        <Input
                          type="file"
                          accept={Object.values(ACCEPTED_FILE_TYPES).join(",")}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size > MAX_FILE_SIZE) {
                              toast.error("File size must be less than 50KB");
                              e.target.value = '';
                              return;
                            }
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
                <FormItem>
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

            {form.watch("visibility") === VaultEntryVisibility.UNLOCK_AFTER && (
              <FormField
                control={form.control}
                name="unlockAfter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unlock After Date and Time</FormLabel>
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
            )}

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
                  <p className="text-sm text-muted-foreground mt-2">
                    {field.value === VaultEntryVisibility.PRIVATE && (
                      "This entry will be accessible only to you. You can read and update the content"
                    )}
                    {field.value === VaultEntryVisibility.SHARED && (
                      "This entry can be viewed and updated by you, and viewed by your trusted contact."
                    )}
                    {field.value === VaultEntryVisibility.UNLOCK_AFTER && (
                      "This entry will be viewable and updatable for you, and viewable by your trusted contact after the unlock period."
                    )}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                  setIsFileMode(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[100px] relative"
              >
                <AnimatePresence mode="wait">
                  {!isSubmitting && (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Entry
                    </motion.div>
                  )}
                  {currentStep === 'encrypting' && (
                    <motion.div
                      key="encrypting-detail"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        <Shield className="h-8 w-8 text-primary animate-pulse" />
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Lock className="h-4 w-4 text-primary absolute bottom-0 right-0" />
                        </motion.div>
                      </div>
                      <h3 className="font-semibold mt-2">Encrypting Your Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Securing your information with end-to-end encryption
                      </p>
                      <motion.div 
                        className="w-full h-1 bg-muted mt-3 rounded-full overflow-hidden"
                      >
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                  {currentStep === 'saving' && (
                    <motion.div
                      key="saving-detail"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-8 w-8 text-primary" />
                        </motion.div>
                        <motion.div
                          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                      <h3 className="font-semibold mt-2">Saving to Vault</h3>
                      <p className="text-sm text-muted-foreground">
                        Storing your encrypted data securely
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.3, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                        />
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
                        />
                      </div>
                    </motion.div>
                  )}
                  {currentStep === 'done' && (
                    <motion.div
                      key="done-detail"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", duration: 0.3 }}
                        >
                          <FileCheck className="h-8 w-8 text-primary" />
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, type: "spring", duration: 0.3 }}
                          className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full"
                        />
                      </div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                        className="font-semibold mt-2"
                      >
                        Successfully Saved!
                      </motion.h3>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                        className="text-sm text-muted-foreground"
                      >
                        Your entry has been securely stored
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </form>
        </Form>

        {isSubmitting && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card p-4 rounded-lg shadow-lg border max-w-[250px]">
              <div className="flex flex-col items-center text-center space-y-3">
                <AnimatePresence mode="wait">
                  {currentStep === 'encrypting' && (
                    <motion.div
                      key="encrypting-detail"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        <Shield className="h-8 w-8 text-primary animate-pulse" />
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Lock className="h-4 w-4 text-primary absolute bottom-0 right-0" />
                        </motion.div>
                      </div>
                      <h3 className="font-semibold mt-2">Encrypting Your Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Securing your information with end-to-end encryption
                      </p>
                      <motion.div 
                        className="w-full h-1 bg-muted mt-3 rounded-full overflow-hidden"
                      >
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                  {currentStep === 'saving' && (
                    <motion.div
                      key="saving-detail"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-8 w-8 text-primary" />
                        </motion.div>
                        <motion.div
                          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                      <h3 className="font-semibold mt-2">Saving to Vault</h3>
                      <p className="text-sm text-muted-foreground">
                        Storing your encrypted data securely
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.3, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                        />
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
                        />
                      </div>
                    </motion.div>
                  )}
                  {currentStep === 'done' && (
                    <motion.div
                      key="done-detail"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", duration: 0.3 }}
                        >
                          <FileCheck className="h-8 w-8 text-primary" />
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, type: "spring", duration: 0.3 }}
                          className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full"
                        />
                      </div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                        className="font-semibold mt-2"
                      >
                        Successfully Saved!
                      </motion.h3>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                        className="text-sm text-muted-foreground"
                      >
                        Your entry has been securely stored
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 