"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { VaultEntryGrid } from "@/components/vault/vault-entry-grid";
import { CategoryFilter } from "@/components/vault/category-filter";
import { NewEntryDialog } from "@/components/vault/new-entry-dialog";
import { TrustedContactDialog } from "@/components/trusted-contact/trusted-contact-dialog";

export default function DashboardPage() {
  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Your Vault</h2>
          <p className="text-sm text-muted-foreground">
            Securely store and manage your sensitive information
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TrustedContactDialog />
          <NewEntryDialog />
        </div>
      </div>
      
      <CategoryFilter />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VaultEntryGrid />
      </motion.div>
    </div>
  );
} 