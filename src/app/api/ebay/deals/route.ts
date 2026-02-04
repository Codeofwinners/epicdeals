import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const AFFILIATE_CAMPID = "5339117469";
const AFFILIATE_MKRID = "711-53200-19255-0";

function addAffiliateParams(url: string): string {
  if (!url || !url.includes("ebay.com")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}mkcid=1&mkrid=${AFFILIATE_MKRID}&siteid=0&campid=${AFFILIATE_CAMPID}&toolid=10001`;
}

export async function GET() {
  try {
    console.log("🔥 Scraping eBay Deals page...");

    const response = await fetch("https://www.ebay.com/deals", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`eBay Deals Page returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const dealItems: any[] = [];

    $(".dne-itemtile, .ebayui-dne-summary-card").each((i, el) => {
      try {
        const title = $(el).find(".dne-itemtile-title, .dne-summary-card-title").first().text().trim();
        if (!title) return;

        const priceText = $(el).find(".dne-itemtile-price, .dne-summary-card-price").first().text().trim();
        const priceMatch = priceText.match(/[\d,]+\.\d{2}/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, "")) : 0;

        const originalPriceText = $(el).find(".dne-itemtile-original-price, .dne-summary-card-original-price").first().text().trim();
        const originalPriceMatch = originalPriceText.match(/[\d,]+\.\d{2}/);
        const originalPrice = originalPriceMatch ? parseFloat(originalPriceMatch[0].replace(/,/g, "")) : undefined;

        let imageUrl = $(el).find("img").attr("src");
        const dataSrc = $(el).find("img").attr("data-src");
        const dataConfigSrc = $(el).find("img").attr("data-config-src");

        if (dataSrc && !dataSrc.includes("placeholder")) {
          imageUrl = dataSrc;
        } else if (dataConfigSrc && !dataConfigSrc.includes("placeholder")) {
          imageUrl = dataConfigSrc;
        }

        if (!imageUrl || imageUrl.includes("g-img-placeholder") || imageUrl.includes("s_1x2.png")) {
          const noscriptContent = $(el).find("noscript").text();
          const noscriptMatch = noscriptContent.match(/src="([^"]+)"/);
          if (noscriptMatch) {
            imageUrl = noscriptMatch[1];
          }
        }

        if (imageUrl && imageUrl.includes("i.ebayimg.com")) {
          imageUrl = imageUrl.replace(/s-l\d+\./, "s-l500.");
        }

        if (!imageUrl) {
          imageUrl = "https://ir.ebaystatic.com/cr/v/c1/s_1x2.png";
        }

        const itemUrl = $(el).find('a[itemprop="url"], a').first().attr("href") || "";
        const itemIdMatch = itemUrl.match(/\/(\d+)\?/);
        const itemId = itemIdMatch ? itemIdMatch[1] : `deal-${i}`;

        const savings = originalPrice && price ? originalPrice - price : undefined;

        dealItems.push({
          id: itemId,
          title,
          price,
          originalPrice,
          imageUrl,
          itemUrl: addAffiliateParams(itemUrl),
          condition: "Daily Deal",
          savings: savings && savings > 0 ? savings : undefined,
        });
      } catch (err) {
        console.error("Error parsing deal item:", err);
      }
    });

    console.log(`✅ Scraped ${dealItems.length} deals`);

    // Remove duplicates
    const uniqueDeals = Array.from(new Map(dealItems.map((item) => [item.title, item])).values());

    return NextResponse.json({
      items: uniqueDeals,
      total: uniqueDeals.length,
      source: "eBay Daily Deals",
    });
  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: "Failed to scrape deals", items: [] }, { status: 500 });
  }
}
