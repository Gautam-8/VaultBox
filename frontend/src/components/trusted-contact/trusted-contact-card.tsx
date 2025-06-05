"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, UserPlus, UserX, Clock, Shield } from "lucide-react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trustedContactService, TrustedContact } from "@/services/trusted-contact";
import { Badge } from "@/components/ui/badge";

const trustedContactSchema = z.object({
  contactEmail: z.string().email("Please enter a valid email address"),
  unlockAfterDays: z.number().min(1, "Must be at least 1 day"),
});

type TrustedContactFormValues = z.infer<typeof trustedContactSchema>;

export function TrustedContactCard() {
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: trustedContact, isLoading } = useQuery<TrustedContact | null>({
    queryKey: ["trusted-contact"],
    queryFn: () => trustedContactService.getTrustedContact(),
  });

  const form = useForm<TrustedContactFormValues>({
    resolver: zodResolver(trustedContactSchema),
    defaultValues: {
      contactEmail: "",
      unlockAfterDays: 30,
    },
  });

  const { mutate: addContact, isPending: isAdding } = useMutation({
    mutationFn: (values: TrustedContactFormValues) => 
      trustedContactService.addTrustedContact(values),
    onSuccess: () => {
      toast.success("Trusted contact added successfully");
      queryClient.invalidateQueries({ queryKey: ["trusted-contact"] });
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add trusted contact");
    },
  });

  const { mutate: updateContact, isPending: isUpdating } = useMutation({
    mutationFn: (values: TrustedContactFormValues) => 
      trustedContactService.updateTrustedContact(values),
    onSuccess: () => {
      toast.success("Trusted contact updated successfully");
      queryClient.invalidateQueries({ queryKey: ["trusted-contact"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update trusted contact");
    },
  });

  const { mutate: removeContact, isPending: isRemoving } = useMutation({
    mutationFn: () => trustedContactService.removeTrustedContact(),
    onSuccess: () => {
      toast.success("Trusted contact removed successfully");
      queryClient.invalidateQueries({ queryKey: ["trusted-contact"] });
      setShowRemoveDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove trusted contact");
    },
  });

  const { mutate: grantAccess, isPending: isGranting } = useMutation({
    mutationFn: () => trustedContactService.grantAccess(trustedContact!.contactEmail),
    onSuccess: () => {
      toast.success("Access granted successfully");
      queryClient.invalidateQueries({ queryKey: ["trusted-contact"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to grant access");
    },
  });

  function onSubmit(data: TrustedContactFormValues) {
    if (trustedContact) {
      updateContact(data);
    } else {
      addContact(data);
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <h3 className="text-lg font-semibold">Trusted Contact</h3>
          <p className="text-sm text-muted-foreground">
            Add a trusted contact who can request access to your vault in case of emergency.
          </p>
        </CardHeader>
        <CardContent>
          {trustedContact ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{trustedContact.contactEmail}</span>
                </div>
                <Badge variant={trustedContact.isUnlockActive ? 'default' : 'secondary'}>
                  {trustedContact.isUnlockActive ? 'Active' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Unlock after {trustedContact.unlockAfterDays} days of inactivity</span>
              </div>
              {trustedContact.lastRequestedAt && (
                <p className="text-sm text-muted-foreground">
                  Last access request: {new Date(trustedContact.lastRequestedAt).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                {!trustedContact.isUnlockActive && trustedContact.lastRequestedAt && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => grantAccess()}
                    disabled={isGranting}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isGranting ? "Granting..." : "Grant Access"}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRemoveDialog(true)}
                  disabled={isRemoving}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {isRemoving ? "Removing..." : "Remove Contact"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="Enter their email address"
                  {...form.register("contactEmail")}
                />
                {form.formState.errors.contactEmail && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contactEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unlockAfterDays">Days Until Unlock</Label>
                <Input
                  id="unlockAfterDays"
                  type="number"
                  min={1}
                  placeholder="Enter number of days"
                  {...form.register("unlockAfterDays", { valueAsNumber: true })}
                />
                {form.formState.errors.unlockAfterDays && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.unlockAfterDays.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isAdding || isUpdating}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isAdding ? "Adding..." : isUpdating ? "Updating..." : "Add Contact"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Trusted Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove their emergency access to your vault. You can add them back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeContact()}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Contact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 