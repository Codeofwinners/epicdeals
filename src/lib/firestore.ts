import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Deal, Store, Category, Comment } from "@/types/deals";
import { generateDealSlug } from "./slugify";

// ─── Collection refs ────────────────────────────────────────────
const dealsCol = (db ? collection(db, "deals") : null) as any;
const storesCol = (db ? collection(db, "stores") : null) as any;
const categoriesCol = (db ? collection(db, "categories") : null) as any;
const commentsCol = (db ? collection(db, "comments") : null) as any;

// ─── Converters (Firestore doc → app type) ──────────────────────
function tsToISO(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "string") return val;
  return new Date().toISOString();
}

function docToDeal(d: ReturnType<typeof doc> extends never ? never : { id: string; data: () => Record<string, unknown> }): Deal {
  const data = d.data() as Record<string, unknown>;
  const store = data.store as Deal["store"];
  return {
    ...data,
    id: d.id,
    slug: (data.slug as string) || generateDealSlug(data.title as string, store.slug),
    createdAt: tsToISO(data.createdAt),
    expiresAt: data.expiresAt ? tsToISO(data.expiresAt) : undefined,
    lastVerifiedAt: tsToISO(data.lastVerifiedAt),
    store,
    category: data.category as Deal["category"],
    submittedBy: data.submittedBy as Deal["submittedBy"],
    tags: (data.tags as string[]) ?? [],
  } as Deal;
}

function docToStore(d: { id: string; data: () => Record<string, unknown> }): Store {
  return { ...(d.data() as unknown as Store), id: d.id };
}

function docToCategory(d: { id: string; data: () => Record<string, unknown> }): Category {
  return { ...(d.data() as unknown as Category), id: d.id };
}

function docToComment(d: { id: string; data: () => Record<string, unknown> }): Comment {
  const data = d.data() as Record<string, unknown>;
  return {
    ...data,
    id: d.id,
    createdAt: tsToISO(data.createdAt),
    user: data.user as Comment["user"],
  } as Comment;
}

// ─── Deal queries ───────────────────────────────────────────────

/** Hot Right Now: highest usedLastHour */
export async function getHotDeals(limit = 6): Promise<Deal[]> {
  const q = query(
    dealsCol,
    orderBy("usedLastHour", "desc"),
    firestoreLimit(limit + 5)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => d.status !== "expired")
    .slice(0, limit);
}

/** Most Popular: highest net upvotes (stored as netVotes field) */
export async function getPopularDeals(limit = 12): Promise<Deal[]> {
  const q = query(
    dealsCol,
    orderBy("netVotes", "desc"),
    firestoreLimit(limit + 5)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => d.status !== "expired")
    .slice(0, limit);
}

/** Just Added: most recent createdAt */
export async function getNewDeals(limit = 10): Promise<Deal[]> {
  const q = query(
    dealsCol,
    orderBy("createdAt", "desc"),
    firestoreLimit(limit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

/** Expiring Soon: has expiresAt within 72 hours, sorted by soonest */
export async function getExpiringSoon(limit = 6): Promise<Deal[]> {
  const now = Timestamp.now();
  const cutoff = Timestamp.fromDate(
    new Date(Date.now() + 72 * 3_600_000)
  );
  const q = query(
    dealsCol,
    where("expiresAt", ">", now),
    where("expiresAt", "<=", cutoff),
    orderBy("expiresAt", "asc"),
    firestoreLimit(limit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

/** Top deals by category */
export async function getDealsByCategory(
  categoryId: string,
  limit = 8
): Promise<Deal[]> {
  if (!categoryId) return [];
  const q = query(
    dealsCol,
    where("category.id", "==", categoryId),
    orderBy("netVotes", "desc"),
    firestoreLimit(limit + 5)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => d.status !== "expired")
    .slice(0, limit);
}

/** Most Confirmed: highest workedYes ≥50 */
export async function getMostConfirmed(limit = 8): Promise<Deal[]> {
  const q = query(
    dealsCol,
    orderBy("workedYes", "desc"),
    firestoreLimit(limit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

/** Get deals for a specific store (by slug) */
export async function getStoreDeals(storeSlug: string): Promise<Deal[]> {
  const q = query(dealsCol, where("store.slug", "==", storeSlug));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

/** Get a single deal by ID */
export async function getDealById(id: string): Promise<Deal | null> {
  const snap = await getDoc(doc(db, "deals", id));
  if (!snap.exists()) return null;
  return docToDeal(snap as unknown as { id: string; data: () => Record<string, unknown> });
}

/** Get a single deal by slug */
export async function getDealBySlug(slug: string): Promise<Deal | null> {
  // Try direct Firestore query first (deals with slug field stored)
  const q = query(dealsCol, where("slug", "==", slug), firestoreLimit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return docToDeal(snap.docs[0] as unknown as { id: string; data: () => Record<string, unknown> });
  }

  // Fallback: find deals whose generated slug matches (for deals without slug field in Firestore)
  const allSnap = await getDocs(dealsCol);
  for (const d of allSnap.docs) {
    const deal = docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> });
    if (deal.slug === slug) return deal;
  }

  return null;
}

/** Get a deal by store slug and title slug */
export async function getDealByStoreAndSlug(storeSlug: string, titleSlug: string): Promise<Deal | null> {
  const q = query(dealsCol, where("store.slug", "==", storeSlug));
  const snap = await getDocs(q);
  const { getTitleSlug } = await import("./urls");
  for (const d of snap.docs) {
    const deal = docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> });
    if (getTitleSlug(deal) === titleSlug) return deal;
  }
  return null;
}

/** Get coupons for a store (deals with a promo code) */
export async function getStoreCoupons(storeSlug: string): Promise<Deal[]> {
  const q = query(dealsCol, where("store.slug", "==", storeSlug));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => !!d.code);
}

/** Get deals-only for a store (deals without a promo code) */
export async function getStoreDealsOnly(storeSlug: string): Promise<Deal[]> {
  const q = query(dealsCol, where("store.slug", "==", storeSlug));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => !d.code);
}

/** Get all coupons across all stores (deals with a promo code) */
export async function getAllCoupons(): Promise<Deal[]> {
  const snap = await getDocs(dealsCol);
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => !!d.code);
}

/** Get all deals-only across all stores (deals without a promo code) */
export async function getAllDealsOnly(): Promise<Deal[]> {
  const snap = await getDocs(dealsCol);
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => !d.code);
}

/** Get all deals (for sitemap) */
export async function getAllDeals(): Promise<Deal[]> {
  if (!dealsCol) return [];
  const snap = await getDocs(dealsCol);
  return snap.docs.map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

// ─── Store queries ──────────────────────────────────────────────

export async function getAllStores(): Promise<Store[]> {
  if (!storesCol) return [];
  const snap = await getDocs(storesCol);
  return snap.docs.map((d) => docToStore(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  if (!storesCol) return null;
  const q = query(storesCol, where("slug", "==", slug), firestoreLimit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docToStore(snap.docs[0] as unknown as { id: string; data: () => Record<string, unknown> });
}

// ─── Category queries ───────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  if (!categoriesCol) return [];
  const snap = await getDocs(categoriesCol);
  return snap.docs.map((d) => docToCategory(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const q = query(
    categoriesCol,
    where("slug", "==", slug),
    firestoreLimit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docToCategory(snap.docs[0] as unknown as { id: string; data: () => Record<string, unknown> });
}

// ─── Comment queries ────────────────────────────────────────────

export async function getDealComments(dealId: string): Promise<Comment[]> {
  const q = query(
    commentsCol,
    where("dealId", "==", dealId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToComment(d as unknown as { id: string; data: () => Record<string, unknown> }));
}

// ─── Write operations ───────────────────────────────────────────

export interface SubmitDealInput {
  title: string;
  description: string;
  code?: string;
  store: Store;
  category: Category;
  savingsType: Deal["savingsType"];
  savingsAmount: string;
  savingsValue: number;
  discountType: Deal["discountType"];
  conditions?: string;
  dealUrl: string;
  expiresAt?: string;
  submittedBy?: Deal["submittedBy"];
  tags?: string[];
}

export async function submitDeal(input: SubmitDealInput): Promise<string> {
  const now = Timestamp.now();
  const slug = generateDealSlug(input.title, input.store.slug);
  const ref = await addDoc(dealsCol, {
    ...input,
    slug,
    upvotes: 0,
    downvotes: 0,
    netVotes: 0,
    workedYes: 0,
    workedNo: 0,
    commentCount: 0,
    usedLastHour: 0,
    status: "newly_added",
    source: "user_submitted",
    isVerified: false,
    isTrending: false,
    isCommunityPick: false,
    createdAt: now,
    lastVerifiedAt: now,
    expiresAt: input.expiresAt
      ? Timestamp.fromDate(new Date(input.expiresAt))
      : null,
    tags: input.tags ?? [],
  });
  return ref.id;
}

/** Add a comment to a deal */
export async function addComment(input: {
  dealId: string;
  content: string;
  user: { id: string; username: string; avatar: string; badges: string[] };
}): Promise<string> {
  const ref = await addDoc(commentsCol, {
    dealId: input.dealId,
    content: input.content,
    user: input.user,
    upvotes: 0,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

/** Real-time listener for deal comments (sorts client-side to avoid composite index) */
export function onDealComments(
  dealId: string,
  callback: (comments: Comment[]) => void
) {
  const q = query(
    commentsCol,
    where("dealId", "==", dealId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const comments = snap.docs
        .map((d) =>
          docToComment(d as unknown as { id: string; data: () => Record<string, unknown> })
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(comments);
    },
    (err) => {
      console.error("Comments listener error:", err);
      callback([]);
    }
  );
}

/** Fetch latest comment for a deal (for card preview) */
export async function getLatestComment(dealId: string): Promise<Comment | null> {
  if (!dealId) return null;
  const q = query(
    commentsCol,
    where("dealId", "==", dealId),
    firestoreLimit(10)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const comments = snap.docs
    .map((d) => docToComment(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return comments[0] ?? null;
}

/** Fetch the "best" comment for a deal preview: highest voted if any have votes, otherwise latest */
export async function getBestComment(dealId: string): Promise<Comment | null> {
  if (!dealId) return null;
  const q = query(
    commentsCol,
    where("dealId", "==", dealId),
    firestoreLimit(15)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const comments = snap.docs
    .map((d) => docToComment(d as unknown as { id: string; data: () => Record<string, unknown> }));
  // If any comment has votes, return the highest voted
  const withVotes = comments.filter((c) => c.upvotes > 0);
  if (withVotes.length > 0) {
    return withVotes.sort((a, b) => b.upvotes - a.upvotes)[0];
  }
  // Otherwise return the most recent
  return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}
