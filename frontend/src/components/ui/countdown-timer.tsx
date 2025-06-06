import * as React from "react";
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiryDate: Date;
  className?: string;
}

export function CountdownTimer({ expiryDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const expiry = new Date(expiryDate);
      
      if (now >= expiry) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = differenceInDays(expiry, now);
      const hours = differenceInHours(expiry, now) % 24;
      const minutes = differenceInMinutes(expiry, now) % 60;
      const seconds = Math.floor((expiry.getTime() - now.getTime()) / 1000) % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    }

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return (
      <span className={cn("text-destructive font-medium", className)}>
        Expired
      </span>
    );
  }

  return (
    <span className={cn("text-yellow-500 font-medium", className)}>
      {timeLeft.days > 0 && `${timeLeft.days}d `}
      {timeLeft.hours > 0 && `${timeLeft.hours}h `}
      {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
      {timeLeft.seconds > 0 && `${timeLeft.seconds}s`}
    </span>
  );
} 