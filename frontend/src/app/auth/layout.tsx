"use client";

import { Key } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-white" />
            <span className="text-lg font-semibold text-white">VaultBox</span>
          </div>
        </div>
      </nav>

      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950/20 to-black -z-10" />

      {/* Content */}
      <main className="flex items-center justify-center min-h-screen w-full px-4">
        <div className="w-full max-w-md bg-black/50 p-6 rounded-lg backdrop-blur-sm border border-white/5">
          {children}
        </div>
      </main>
    </div>
  );
} 