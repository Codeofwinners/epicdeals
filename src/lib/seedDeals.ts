import { db } from "./firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";

const SAMPLE_DEALS = [
  {
    id: "seiko-watch",
    title: "Seiko 5 Sports Automatic Watch",
    store: { name: "Amazon", id: "amazon" },
    description: "Best entry level automatic",
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
    submittedBy: "admin",
  },
  {
    id: "nike-25off",
    title: "Nike Store Event - Extra 25% Off",
    store: { name: "Nike", id: "nike" },
    description: "Valid on clearance items",
    imageUrl: "https://via.placeholder.com/600x400?text=Nike",
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
    submittedBy: "admin",
  },
];

export async function seedDeals() {
  if (!db) {
    console.log("Firebase not initialized, skipping seed");
    return;
  }

  try {
    console.log("Checking if deals need seeding...");

    // Try to seed each deal - setDoc with merge will handle duplicates
    for (const deal of SAMPLE_DEALS) {
      const dealRef = doc(db, "deals", deal.id);
      await setDoc(dealRef, deal, { merge: true });
      console.log("✅ Deal ready:", deal.id);
    }
    console.log("✅ All deals seeded");
  } catch (error) {
    console.error("Error seeding deals:", error);
  }
}
