import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
}

export function TimePicker({ date, onChange, className }: TimePickerProps) {
  const [hour, setHour] = React.useState<string>(date ? String(date.getHours()).padStart(2, "0") : "00");
  const [minute, setMinute] = React.useState<string>(date ? String(date.getMinutes()).padStart(2, "0") : "00");

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  
  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const handleHourChange = (value: string) => {
    setHour(value);
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(parseInt(value));
      onChange(newDate);
    }
  };

  const handleMinuteChange = (value: string) => {
    setMinute(value);
    if (date) {
      const newDate = new Date(date);
      newDate.setMinutes(parseInt(value));
      onChange(newDate);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={hour} onValueChange={handleHourChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground self-center">:</span>
      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 