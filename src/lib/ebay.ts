export interface eBayItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  itemUrl: string;
  condition: string;
  savings?: number;
}

export async function fetcheBayDeals(query: string = ""): Promise<eBayItem[]> {
  // Homepage: use deals scraper for Daily Deals
  // Search: use search API with keyword filtering
  const endpoint = query.trim()
    ? `/api/ebay/search?q=${encodeURIComponent(query.trim())}&limit=200`
    : "/api/ebay/deals";

  const response = await fetch(endpoint, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch eBay deals: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}
