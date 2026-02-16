"use client";

import { motion } from "framer-motion";

interface MeterBarProps {
  yes: number;
  no: number;
  size?: "sm" | "md";
  showLabels?: boolean;
}

export function MeterBar({ yes, no, size = "sm", showLabels = false }: MeterBarProps) {
  const total = yes + no;
  const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 50;
  const isSm = size === "sm";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-1 shrink-0">
        <div className={`${isSm ? "w-4 h-4" : "w-5 h-5"} rounded-full bg-emerald-100 flex items-center justify-center`}>
          <svg viewBox="0 0 12 12" className={`${isSm ? "w-2.5 h-2.5" : "w-3 h-3"} text-emerald-600`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6.5 4.5 9 10 3" />
          </svg>
        </div>
        <span className={`${isSm ? "text-[11px]" : "text-xs"} font-bold text-emerald-600 tabular-nums`}>
          {yes.toLocaleString()}{showLabels ? " Yes" : ""}
        </span>
      </div>

      <div className={`flex-1 ${isSm ? "h-1.5" : "h-2"} rounded-full bg-gray-100 overflow-hidden flex min-w-[40px] ${isSm ? "max-w-[80px]" : "max-w-none"}`}>
        <motion.div
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l-full"
          initial={{ width: 0 }}
          animate={{ width: `${yesPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="bg-gradient-to-r from-rose-300 to-rose-400 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${100 - yesPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className={`${isSm ? "text-[11px]" : "text-xs"} font-bold text-rose-400 tabular-nums`}>
          {no.toLocaleString()}{showLabels ? " No" : ""}
        </span>
        <div className={`${isSm ? "w-4 h-4" : "w-5 h-5"} rounded-full bg-rose-100 flex items-center justify-center`}>
          <svg viewBox="0 0 12 12" className={`${isSm ? "w-2.5 h-2.5" : "w-3 h-3"} text-rose-500`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="9" y2="9" />
            <line x1="9" y1="3" x2="3" y2="9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
