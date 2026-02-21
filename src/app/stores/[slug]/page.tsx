import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug, getAllStores, getStoreDeals } from "@/lib/firestore";
import StorePageContent from "./StorePageContent";

const BASE_URL = "https://legit.discount";

export async function generateStaticParams() {
  const stores = await getAllStores();
  return stores.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return {};

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const title = `${store.name} Coupons & Promo Codes (${monthYear})`;
  const description = `Save at ${store.name} with ${store.activeDeals} verified coupon codes and deals for ${monthYear}. AI-verified, community-tested.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/stores/${slug}` },
    openGraph: { title, description, url: `${BASE_URL}/stores/${slug}`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  // Fetch deals server-side for structured data
  let deals: any[] = [];
  try {
    deals = await getStoreDeals(slug);
  } catch (e) {
    console.warn("Failed to fetch store deals for JSON-LD:", e);
  }

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const activeDealCount = deals.filter(d => d.status !== "expired").length;
  const couponsCount = deals.filter(d => !!d.code).length;
  const hasFreeShipping = deals.some(d =>
    d.title?.toLowerCase().includes("free shipping") ||
    d.tags?.includes("free-shipping") ||
    d.savingsType === "free_shipping"
  );

  // Organization JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: `https://${store.domain}`,
  };

  // Breadcrumb JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Stores", item: `${BASE_URL}/stores` },
      { "@type": "ListItem", position: 3, name: store.name, item: `${BASE_URL}/stores/${slug}` },
    ],
  };

  // AggregateOffer JSON-LD
  const aggregateOfferLd = activeDealCount > 0 ? {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    offerCount: activeDealCount,
    offers: deals.slice(0, 10).map(d => ({
      "@type": "Offer",
      name: d.title,
      description: d.description,
      url: d.dealUrl,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    })),
  } : null;

  // FAQPage JSON-LD
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How many ${store.name} coupons are available right now?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `There are currently ${activeDealCount} verified ${store.name} coupon codes and deals available for ${monthYear}${couponsCount > 0 ? `, including ${couponsCount} promo codes` : ""}.`,
        },
      },
      {
        "@type": "Question",
        name: `Does ${store.name} offer free shipping?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: hasFreeShipping
            ? `Yes! ${store.name} currently has free shipping offers available. Check our deals page for the latest free shipping codes and minimum order requirements.`
            : `${store.name} may offer free shipping promotions from time to time. Check back regularly for the latest shipping deals and promo codes.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I use a ${store.name} promo code?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `1. Browse our verified ${store.name} coupons and click to copy the code. 2. Shop at ${store.domain} and add items to your cart. 3. At checkout, paste the promo code in the coupon field and click Apply. 4. Your discount will be applied to your order total.`,
        },
      },
      {
        "@type": "Question",
        name: `Are ${store.name} coupon codes verified?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, all ${store.name} coupons on Legit.discount are community-tested and AI-verified. Our users vote on deals and report whether codes work, so you can shop with confidence.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {aggregateOfferLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateOfferLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/stores" className="hover:text-gray-600 transition-colors">Stores</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{store.name}</span>
        </nav>
      </div>

      <StorePageContent store={store} />
    </main>
  );
}
