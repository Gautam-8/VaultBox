"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { VaultEntryGrid } from "@/components/vault/vault-entry-grid";
import { NewEntryDialog } from "@/components/vault/new-entry-dialog";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 min-w-0"
        >
          <h2 className="text-3xl font-bold tracking-tight">Your Vault</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Securely store and manage your sensitive information. All data is encrypted end-to-end.
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="shrink-0"
        >
          <NewEntryDialog />
        </motion.div>
      </div>

      {/* Vault Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="min-h-[calc(100vh-200px)]"
      >
        <VaultEntryGrid />
      </motion.div>
    </div>
  );
} 