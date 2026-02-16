import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDealBySlug, getDealById, getAllDeals } from "@/lib/firestore";
import DealDetailContent from "./DealDetailContent";

const BASE_URL = "https://legit.discount";

export async function generateStaticParams() {
  const deals = await getAllDeals();
  return deals
    .filter((d) => d.slug)
    .map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Backward compat: old /deals/deal-123 URLs
  if (/^deal-\d+$/.test(slug)) {
    return {};
  }

  const deal = await getDealBySlug(slug);
  if (!deal) return {};

  const title = `${deal.savingsAmount} ${deal.title} at ${deal.store.name} — Coupon & Deal`;
  const description = `${deal.description} ${deal.code ? `Use code ${deal.code}.` : ""} Verified by ${deal.workedYes} users. AI-verified, community-tested.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/deals/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/deals/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Backward compat: redirect old /deals/deal-123 URLs to slug URL
  if (/^deal-\d+$/.test(slug)) {
    const deal = await getDealById(slug);
    if (deal?.slug) {
      redirect(`/deals/${deal.slug}`);
    }
    notFound();
  }

  const deal = await getDealBySlug(slug);

  if (!deal) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: deal.title,
    description: deal.description,
    seller: {
      "@type": "Organization",
      name: deal.store.name,
      url: `https://${deal.store.domain}`,
    },
    url: `${BASE_URL}/deals/${slug}`,
    ...(deal.code && { disambiguatingDescription: `Use code: ${deal.code}` }),
    ...(deal.expiresAt && { validThrough: deal.expiresAt }),
    availability: "https://schema.org/InStock",
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Deals", item: `${BASE_URL}/deals` },
      { "@type": "ListItem", position: 3, name: deal.store.name, item: `${BASE_URL}/stores/${deal.store.slug}` },
      { "@type": "ListItem", position: 4, name: deal.title, item: `${BASE_URL}/deals/${slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <DealDetailContent deal={deal} />
    </main>
  );
}
