"use client";

import { useEffect } from "react";
import { getAnalyticsInstance } from "@/lib/firebase";

export function AnalyticsInit() {
  useEffect(() => {
    getAnalyticsInstance();
  }, []);
  return null;
}
