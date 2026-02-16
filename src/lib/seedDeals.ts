import { db } from "./firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";

const SAMPLE_DEALS = [
  {
    id: "seiko-watch",
    title: "Seiko 5 Sports Automatic Watch",
    store: { name: "Amazon", id: "amazon" },
    description: "Best entry level automatic",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0M6y_NX6jGlMjvXEm7w7l2tq0mKxvJGuh4j0yxEw91TqbxYYxGpmZDTWebRASaYfh9bzMuwEvD_TnX6qymYF0iMs8RGpY6M3Fzi6DMr9auKo_xxiS3cS-pmSmOBbix-1dgdCxjv9GoVFfCqeI9uJgJXJkL95BjLQMNriA65qMlsxoQAh7-vXjhgdmUWgMXTl83h66jQCLnRfkdF7dlgOlEUbWUP7d2smtKieBXn9rPcmm_fUtiqVEd2HpcVluK04xrjHyHx4cZrs",
    discount: "33%",
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
    store: { name: "Nike", id: "nike" },
    description: "Valid on clearance items",
    imageUrl: "https://via.placeholder.com/600x400?text=Nike",
    discount: "25%",
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
    store: { name: "Williams Sonoma", id: "williams-sonoma" },
    description: "Great for coffee lovers",
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=400&h=500&fit=crop",
    discount: "40%",
    netVotes: 858,
    isVerified: true,
    category: { id: "kitchen", name: "Kitchen" },
    slug: "espresso-machine",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "spotify-premium",
    title: "Spotify Premium 3-Month Trial",
    store: { name: "Spotify", id: "spotify" },
    description: "Stream unlimited music",
    imageUrl: "https://via.placeholder.com/600x400?text=Spotify",
    discount: "Free",
    netVotes: 2341,
    isVerified: true,
    category: { id: "music", name: "Music" },
    slug: "spotify-premium",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "nike-air-max",
    title: "Nike Air Max 90 Running Shoes",
    store: { name: "Nike", id: "nike" },
    description: "Classic comfort and style",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
    discount: "35%",
    netVotes: 1543,
    isVerified: true,
    category: { id: "apparel", name: "Apparel" },
    slug: "nike-air-max",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "uber-eats-15off",
    title: "Uber Eats - $15 Off $25+",
    store: { name: "Uber Eats", id: "uber-eats" },
    description: "First order exclusive",
    imageUrl: "https://via.placeholder.com/600x400?text=UberEats",
    discount: "60%",
    netVotes: 3210,
    isVerified: true,
    category: { id: "food", name: "Food & Dining" },
    slug: "uber-eats-15off",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "amazon-fresh-20off",
    title: "Amazon Fresh - Save 20% on Groceries",
    store: { name: "Amazon Fresh", id: "amazon-fresh" },
    description: "Prime member exclusive",
    imageUrl: "https://images.unsplash.com/photo-1488459716781-6818c409f883?w=400&h=500&fit=crop",
    discount: "20%",
    netVotes: 892,
    isVerified: true,
    category: { id: "groceries", name: "Groceries" },
    slug: "amazon-fresh-20off",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "best-buy-wireless",
    title: "Wireless Headphones - Best Buy",
    store: { name: "Best Buy", id: "best-buy" },
    description: "Noise canceling technology",
    imageUrl: "https://images.unsplash.com/photo-1505880969541-ca48aebad63c?w=400&h=500&fit=crop",
    discount: "40%",
    netVotes: 5800,
    isVerified: true,
    category: { id: "electronics", name: "Electronics" },
    slug: "best-buy-wireless",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "gap-50off",
    title: "Gap & Old Navy - Extra 50% Off",
    store: { name: "Gap", id: "gap" },
    description: "Flash sale event",
    imageUrl: "https://via.placeholder.com/600x400?text=Gap",
    discount: "50%",
    netVotes: 1900,
    isVerified: true,
    category: { id: "apparel", name: "Apparel" },
    slug: "gap-50off",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "target-home",
    title: "Target Room Decor Collection",
    store: { name: "Target", id: "target" },
    description: "Home decoration sale",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=500&fit=crop",
    discount: "38%",
    netVotes: 6400,
    isVerified: true,
    category: { id: "home", name: "Home" },
    slug: "target-home",
    createdAt: Timestamp.now(),
    submittedBy: "system",
  },
  {
    id: "sephora-beauty",
    title: "Sephora Beauty Sale - Up to 50% Off",
    store: { name: "Sephora", id: "sephora" },
    description: "VIP member exclusive",
    imageUrl: "https://via.placeholder.com/600x400?text=Sephora",
    discount: "50%",
    netVotes: 2300,
    isVerified: true,
    category: { id: "beauty", name: "Beauty" },
    slug: "sephora-beauty",
    createdAt: Timestamp.now(),
    submittedBy: "system",
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
