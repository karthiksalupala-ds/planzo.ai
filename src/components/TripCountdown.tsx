import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Plane, PartyPopper, MapPin } from "lucide-react";

interface TripCountdownProps {
  startDate: string;
  tripTitle: string;
  days: number;
}

const TripCountdown = ({ startDate, tripTitle, days }: TripCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(startDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(startDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [startDate]);

  const tripStart = new Date(startDate);
  const tripEnd = new Date(tripStart);
  tripEnd.setDate(tripEnd.getDate() + (days || 1) - 1);
  const now = new Date();

  const isOngoing = now >= tripStart && now <= tripEnd;
  const isCompleted = now > tripEnd;
  const isPast = isCompleted;

  if (isPast) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
        <PartyPopper className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Trip completed! 🎉
        </span>
      </div>
    );
  }

  if (isOngoing) {
    const dayNum = Math.floor((now.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Day {dayNum} of {days} — Enjoy your trip! ✈️
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/20"
    >
      <div className="flex items-center gap-3">
        <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <div className="flex items-center gap-2 text-xs">
          {timeLeft.totalDays === 0 ? (
            <span className="font-bold text-primary animate-pulse">Starts today! 🎉</span>
          ) : timeLeft.totalDays === 1 ? (
            <span className="font-bold text-primary">Starts tomorrow! 🌟</span>
          ) : (
            <>
              <div className="flex gap-1.5">
                {timeLeft.totalDays > 0 && (
                  <span className="font-bold text-primary">{timeLeft.totalDays}d</span>
                )}
                <span className="font-bold text-primary">{timeLeft.hours}h</span>
                <span className="font-bold text-primary">{timeLeft.minutes}m</span>
              </div>
              <span className="text-muted-foreground font-medium">to go</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function getTimeLeft(startDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const diff = start.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { totalDays: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { totalDays, hours, minutes, seconds };
}

export default TripCountdown;
