"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Key, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

function getUserDisplayName(email: string): string {
  // Get name part before @ symbol and capitalize each word
  return email
    .split('@')[0]
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function EmergencyAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const userDisplayName = user?.email ? getUserDisplayName(user.email) : '';

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-background/90 -z-10" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />

      {/* Navigation Bar */}
      <div className="border-b">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <span className="text-lg font-semibold">VaultBox</span>
            </div>

            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/dashboard")}
            >
              <Shield className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationDropdown />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {userDisplayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userDisplayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 px-4">
        {children}
      </main>
    </div>
  );
} 