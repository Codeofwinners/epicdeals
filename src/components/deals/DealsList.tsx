"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, limit, getDocs, Timestamp } from "firebase/firestore";
import type { Deal } from "@/types/deals";
import { DealCard } from "./DealCard";

export function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      if (!db) {
        console.log("DB not initialized");
        setLoading(false);
        return;
      }

      try {
        // First, seed sample deals if they don't exist
        await seedSampleDeals();

        // Load deals from Firestore
        const dealsQuery = query(collection(db, "deals"), limit(12));
        const snapshot = await getDocs(dealsQuery);
        const loadedDeals: Deal[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Deal));

        console.log("Loaded deals:", loadedDeals.length);
        setDeals(loadedDeals);
      } catch (error) {
        console.error("Error loading deals:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDeals();
  }, []);

  if (loading) return <div>Loading deals...</div>;
  if (!deals.length) return <div>No deals found</div>;

  return (
    <div className="masonry-grid">
      {deals.map((deal) => (
        <div key={deal.id} className="masonry-item">
          <DealCard deal={deal} variant="grid" />
        </div>
      ))}
    </div>
  );
}

async function seedSampleDeals() {
  if (!db) return;

  try {
    const dealsRef = collection(db, "deals");
    const snapshot = await getDocs(query(dealsRef, limit(1)));

    // Only seed if no deals exist
    if (snapshot.empty) {
      console.log("Seeding sample deals...");
      const { setDoc, doc } = await import("firebase/firestore");

      const sampleDeals = [
        {
          id: "seiko-watch",
          title: "Seiko 5 Sports Automatic Watch",
          description: "Best entry level automatic. The jubilee bracelet is surprisingly comfy for this price point.",
          store: { name: "Amazon", id: "amazon" },
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0M6y_NX6jGlMjvXEm7w7l2tq0mKxvJGuh4j0yxEw91TqbxYYxGpmZDTWebRASaYfh9bzMuwEvD_TnX6qymYF0iMs8RGpY6M3Fzi6DMr9auKo_xxiS3cS-pmSmOBbix-1dgdCxjv9GoVFfCqeI9uJgJXJkL95BjLQMNriA65qMlsxoQAh7-vXjhgdmUWgMXTl83h66jQCLnRfkdF7dlgOlEUbWUP7d2smtKieBXn9rPcmm_fUtiqVEd2HpcVluK04xrjHyHx4cZrs",
          savingsAmount: "$90",
          discount: "33%",
          workedYes: 1200,
          workedNo: 45,
          commentCount: 5,
          netVotes: 1155,
          isVerified: true,
          category: { id: "watches", name: "Watches" },
          slug: "seiko-watch",
          createdAt: Timestamp.now(),
          submittedBy: "system",
        },
        {
          id: "nike-25off",
          title: "Nike Store Event - Extra 25% Off",
          description: "Confirmed working on outlet items too. Just grabbed VaporMax for $90.",
          store: { name: "Nike", id: "nike" },
          imageUrl: "https://via.placeholder.com/600x400",
          savingsAmount: "25% OFF",
          discount: "25%",
          workedYes: 2100,
          workedNo: 128,
          commentCount: 12,
          netVotes: 1972,
          isVerified: true,
          category: { id: "apparel", name: "Apparel" },
          slug: "nike-25off",
          createdAt: Timestamp.now(),
          submittedBy: "system",
        },
        {
          id: "espresso-machine",
          title: "Premium Espresso Machine - Save $200",
          description: "Great for coffee lovers",
          store: { name: "Williams Sonoma", id: "williams-sonoma" },
          imageUrl: "https://via.placeholder.com/600x400",
          savingsAmount: "$200",
          discount: "40%",
          workedYes: 890,
          workedNo: 32,
          commentCount: 8,
          netVotes: 858,
          isVerified: true,
          category: { id: "kitchen", name: "Kitchen" },
          slug: "espresso-machine",
          createdAt: Timestamp.now(),
          submittedBy: "system",
        },
      ];

      for (const deal of sampleDeals) {
        await setDoc(doc(db, "deals", deal.id), deal);
      }
      console.log("✅ Sample deals seeded");
    }
  } catch (error) {
    console.error("Error seeding deals:", error);
  }
}
