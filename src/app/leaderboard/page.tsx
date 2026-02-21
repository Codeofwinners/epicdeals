import type { Metadata } from "next";
import { LeaderboardContent } from "@/components/leaderboard/LeaderboardContent";

export const metadata: Metadata = {
  title: "Leaderboard — Legit.Discount",
  description: "See who's finding the best deals. Climb the ranks by submitting deals, earning upvotes, and engaging with the community.",
  openGraph: {
    title: "Leaderboard — Legit.Discount",
    description: "See who's finding the best deals. Climb the ranks by submitting deals, earning upvotes, and engaging with the community.",
  },
};

export default function LeaderboardPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://legit.discount" },
              { "@type": "ListItem", position: 2, name: "Leaderboard", item: "https://legit.discount/leaderboard" },
            ],
          }),
        }}
      />
      <LeaderboardContent />
    </>
  );
}
