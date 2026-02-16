import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug, getAllStores } from "@/lib/firestore";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: `https://${store.domain}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Stores", item: `${BASE_URL}/stores` },
      { "@type": "ListItem", position: 3, name: store.name, item: `${BASE_URL}/stores/${slug}` },
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
