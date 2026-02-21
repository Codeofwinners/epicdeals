import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug, getAllStores, getStoreCoupons } from "@/lib/firestore";
import StoreCouponsContent from "./StoreCouponsContent";

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
  const title = `${store.name} Coupon Codes & Promo Codes (${monthYear})`;
  const description = `${store.name} coupon codes for ${monthYear}. Copy verified promo codes that actually work. Community-tested & AI-verified ${store.name} coupons.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/stores/${slug}/coupons` },
    openGraph: { title, description, url: `${BASE_URL}/stores/${slug}/coupons`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function StoreCouponsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  let coupons: any[] = [];
  try {
    coupons = await getStoreCoupons(slug);
  } catch (e) {
    console.warn("Failed to fetch store coupons for JSON-LD:", e);
  }

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Breadcrumb JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Stores", item: `${BASE_URL}/stores` },
      { "@type": "ListItem", position: 3, name: store.name, item: `${BASE_URL}/stores/${slug}` },
      { "@type": "ListItem", position: 4, name: "Coupon Codes", item: `${BASE_URL}/stores/${slug}/coupons` },
    ],
  };

  // AggregateOffer JSON-LD for coupons
  const aggregateOfferLd = coupons.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    offerCount: coupons.length,
    offers: coupons.slice(0, 10).map(d => ({
      "@type": "Offer",
      name: d.title,
      description: d.description,
      url: d.dealUrl,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    })),
  } : null;

  return (
    <main className="min-h-screen bg-gray-50 pt-4">
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

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/stores" className="hover:text-gray-600 transition-colors">Stores</Link>
          <span>/</span>
          <Link href={`/stores/${slug}`} className="hover:text-gray-600 transition-colors">{store.name}</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Coupon Codes</span>
        </nav>
      </div>

      <StoreCouponsContent store={store} />
    </main>
  );
}
