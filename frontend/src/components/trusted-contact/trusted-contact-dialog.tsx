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
        <Button variant="outline" className="w-full justify-start">
          <Shield className="mr-2 h-4 w-4" />
          Trusted Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Trusted Contact Management</DialogTitle>
          <DialogDescription>
            Set up and manage your trusted contact for emergency vault access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <TrustedContactCard />
          
          <div className="prose dark:prose-invert max-w-none text-sm">
            <h4 className="text-base font-medium">How it works</h4>
            <p>
              A trusted contact is someone you trust to access your vault in case of emergency.
              They can request access to your vault, but they won't be able to see anything until:
            </p>
            <ul>
              <li>You've been inactive for a specified period (e.g., 30 days)</li>
              <li>OR you explicitly share specific entries with them</li>
            </ul>

            <h4 className="text-base font-medium">Security considerations</h4>
            <ul>
              <li>Choose someone you trust completely</li>
              <li>They will need to verify their email address</li>
              <li>You can remove their access at any time</li>
              <li>You'll be notified of all access attempts</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 