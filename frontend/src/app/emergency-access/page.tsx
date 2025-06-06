"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Shield, 
  Mail, 
  Clock, 
  ArrowRight,
  FileText,
  Calendar,
  Eye,
  UserX,
  Share2,
  Loader2,
  File,
  LucideIcon,
  Grid2x2,
  Users,
  Lock,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trustedContactService, SharedVaultEntry } from "@/services/trusted-contact";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays } from "date-fns";
import { SharedEntryDialog } from "@/components/shared-entry/shared-entry-dialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const requestAccessSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type RequestAccessFormValues = z.infer<typeof requestAccessSchema>;

type CategoryKey = 'FINANCE' | 'HEALTH' | 'PERSONAL' | 'NOTES';
type TabValue = 'shared';

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

// Frontend-specific shared entry type
interface SharedEntryView extends Omit<SharedVaultEntry, 'category' | 'createdAt' | 'updatedAt'> {
  category: CategoryKey;
  createdAt: string;
  updatedAt: string;
  file?: {
    name: string;
    mimeType: string;
    size?: number;
  };
}

interface RequestAccessViewProps {
  vaultOwner: {
    email: string;
    unlockAfterDays: number;
    lastRequestedAt: Date | null;
    isUnlockActive: boolean;
  };
  onSubmit: (data: RequestAccessFormValues) => void;
  isPending: boolean;
  form: any;
}

interface SharedEntriesViewProps {
  sharedEntries: SharedEntryView[];
  vaultOwner: {
    email: string;
    unlockAfterDays: number;
    isUnlockActive: boolean;
  };
  handleEntryClick: (entry: SharedEntryView) => void;
  selectedEntry: SharedEntryView | null;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  setSelectedEntry: (entry: SharedEntryView | null) => void;
}

export default function EmergencyAccessPage() {
  const [email, setEmail] = React.useState<string>("");
  const [selectedEntry, setSelectedEntry] = React.useState<SharedEntryView | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabValue>('shared');
  
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

  // Query for shared entries with type conversion
  const { data: sharedEntries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ["shared-entries"],
    queryFn: async () => {
      const entries = await trustedContactService.getSharedEntries();
      return entries.map(entry => ({
        ...entry,
        createdAt: new Date(entry.createdAt).toISOString(),
        updatedAt: new Date(entry.updatedAt).toISOString(),
        category: entry.category.toUpperCase() as CategoryKey
      }));
    },
    enabled: accessCheck?.isTrustedContact ?? false,
  });

  const { mutate: requestAccess, isPending } = useMutation({
    mutationFn: (values: RequestAccessFormValues) => 
      trustedContactService.requestAccess(values.email),
    onSuccess: (response) => {
      setEmail(form.getValues("email"));
      toast.success("Access request sent successfully. The vault owner will be notified.");
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to request access");
    },
  });

  function onSubmit(data: RequestAccessFormValues) {
    requestAccess(data);
  }

  const handleEntryClick = (entry: SharedEntryView) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  // Loading state
  if (isCheckingAccess || isLoadingEntries) {
    return <LoadingState />;
  }

  // Step 1: Not a trusted contact
  if (!accessCheck?.isTrustedContact || !accessCheck.vaultOwners.length) {
    return <NotTrusteeView />;
  }

  const vaultOwner = accessCheck.vaultOwners[0];

  // Step 2: Trusted contact without access
  if (!vaultOwner.isUnlockActive) {
    return <RequestAccessView vaultOwner={vaultOwner} onSubmit={onSubmit} isPending={isPending} form={form} />;
  }

  // Step 3: Has access, show shared entries
  return <SharedEntriesView 
    sharedEntries={sharedEntries} 
    vaultOwner={vaultOwner} 
    handleEntryClick={handleEntryClick}
    selectedEntry={selectedEntry}
    isModalOpen={isModalOpen}
    setIsModalOpen={setIsModalOpen}
    setSelectedEntry={setSelectedEntry}
  />;
}

// Step 1: Not a trusted contact view
function NotTrusteeView() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Emergency Access</h2>
            <p className="text-sm text-muted-foreground">
              You are not currently a trusted contact for any vaults. When someone adds you as their trusted contact, you'll be able to request emergency access to their vault.
            </p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

// Step 2: Request Access View
function RequestAccessView({ vaultOwner, onSubmit, isPending, form }: RequestAccessViewProps) {
  const queryClient = useQueryClient();
  
  const { mutate: grantAccess, isPending: isGranting } = useMutation({
    mutationFn: () => trustedContactService.grantAccess(vaultOwner.email),
    onSuccess: () => {
      toast.success("Access granted successfully");
      queryClient.invalidateQueries({ queryKey: ["trusted-contact"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to grant access");
    },
  });

  const { mutate: requestAccess, isPending: isRequesting } = useMutation({
    mutationFn: () => trustedContactService.requestAccess(vaultOwner.email),
    onSuccess: (response) => {
      if (response.status === "granted") {
        toast.success("Access granted! Loading shared entries...");
      } else {
        toast.success("Access request sent successfully. The vault owner will be notified.");
      }
      queryClient.invalidateQueries({ queryKey: ["trusted-contact"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to request access");
    },
  });

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Request Emergency Access</h2>
            <p className="text-sm text-muted-foreground">
              You are a trusted contact for {vaultOwner.email}'s vault. Request emergency access below.
            </p>
          </div>
          <div className="mt-4 p-4 rounded-lg border bg-muted/50 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Access will be granted after {vaultOwner.unlockAfterDays} days of inactivity</span>
            </div>
            {vaultOwner.lastRequestedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Last requested: {format(new Date(vaultOwner.lastRequestedAt), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              className="w-full" 
              disabled={isRequesting}
              onClick={() => requestAccess()}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting Access...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Request Instant Access
                </>
              )}
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 3: Shared Entries View
function SharedEntriesView({ sharedEntries, vaultOwner, handleEntryClick, selectedEntry, isModalOpen, setIsModalOpen, setSelectedEntry }: SharedEntriesViewProps) {
  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      {/* Top Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency Access Card */}
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Emergency Access</h3>
                <p className="text-xs text-muted-foreground">
                  Access shared vault entries during emergencies
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 ml-auto">
                <Share2 className="mr-1 h-3 w-3" />
                {sharedEntries.length} Shared
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Vault Owner Card */}
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">{vaultOwner.email}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Unlock after {vaultOwner.unlockAfterDays} days</span>
                </div>
              </div>
              <Badge variant={vaultOwner.isUnlockActive ? "default" : "secondary"} className="ml-auto whitespace-nowrap">
                {vaultOwner.isUnlockActive ? "Access Granted" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Shared Entries Grid */}
      <Tabs defaultValue="shared" className="space-y-4">
        <TabsList className="w-full max-w-[200px]">
          <TabsTrigger value="shared" className="w-full">
            <Grid2x2 className="h-4 w-4 mr-2" />
            Shared Entries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="space-y-6">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {sharedEntries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="col-span-full flex flex-col items-center justify-center py-12 text-center"
                >
                  <File className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No shared entries</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Shared entries will appear here once access is granted.
                  </p>
                </motion.div>
              ) : (
                sharedEntries.map((entry, index) => {
                  const categoryKey = entry.category.toUpperCase() as CategoryKey;
                  const CategoryIcon = categoryConfig[categoryKey]?.icon || FileText;
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
                        className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 h-[180px] flex flex-col group/card relative cursor-pointer"
                        onClick={() => handleEntryClick(entry)}
                      >
                        <CardHeader className="space-y-2 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 h-6 px-2 py-0 text-xs font-medium">
                                <Share2 className="mr-1 h-3 w-3" />
                                Shared
                              </Badge>
                              {entry.file && (
                                <Badge variant="outline" className="h-6 px-2 py-0">
                                  <File className="mr-1 h-3 w-3" />
                                  {entry.file.name.split('.').pop()?.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEntryClick(entry);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-3 pt-0">
                          <div className="min-h-0 flex-1">
                            <h3 className="font-semibold text-sm leading-tight tracking-tight group-hover/card:text-primary transition-colors mb-1.5 truncate pr-6">
                              {entry.title}
                              <motion.div
                                initial={false}
                                animate={{ rotate: 45 }}
                                className="opacity-0 group-hover/card:opacity-100 transition-opacity absolute right-3 top-[4.5rem]"
                              >
                                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </motion.div>
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              [Content hidden]
                            </p>
                          </div>
                          <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground border-t">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="truncate">
                                  Created: {format(new Date(entry.createdAt), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="truncate">
                                From: {entry.vaultOwner.email}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-background/0 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {selectedEntry && (
        <SharedEntryDialog
          entry={selectedEntry}
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
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

function LoadingState() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto">
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mx-auto" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
} 