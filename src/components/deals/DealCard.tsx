"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth";
import { addComment, onDealComments, getLatestComment } from "@/lib/firestore";
import type { Deal, Comment } from "@/types/deals";

function timeAgo(dateStr: string) {
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

interface DealCardProps {
  deal: Deal;
  variant?: "featured" | "side" | "grid" | "compact" | "default";
}

export function DealCard({ deal, variant = "featured" }: DealCardProps) {
  if (variant === "side") return <SideCard deal={deal} />;
  if (variant === "grid") return <GridCard deal={deal} />;
  if (variant === "compact") return <CompactCard deal={deal} />;

  // FEATURED CARD - Matching home.html (8 cols)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-12 lg:col-span-8 group relative overflow-hidden rounded-[1.5rem] bg-surface-light dark:bg-surface-dark shadow-soft hover:shadow-hover transition-all duration-300 h-[450px] border border-gray-100 dark:border-white/5"
    >
      {/* Background Image Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10"></div>
      <img
        alt={deal.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        src={deal.imageUrl || "https://via.placeholder.com/1200x450"}
      />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-between p-8">
        {/* Top Badges */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white font-semibold text-xs uppercase tracking-wider rounded-lg border border-white/20 flex items-center gap-1.5">
              <span className="material-icons-outlined text-sm">local_fire_department</span> Hot
            </span>
            {deal.isVerified && (
              <span className="px-3 py-1.5 bg-ai-accent/90 text-white font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/20">
                <span className="material-icons-outlined text-sm">smart_toy</span> AI Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10">
              <span className="material-icons-outlined text-sm">share</span>
            </button>
            <button className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10">
              <span className="material-icons-outlined text-sm">bookmark_border</span>
            </button>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="flex items-end justify-between w-full">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              {deal.store && (
                <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm flex items-center justify-center">
                  <span className="text-lg font-bold text-background-dark">
                    {deal.store.name[0]}
                  </span>
                </div>
              )}
              <span className="text-white/90 font-medium text-lg">{deal.store.name}</span>
            </div>
            <h2 className="text-5xl font-display font-bold text-white mb-6 leading-[1.1] tracking-tight">
              {deal.title}
              <br />
              <span className="text-primary">{deal.savingsAmount}</span>
            </h2>
            <div className="flex items-center gap-4 mb-2">
              <button className="px-8 py-3.5 bg-white text-background-dark font-bold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg text-sm">
                Get Code
                <span className="material-icons-outlined text-sm">content_copy</span>
              </button>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="flex flex-col">
                <span className="text-white text-xs font-bold">{deal.workedYes + deal.workedNo} Verified</span>
                <span className="text-white/60 text-[10px] uppercase tracking-wide">Community Voted</span>
              </div>
            </div>
          </div>

          {/* Top Comment */}
          {deal.commentCount > 0 && (
            <div className="hidden md:block bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 max-w-xs">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                    U
                  </div>
                  <span className="text-xs text-gray-200 font-medium">Top Comment</span>
                </div>
                <span className="text-[10px] text-gray-400">now</span>
              </div>
              <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
                "Great deal! Just worked for me and saved {deal.savingsAmount}!"
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// SIDE CARD - Right column (4 cols)
function SideCard({ deal }: { deal: Deal }) {
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);

  const workedYes = deal.workedYes + (reaction === "up" ? 1 : 0);
  const workedNo = deal.workedNo + (reaction === "down" ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-[1.5rem] bg-surface-light dark:bg-surface-dark shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col relative overflow-hidden group border border-gray-100 dark:border-white/5"
    >
      <div className="p-5 flex flex-col h-full">
        {/* Header with Logo & Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center p-2">
            <span className="text-2xl font-bold !text-black dark:!text-white">
              {deal.store.name[0]}
            </span>
          </div>
          <div className="flex gap-2">
            {deal.isVerified && (
              <span className="text-ai-accent text-[10px] font-bold bg-ai-accent/5 px-2 py-1 rounded-full border border-ai-accent/10 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">smart_toy</span> AI Found
              </span>
            )}
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <span className="material-icons-outlined text-lg">more_horiz</span>
            </button>
          </div>
        </div>

        {/* Title & Comments */}
        <div className="flex-1">
          <h3 className="text-xl font-bold !text-black dark:!text-white mb-2 leading-tight">
            {deal.title}
          </h3>
          {deal.commentCount > 0 && (
            <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 shrink-0 flex items-center justify-center text-[10px] text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800/30">
                  U
                </div>
                <div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-2">
                    "{deal.description || "Great deal verified!"}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vote & Action */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-gray-100 dark:border-white/5">
            <button
              onClick={() => setReaction(reaction === "up" ? null : "up")}
              className={`material-icons-outlined text-sm ${
                reaction === "up" ? "text-green-500" : "text-gray-400 hover:text-green-500"
              }`}
            >
              keyboard_arrow_up
            </button>
            <span className="text-xs font-bold w-6 text-center !text-black dark:!text-white">{workedYes}</span>
            <button
              onClick={() => setReaction(reaction === "down" ? null : "down")}
              className={`material-icons-outlined text-sm ${
                reaction === "down" ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
            >
              keyboard_arrow_down
            </button>
          </div>
          <Link href={`/deals/${deal.slug}`} className="flex-1">
            <button className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              View Offer <span className="material-icons-outlined text-sm">arrow_forward</span>
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// GRID CARD - 2x2 grid (4 cols each)
function GridCard({ deal }: { deal: Deal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-1 bg-surface-light dark:bg-surface-dark rounded-[1.5rem] shadow-soft flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer h-full relative border border-gray-100 dark:border-white/5 group overflow-hidden"
    >
      <div className="p-6 flex flex-col h-full">
        {/* Logo & Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center p-3 shrink-0">
            <span className="text-3xl font-bold !text-black dark:!text-white">
              {deal.store.name[0]}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            {deal.isVerified && (
              <span className="text-[10px] font-bold text-ai-accent bg-ai-accent/5 px-2 py-0.5 rounded-full border border-ai-accent/10">
                AI Verified
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <span className="text-xs font-bold text-primary uppercase tracking-wide">
            {deal.category?.name}
          </span>
          <h4 className="text-lg font-bold !text-black dark:!text-white leading-tight mt-1 group-hover:text-primary transition-colors">
            {deal.title}
          </h4>
        </div>

        {/* Comment & Vote */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full border-2 border-white dark:border-surface-dark bg-gradient-to-br from-blue-400 to-purple-500"></div>
              <div className="w-5 h-5 rounded-full border-2 border-white dark:border-surface-dark bg-gradient-to-br from-green-400 to-blue-500"></div>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
              "{deal.description || "Worked for me!"}"
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="material-icons-outlined text-xs text-gray-400">thumb_up</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {deal.workedYes}k
              </span>
            </div>
            <Link href={`/deals/${deal.slug}`}>
              <button className="text-xs font-bold !text-black dark:!text-white hover:underline">
                Details
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// COMPACT CARD - Minimal version
function CompactCard({ deal }: { deal: Deal }) {
  return (
    <Link href={`/deals/${deal.slug}`} className="block">
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 shadow-soft border border-gray-100 dark:border-white/5 hover:shadow-hover transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold !text-black dark:!text-white line-clamp-2 flex-1">
            {deal.title}
          </h3>
          <span className="text-primary font-bold text-sm ml-2 flex-shrink-0">
            {deal.savingsAmount}
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {deal.store.name}
        </div>
      </motion.div>
    </Link>
  );
}
