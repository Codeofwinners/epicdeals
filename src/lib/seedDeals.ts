import { db } from "./firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";

const SAMPLE_DEALS = [
  {
    id: "seiko-watch",
    title: "Seiko 5 Sports Automatic Watch",
    store: { name: "Amazon", id: "amazon", slug: "amazon" },
    description: "Best entry level automatic",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0M6y_NX6jGlMjvXEm7w7l2tq0mKxvJGuh4j0yxEw91TqbxYYxGpmZDTWebRASaYfh9bzMuwEvD_TnX6qymYF0iMs8RGpY6M3Fzi6DMr9auKo_xxiS3cS-pmSmOBbix-1dgdCxjv9GoVFfCqeI9uJgJXJkL95BjLQMNriA65qMlsxoQAh7-vXjhgdmUWgMXTl83h66jQCLnRfkdF7dlgOlEUbWUP7d2smtKieBXn9rPcmm_fUtiqVEd2HpcVluK04xrjHyHx4cZrs",
    discount: "33%",
    savingsAmount: "$185",
    savingsValue: 33,
    netVotes: 1200,
    viewCount: 5402,
    commentCount: 12,
    isVerified: true,
    category: { id: "watches", name: "Watches", slug: "watches" },
    slug: "seiko-watch",
    createdAt: Timestamp.now(), // Recent (24h)
    submittedBy: { id: "system", username: "LegitBot" },
  },
  {
    id: "nike-25off",
    title: "Nike Store Event - Extra 25% Off",
    store: { name: "Nike", id: "nike", slug: "nike" },
    description: "Valid on clearance items",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
    discount: "25%",
    savingsAmount: "25% OFF",
    savingsValue: 25,
    netVotes: 2100,
    viewCount: 8900,
    commentCount: 45,
    isVerified: true,
    category: { id: "apparel", name: "Apparel", slug: "apparel" },
    slug: "nike-25off",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 3600000)), // 3 hours ago
    submittedBy: { id: "system", username: "LegitBot" },
  },
  {
    id: "espresso-machine",
    title: "Breville Barista Express Espresso Machine",
    store: { name: "Best Buy", id: "best-buy", slug: "best-buy" },
    description: "Great for coffee lovers",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCV16gCseuB648qlcRc4CHJX4IxCPsxHtUsUUaYUw-ISHdB5OzL0jw3JFkqJ1O4hUQGx0KUdJsHRw4njcmOJptpJBirt3kF0bCOLrAdfoxXjiB46-uXLwTg-3SUbdVRYNIyzIQChi5UNplCciGQ146s_SS3AvtHOJ1khEQgZVp2-rvsdSOLn9xTv4DVKrtU5M0zKBK0nUpY2em7pZzzkg4jY96KfTcnGI8-7Yw54kCKuX3Ma37EDalUv1bCsMk1weE6w7niYhpuMMs",
    discount: "40%",
    savingsAmount: "$599",
    savingsValue: 40,
    netVotes: 8500,
    viewCount: 15400,
    commentCount: 8,
    isVerified: true,
    category: { id: "kitchen", name: "Kitchen", slug: "kitchen" },
    slug: "espresso-machine",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 3600000)), // 2 days ago (Weekly)
    submittedBy: { id: "system", username: "LegitBot" },
  },
  {
    id: "spotify-premium",
    title: "Spotify Premium 3-Month Trial",
    store: { name: "Spotify", id: "spotify", slug: "spotify" },
    description: "Stream unlimited music",
    imageUrl: "https://via.placeholder.com/600x400?text=Spotify",
    discount: "Free",
    savingsAmount: "FREE",
    savingsValue: 100,
    netVotes: 856,
    viewCount: 3200,
    commentCount: 3,
    isVerified: true,
    category: { id: "music", name: "Music", slug: "music" },
    slug: "spotify-premium",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 3600000)), // 5 days ago (Weekly)
    submittedBy: { id: "system", username: "LegitBot" },
  },
  {
    id: "nike-air-max",
    title: "Nike Air Max 90 Running Shoes",
    store: { name: "Nike", id: "nike", slug: "nike" },
    description: "Classic comfort and style",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrVhiuaqKmVRLRrFcmiNyBJfPAZq0E3YggMFtb8Pkb2ZbqW-53NaOnbVcDWyYQ5ByVOMAN6N8Vj1zlyHBia1tHjomX2XJE5L7ufrEJ0shYJN8ulfFbgn6eZvYBsNiVO83jGsr2_4fHcuQxR7BxZw8rULSkeTr0CyPiObv5ZvBv5rERBcjgdxIoeE9XdQv7DD62v0fQQJvPyUw9whxojNPOP67OYN7untf74VjsZUKq_GLDXgDUAq6s_IYtqkipb33pmYWJ8m-Mfp0",
    discount: "35%",
    savingsAmount: "$89.99",
    savingsValue: 35,
    netVotes: 12000,
    viewCount: 45000,
    commentCount: 67,
    isVerified: true,
    category: { id: "apparel", name: "Apparel", slug: "apparel" },
    slug: "nike-air-max",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 3600000)), // 15 days ago (Monthly)
    submittedBy: { id: "system", username: "LegitBot" },
  },
  {
    id: "uber-eats-15off",
    title: "Uber Eats - $20 Off First Order",
    store: { name: "Uber Eats", id: "uber-eats", slug: "uber-eats" },
    description: "First order exclusive",
    imageUrl: "https://via.placeholder.com/600x400?text=UberEats",
    discount: "60%",
    savingsAmount: "$20 OFF",
    savingsValue: 60,
    netVotes: 440,
    viewCount: 1200,
    commentCount: 1,
    isVerified: true,
    category: { id: "food", name: "Food & Dining", slug: "food" },
    slug: "uber-eats-15off",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 3600000)), // 10 hours ago
    submittedBy: { id: "system", username: "LegitBot" },
  },
];

export async function seedDeals() {
  if (!db) {
    console.error("❌ DB is null - cannot seed");
    return;
  }

  try {
    console.log("🔥 SEEDING DEALS NOW...");

    for (const deal of SAMPLE_DEALS) {
      try {
        const dealRef = doc(db, "deals", deal.id);
        console.log("Writing deal to:", `deals/${deal.id}`);
        await setDoc(dealRef, deal, { merge: true });
        console.log("✅ DEAL WRITTEN:", deal.id);
      } catch (e) {
        console.error("❌ FAILED TO WRITE DEAL:", deal.id, e);
        throw e;
      }
    }
    console.log("✅✅✅ ALL DEALS SEEDED SUCCESSFULLY");
  } catch (error) {
    console.error("❌❌❌ SEEDING FAILED:", error);
    throw error;
  }
}
