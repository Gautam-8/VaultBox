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
import { Shield, Mail, Clock, ArrowRight, FileText, Calendar, Eye } from "lucide-react";
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

  // Query for shared entries
  const { data: sharedEntries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ["shared-entries"],
    queryFn: () => trustedContactService.getSharedEntries(),
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
  if (isLoadingEntries) {
    return <LoadingState />;
  }

  // Show shared entries if we have access
  if (sharedEntries?.length || (accessStatus?.status === "granted")) {
    return <SharedEntriesView entries={sharedEntries || []} />;
  }

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
                Request access to a vault as a trusted contact
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {accessStatus?.status === "pending" ? (
              <div className="space-y-6">
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
            ) : (
              <>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-9"
                        {...form.register("email")}
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Requesting Access..." : "Request Access"}
                  </Button>
                </form>

                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground">What happens next?</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>The vault owner will be notified of your request</li>
                      <li>If they don't respond within the configured time, you'll gain access to shared entries</li>
                      <li>You'll receive an email notification when access is granted</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground">Important Note</h3>
                    <p className="text-sm text-muted-foreground">
                      This feature is designed for emergency situations. Please ensure you're authorized
                      as a trusted contact before requesting access.
                    </p>
                  </div>
                </div>
              </>
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