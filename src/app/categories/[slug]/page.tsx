import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getAllCategories } from "@/lib/firestore";
import CategoryPageContent from "./CategoryPageContent";

const BASE_URL = "https://legit.discount";

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const title = `${category.name} Deals & Promo Codes (${monthYear})`;
  const description = `Browse ${category.dealCount}+ verified ${category.name.toLowerCase()} deals and promo codes for ${monthYear}. AI-verified, community-tested savings.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/categories/${slug}` },
    openGraph: { title, description, url: `${BASE_URL}/categories/${slug}`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Deals`,
    description: `Browse the best deals and promo codes in ${category.name}.`,
    url: `${BASE_URL}/categories/${slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${BASE_URL}/categories` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${BASE_URL}/categories/${slug}` },
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
          <Link href="/categories" className="hover:text-gray-600 transition-colors">Categories</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </nav>
      </div>

      <CategoryPageContent category={category} />
    </main>
  );
}
