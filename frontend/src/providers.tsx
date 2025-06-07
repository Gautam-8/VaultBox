"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { useKeepAlive } from "@/hooks/use-keep-alive";

function KeepAliveProvider() {
  // Enable keep-alive ping every minute
  useKeepAlive(true);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <KeepAliveProvider />
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
} 