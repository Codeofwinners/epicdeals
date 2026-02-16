export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[$%]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function generateDealSlug(title: string, storeSlug: string): string {
  return `${slugify(title)}-${storeSlug}`;
}
