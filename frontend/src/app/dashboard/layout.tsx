"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Key, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { TrustedContactDialog } from "@/components/trusted-contact/trusted-contact-dialog";
import { useEmergencyAccess } from "@/hooks/use-emergency-access";
import { cn } from "@/lib/utils";

function getUserDisplayName(email: string): string {
  // Get name part before @ symbol and capitalize each word
  return email
    .split('@')[0]
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { hasUnreadAccessGranted, hasUnreadTrustedContactAdded, hasUnreadNotifications } = useEmergencyAccess();
  const userDisplayName = user?.email ? getUserDisplayName(user.email) : '';
  const queryClient = useQueryClient();

  const { mutate: markAllAsRead } = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleEmergencyAccessClick = () => {
    if (hasUnreadNotifications) {
      markAllAsRead();
    }
    router.push("/emergency-access");
  };

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
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <span className="text-lg font-semibold">VaultBox</span>
            </div>

            <Button
              variant="ghost"
              className={cn(
                "gap-2 text-muted-foreground hover:text-foreground relative",
                hasUnreadNotifications && [
                  "text-primary hover:text-primary p-[2px] group",
                  "bg-[linear-gradient(90deg,#f44336,#3b82f6,#f44336)]",
                  "bg-[length:200%_100%] animate-slide",
                  "border-none"
                ]
              )}
              onClick={handleEmergencyAccessClick}
            >
              <div className={cn(
                "relative flex items-center gap-2 bg-background rounded-md px-3 py-1.5",
                hasUnreadNotifications && [
                  "after:absolute after:inset-0 after:rounded-md after:animate-pulse after:bg-primary/10",
                  "shadow-[0_0_15px_rgba(var(--primary),.3)]"
                ]
              )}>
                <Shield className={cn(
                  "h-4 w-4",
                  hasUnreadNotifications && "animate-pulse"
                )} />
                <span>Emergency Access</span>
                {hasUnreadNotifications && (
                  <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/30 animate-pulse" />
                )}
              </div>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative flex items-center">
              <div className="flex h-10 w-[300px] items-center rounded-md border bg-background px-3">
                <TrustedContactDialog />
              </div>
            </div>

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