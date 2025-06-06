"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="w-12 h-12 mx-auto bg-white/10 rounded-xl flex items-center justify-center">
            <LockKeyhole className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
            <p className="text-sm text-white/60">{subtitle}</p>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
} 