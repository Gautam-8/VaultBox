import * as React from "react";
import { Calendar } from "./calendar";
import { TimePicker } from "./time-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
}

export function DateTimePicker({ date, onDateChange, className }: DateTimePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full pl-3 text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? (
            format(date, "PPP p") // "p" adds time in 12-hour format
          ) : (
            <span>Pick date and time</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            disabled={(date) =>
              date < new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
          <div className="border-t pt-4 px-2">
            <TimePicker
              date={date}
              onChange={onDateChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 