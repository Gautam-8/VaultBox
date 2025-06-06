"use client";

import { Key, Shield, Lock, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Lock,
    title: "Secure Vault Storage",
    description: "Store your sensitive information with end-to-end encryption"
  },
  {
    icon: Shield,
    title: "Emergency Access",
    description: "Designate trusted contacts for emergency vault access"
  },
  {
    icon: FileText,
    title: "File Attachments",
    description: "Securely store and manage important documents"
  }
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950/20 to-black -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />

      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Key className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white">VaultBox</span>
              <p className="text-sm text-white/60">Your Digital Safe Haven</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white/80">End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white/80">Zero-Knowledge Security</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Split Layout */}
      <div className="flex min-h-screen">
        {/* Left Section - Landing Page Content */}
        <div className="hidden md:flex flex-1 items-center justify-center p-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
                Your Digital Vault for
                <br />
                <span className="text-blue-400">Secure Information</span>
              </h1>
              <p className="text-lg text-white/60 max-w-xl mx-auto">
                Store, manage, and securely share your sensitive information with VaultBox's end-to-end encrypted vault system.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 mt-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-sm"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-white/60">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Auth Forms */}
        <div className="w-full md:w-[500px] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 