"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiresAt: string;
  compact?: boolean;
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function CountdownTimer({ expiresAt, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft.expired) {
    return <span className="text-xs font-bold text-red-500 tracking-wide">EXPIRED</span>;
  }

  if (compact) {
    if (timeLeft.days > 0) {
      return (
        <span className="text-[11px] font-bold tabular-nums tracking-tight">
          <span className="text-amber-700">{timeLeft.days}d</span>
          <span className="text-amber-400 mx-0.5">:</span>
          <span className="text-amber-700">{timeLeft.hours}h</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold tabular-nums tracking-tight">
        <span className="text-amber-700">{timeLeft.hours}h</span>
        <span className="text-amber-400 mx-0.5">:</span>
        <span className="text-amber-700">{timeLeft.minutes}m</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {timeLeft.days > 0 && (
        <TimeUnit value={timeLeft.days} label="d" />
      )}
      <TimeUnit value={timeLeft.hours} label="h" />
      <span className="text-amber-300 text-xs font-light">:</span>
      <TimeUnit value={timeLeft.minutes} label="m" />
      <span className="text-amber-300 text-xs font-light">:</span>
      <TimeUnit value={timeLeft.seconds} label="s" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-px">
      <span className="text-base font-black tabular-nums text-gray-900 leading-none">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] font-semibold text-amber-600">{label}</span>
    </div>
  );
}
