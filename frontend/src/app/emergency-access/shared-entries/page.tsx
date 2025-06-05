"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, Eye, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trustedContactService, SharedVaultEntry } from "@/services/trusted-contact";
import { format } from "date-fns";

export default function SharedEntriesPage() {
  const { data: sharedEntries, isLoading } = useQuery({
    queryKey: ["shared-entries"],
    queryFn: () => trustedContactService.getSharedEntries(),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!sharedEntries?.length) {
    return <EmptyState />;
  }

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

        <div className="grid gap-4">
          {sharedEntries.map((entry: SharedVaultEntry, index: number) => (
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
                  <Badge variant={getCategoryVariant(entry.category)}>
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
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen w-full grid place-items-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto grid place-items-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-xl">No Shared Entries</h3>
            <p className="text-sm text-muted-foreground">
              You haven't been granted access to any vault entries yet.
            </p>
          </div>
        </CardContent>
      </Card>
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

function getCategoryVariant(category: string): "default" | "destructive" | "secondary" | "outline" {
  switch (category.toLowerCase()) {
    case "finance":
      return "default";
    case "health":
      return "destructive";
    case "personal":
      return "secondary";
    default:
      return "outline";
  }
} 