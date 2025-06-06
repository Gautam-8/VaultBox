"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { TrustedContactCard } from "./trusted-contact-card";

export function TrustedContactDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-8">
          <Shield className="mr-2 h-4 w-4" />
          <span>Trusted Contact</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Trusted Contact Management</DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              Set up and manage your trusted contact for emergency vault access.
            </p>
            <div className="mt-4 p-4 rounded-lg border bg-muted/50 space-y-3">
              <h4 className="font-medium">Important Information</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Your trusted contact must have a registered VaultBox account</li>
                <li>They will be notified when you add them as a trusted contact</li>
                <li>They can request emergency access if you become inactive</li>
                <li>Access is granted automatically after the specified inactivity period</li>
                <li>You will be notified of any access requests</li>
                <li>You can revoke access at any time</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <TrustedContactCard />
      </DialogContent>
    </Dialog>
  );
} 