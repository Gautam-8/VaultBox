"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Mail, Clock, ArrowRight, FileText, Calendar, Eye, UserX } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { trustedContactService } from "@/services/trusted-contact";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays } from "date-fns";

const requestAccessSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type RequestAccessFormValues = z.infer<typeof requestAccessSchema>;

export default function EmergencyAccessPage() {
  const [email, setEmail] = React.useState<string>("");
  
  const form = useForm<RequestAccessFormValues>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: {
      email: "",
    },
  });

  // Query to check if user is a trusted contact
  const { data: accessCheck, isLoading: isCheckingAccess } = useQuery({
    queryKey: ["trusted-contact-check"],
    queryFn: () => trustedContactService.checkAccess(),
  });

  // Query for shared entries
  const { data: sharedEntries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ["shared-entries"],
    queryFn: () => trustedContactService.getSharedEntries(),
    enabled: accessCheck?.isTrustedContact ?? false,
  });

  // Query for access status
  const { data: accessStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["access-status", email],
    queryFn: () => email ? trustedContactService.requestAccess(email) : null,
    enabled: false,
  });

  const { mutate: requestAccess, isPending } = useMutation({
    mutationFn: (values: RequestAccessFormValues) => 
      trustedContactService.requestAccess(values.email),
    onSuccess: (response) => {
      setEmail(form.getValues("email"));
      if (response.status === "granted") {
        toast.success("Access granted! Loading shared entries...");
        refetchStatus();
      } else {
        toast.success("Access request sent successfully. The vault owner will be notified.");
        refetchStatus();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to request access");
    },
  });

  function onSubmit(data: RequestAccessFormValues) {
    requestAccess(data);
  }

  // Calculate progress percentage if we have status data
  const progressPercentage = React.useMemo(() => {
    if (!accessStatus || accessStatus.status === "granted") return 100;
    return Math.min((accessStatus.inactiveDays || 0) / (accessStatus.unlockAfterDays || 1) * 100, 100);
  }, [accessStatus]);

  // Calculate next check time (midnight tonight)
  const nextCheckTime = React.useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }, []);

  // Loading state
  if (isCheckingAccess || isLoadingEntries) {
    return <LoadingState />;
  }

  // If user is not a trusted contact, show the not-authorized view
  if (!accessCheck?.isTrustedContact) {
    return (
      <div className="min-h-screen w-full grid place-items-center p-4 relative bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 text-center pb-8">
            <div className="w-12 h-12 mx-auto bg-yellow-100 rounded-xl flex items-center justify-center">
              <UserX className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Not a Trusted Contact</h2>
              <p className="text-sm text-muted-foreground">
                You are not currently designated as a trusted contact for any vault.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-medium">What is a Trusted Contact?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>A person designated to access someone's vault in emergencies</li>
                <li>Must be explicitly added by a vault owner</li>
                <li>Can request access if the owner becomes inactive</li>
                <li>Receives notifications about access requests and grants</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                If you believe you should have access, please ensure the vault owner has added your correct email address as their trusted contact.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show shared entries if we have access
  if (sharedEntries?.length || (accessStatus?.status === "granted")) {
    return <SharedEntriesView entries={sharedEntries || []} />;
  }

  // Show vault owner information and request access form
  return (
    <div className="min-h-screen w-full grid place-items-center p-4 relative bg-background overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20">
          <div className="absolute inset-0 bg-primary rounded-full blur-3xl animate-blob" />
          <div className="absolute inset-0 bg-secondary rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute inset-0 bg-accent rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-3 text-center pb-8">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Emergency Access</h2>
              <p className="text-sm text-muted-foreground">
                You are a trusted contact for the following vaults:
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* List vault owners */}
            <div className="space-y-4">
              {accessCheck.vaultOwners.map((owner) => (
                <div key={owner.email} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{owner.email}</span>
                    <Badge variant={owner.isUnlockActive ? "default" : "secondary"}>
                      {owner.isUnlockActive ? "Access Granted" : "Pending"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Unlock after {owner.unlockAfterDays} days of inactivity</span>
                    </div>
                    {owner.lastRequestedAt && (
                      <div className="mt-1">
                        Last requested: {format(new Date(owner.lastRequestedAt), "PPp")}
                      </div>
                    )}
                  </div>
                  {!owner.isUnlockActive && (
                    <Button
                      className="w-full mt-2"
                      onClick={() => {
                        form.setValue("email", owner.email);
                        onSubmit({ email: owner.email });
                      }}
                    >
                      Request Access
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {email && accessStatus && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Access Request Status</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Access will be granted after {accessStatus.unlockAfterDays} days of inactivity. 
                    Current inactive days: {accessStatus.inactiveDays}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Next status check: {format(nextCheckTime, "PPpp")}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setEmail("")}>
                    New Request
                  </Button>
                  <Button onClick={() => refetchStatus()}>
                    Check Status
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SharedEntriesView({ entries }: { entries: any[] }) {
  return (
    <div className="min-h-screen w-full p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">Shared Vault Entries</h1>
          <p className="text-muted-foreground">
            Access to these entries has been granted through emergency access.
          </p>
        </motion.div>

        {entries.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto grid place-items-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-2">No Shared Entries Yet</h3>
            <p className="text-sm text-muted-foreground">
              You have been granted access, but no entries have been shared yet.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{entry.title}</h3>
                    </div>
                    <Badge variant="outline">
                      {entry.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {entry.content}
                      </div>
                      {entry.file && (
                        <Button variant="outline" size="sm" className="mt-2">
                          <Eye className="mr-2 h-4 w-4" />
                          View File
                        </Button>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {format(new Date(entry.createdAt), "PPP")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen w-full p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
} 