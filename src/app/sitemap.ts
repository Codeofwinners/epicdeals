import type { MetadataRoute } from "next";
import { getAllDeals, getAllStores, getAllCategories } from "@/lib/firestore";

const BASE_URL = "https://legit.discount";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let deals: any[] = [];
  let stores: any[] = [];
  let categories: any[] = [];

  try {
    const results = await Promise.all([
      getAllDeals(),
      getAllStores(),
      getAllCategories(),
    ]);
    [deals, stores, categories] = results;
  } catch (error) {
    console.warn("Failed to fetch from Firestore for sitemap, using static pages only", error);
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/stores`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ];

  const dealPages: MetadataRoute.Sitemap = deals
    .filter((d) => d.slug)
    .map((deal) => ({
      url: `${BASE_URL}/deals/${deal.slug}`,
      lastModified: new Date(deal.lastVerifiedAt || deal.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  const storePages: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${BASE_URL}/stores/${store.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...dealPages, ...storePages, ...categoryPages];
}
