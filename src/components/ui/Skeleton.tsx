"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-gray-100 via-gray-200/60 to-gray-100",
        className
      )}
    />
  );
}

/** Mimics a DealCard during loading */
export function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100/80 p-5 flex flex-col gap-3.5">
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="h-10 w-28 rounded-xl" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex-1" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16 rounded-full" />
        <div className="flex gap-1">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

/** Mimics the featured DealCard */
export function FeaturedDealSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100/80 p-6 flex flex-col gap-4">
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-14 w-40 rounded-xl" />
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded-full" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/** Mimics a compact DealCard row */
export function CompactDealSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100/80 p-4">
      <div className="shrink-0 w-20 md:w-24 flex flex-col items-center gap-1.5">
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-3 w-12 rounded-full" />
          <Skeleton className="h-3 w-14 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
    </div>
  );
}

/** Grid of card skeletons */
export function DealGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Section with title skeleton + grid */
export function SectionSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <DealGridSkeleton count={cards} />
    </div>
  );
}
