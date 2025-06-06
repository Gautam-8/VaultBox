import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notification";

export function useEmergencyAccess() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getUserNotifications(),
  });

  // Check if there's an unread ACCESS_GRANTED or TRUSTED_CONTACT_ADDED notification
  const hasUnreadAccessGranted = notifications.some(
    (n) => n.type === "ACCESS_GRANTED" && !n.isRead
  );

  const hasUnreadTrustedContactAdded = notifications.some(
    (n) => n.type === "TRUSTED_CONTACT_ADDED" && !n.isRead
  );

  const hasUnreadNotifications = hasUnreadAccessGranted || hasUnreadTrustedContactAdded;

  return {
    hasUnreadAccessGranted,
    hasUnreadTrustedContactAdded,
    hasUnreadNotifications,
  };
} 