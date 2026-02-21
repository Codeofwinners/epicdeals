import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
  writeBatch,
  increment,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Deal, Store, Category, Comment } from "@/types/deals";
import { generateDealSlug } from "./slugify";
import {
  XP_VALUES,
  getUserRank,
  calculateUserXP,
  getEarnedBadges,
  BADGES,
  type XPActionType,
  type LeaderboardEntry,
  type LeaderboardPeriod,
  type UserStats,
} from "./gamification";

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
    commentCount: (data.commentCount as number) ?? 0,
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
    .filter((d) => d.status !== "expired" && d.status !== "pending_review")
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
    .filter((d) => d.status !== "expired" && d.status !== "pending_review")
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
  return snap.docs
    .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
    .filter((d) => d.status !== "pending_review");
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
    .filter((d) => d.status !== "expired" && d.status !== "pending_review")
    .slice(0, limit);
}

/** Unified filtered query for the dynamic feed */
export type TimeRange = "last-24h" | "last-7d" | "last-30d" | "all-time";
export type SortCategory = "most-voted" | "most-commented" | "most-viewed";

export async function getFilteredDeals(options: {
  timeRange: TimeRange;
  sortBy: SortCategory;
  limit?: number;
}): Promise<Deal[]> {
  const { timeRange, sortBy, limit = 40 } = options;

  try {
    // Attempt the optimized Firestore query with composite index
    let q = query(dealsCol);

    // Time Filter
    let cutoff: Timestamp | null = null;
    if (timeRange !== "all-time") {
      const now = Date.now();
      const ranges = {
        "last-24h": 24 * 3600000,
        "last-7d": 7 * 24 * 3600000,
        "last-30d": 30 * 24 * 3600000,
      };
      // @ts-ignore
      cutoff = Timestamp.fromMillis(now - ranges[timeRange]);
      q = query(q, where("createdAt", ">=", cutoff));
    }

    const sortFields = {
      "most-voted": "netVotes",
      "most-commented": "commentCount",
      "most-viewed": "viewCount",
    };

    q = query(
      q,
      orderBy(sortFields[sortBy], "desc"),
      firestoreLimit(limit)
    );

    const snap = await getDocs(q);
    return snap.docs
      .map((d) => docToDeal(d as any))
      .filter((d) => d.status !== "expired" && d.status !== "pending_review");
  } catch (error: any) {
    console.warn("Firestore index missing or query failed, falling back to in-memory filter:", error.message);

    // Fallback: Fetch latest deals and filter/sort in memory
    // This ensures the site works even without complex indexes configured
    try {
      const snap = await getDocs(query(dealsCol, orderBy("createdAt", "desc"), firestoreLimit(100)));
      let deals = snap.docs.map(d => docToDeal(d as any));

      // In-memory Time Filter
      if (timeRange !== "all-time") {
        const now = Date.now();
        const ranges = {
          "last-24h": 24 * 3600000,
          "last-7d": 7 * 24 * 3600000,
          "last-30d": 30 * 24 * 3600000,
        };
        // @ts-ignore
        const cutoffMs = now - ranges[timeRange];
        deals = deals.filter(d => new Date(d.createdAt).getTime() >= cutoffMs);
      }

      // In-memory Sort
      const sortFields = {
        "most-voted": "netVotes",
        "most-commented": "commentCount",
        "most-viewed": "viewCount",
      };
      const field = sortFields[sortBy];
      deals.sort((a: any, b: any) => (b[field] || 0) - (a[field] || 0));

      return deals.filter(d => d.status !== "expired" && d.status !== "pending_review").slice(0, options.limit || 20);
    } catch (fallbackError) {
      console.error("Critical error fetching deals:", fallbackError);
      return [];
    }
  }
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

  // Award XP for deal submission
  if (input.submittedBy?.id) {
    awardXP(input.submittedBy.id, XP_VALUES.DEAL_SUBMITTED, "DEAL_SUBMITTED", ref.id)
      .then(() => checkAndAwardBadges(input.submittedBy!.id))
      .catch(console.error);
  }

  return ref.id;
}

/** Add a comment to a deal */
export async function addComment(input: {
  dealId: string;
  content: string;
  user: { id: string; username: string; avatar: string; badges: string[] };
}): Promise<string> {
  if (!db) throw new Error("Firebase not initialized");
  const batch = writeBatch(db);

  // Create the comment doc with an auto-generated id
  const commentRef = doc(commentsCol);
  batch.set(commentRef, {
    dealId: input.dealId,
    content: input.content,
    user: input.user,
    upvotes: 0,
    createdAt: Timestamp.now(),
  });

  // Atomically increment the deal's commentCount
  const dealRef = doc(db, "deals", input.dealId);
  batch.update(dealRef, { commentCount: increment(1) });

  await batch.commit();

  // Award XP for commenting
  if (input.user.id) {
    awardXP(input.user.id, XP_VALUES.COMMENT_POSTED, "COMMENT_POSTED", commentRef.id)
      .then(() => checkAndAwardBadges(input.user.id))
      .catch(console.error);
  }

  return commentRef.id;
}

/** Get accurate comment count for a deal (uses aggregate count — no document reads) */
export async function getCommentCount(dealId: string): Promise<number> {
  if (!db || !dealId) return 0;
  try {
    const q = query(commentsCol, where("dealId", "==", dealId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch {
    return 0;
  }
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

/** Delete a comment (only by author or moderator) */
export async function deleteComment(commentId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");
  if (!commentId) throw new Error("Comment ID required");

  const commentRef = doc(db, "comments", commentId);
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) throw new Error("Comment not found");

  const dealId = commentSnap.data().dealId as string;
  const batch = writeBatch(db);
  batch.delete(commentRef);

  // Atomically decrement the deal's commentCount (floor at 0)
  if (dealId) {
    const dealRef = doc(db, "deals", dealId);
    batch.update(dealRef, { commentCount: increment(-1) });
  }

  await batch.commit();
}

/** Edit a comment (only by author) */
export async function editComment(commentId: string, newContent: string): Promise<void> {
  if (!commentId) throw new Error("Comment ID required");
  if (!newContent?.trim()) throw new Error("Comment content required");
  if (newContent.length > 1000) throw new Error("Comment must be under 1000 characters");

  await updateDoc(doc(db, "comments", commentId), {
    content: newContent,
    updatedAt: Timestamp.now(),
  });
}

// ─── User Profile Management ────────────────────────────────────
export interface UserProfile {
  id: string;
  handle: string;
  displayName: string;
  email: string;
  photoURL?: string;
  dealsSubmitted: number;
  totalUpvotes: number;
  reputation: number;
  badges: string[];
  createdAt: string;
  role: "user" | "moderator" | "admin";
  needsHandleSetup?: boolean;
}

/** Generate a random alphanumeric handle like user_a8f3k2 */
function generateRandomHandle(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `user_${suffix}`;
}

/** Create or get user profile on signup */
export async function ensureUserProfile(userId: string, userData: {
  displayName?: string;
  email?: string;
  photoURL?: string;
}): Promise<void> {
  if (!db) return;
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const handle = generateRandomHandle();
    await setDoc(userRef, {
      handle,
      needsHandleSetup: true,
      displayName: userData.displayName || "User",
      email: userData.email || "",
      photoURL: userData.photoURL || null,
      dealsSubmitted: 0,
      totalUpvotes: 0,
      reputation: 0,
      badges: [],
      createdAt: Timestamp.now(),
      role: "user",
    });
  }
}

/** Get user profile */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    handle: (data.handle as string) || generateRandomHandle(),
    displayName: data.displayName || "User",
    email: data.email || "",
    photoURL: data.photoURL || undefined,
    dealsSubmitted: data.dealsSubmitted || 0,
    totalUpvotes: data.totalUpvotes || 0,
    reputation: data.reputation || 0,
    badges: data.badges || [],
    createdAt: tsToISO(data.createdAt),
    role: data.role || "user",
    needsHandleSetup: data.needsHandleSetup ?? false,
  };
}

/** Validate and update a user's handle */
export async function updateUserHandle(userId: string, newHandle: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not initialized" };

  // Validate format: 3-20 chars, lowercase alphanumeric + underscores
  const handle = newHandle.toLowerCase().trim();
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    return { success: false, error: "Handle must be 3-20 characters, lowercase letters, numbers, and underscores only" };
  }

  // Check uniqueness
  const usersCol = collection(db, "users");
  const q = query(usersCol, where("handle", "==", handle), firestoreLimit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existingUser = snap.docs[0];
    if (existingUser.id !== userId) {
      return { success: false, error: "This username is already taken" };
    }
  }

  // Update handle
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    handle,
    needsHandleSetup: false,
  });

  return { success: true };
}

/** Check if a handle is available */
export async function checkHandleAvailability(handle: string, currentUserId?: string): Promise<boolean> {
  if (!db) return false;
  const h = handle.toLowerCase().trim();
  if (!/^[a-z0-9_]{3,20}$/.test(h)) return false;

  const usersCol = collection(db, "users");
  const q = query(usersCol, where("handle", "==", h), firestoreLimit(1));
  const snap = await getDocs(q);

  if (snap.empty) return true;
  if (currentUserId && snap.docs[0].id === currentUserId) return true;
  return false;
}

// ─── Voting System ──────────────────────────────────────────────
export interface VoteStatus {
  hasVoted: boolean;
  voteType: "upvote" | "downvote" | null;
}

/** Check if user has voted on a deal */
export async function getVoteStatus(userId: string, dealId: string): Promise<VoteStatus> {
  if (!db) {
    console.log("DB not initialized");
    return { hasVoted: false, voteType: null };
  }

  try {
    const upvoteRef = doc(db, "votes", userId, "dealUpvotes", dealId);
    const downvoteRef = doc(db, "votes", userId, "dealDownvotes", dealId);

    const [upvoteSnap, downvoteSnap] = await Promise.all([
      getDoc(upvoteRef),
      getDoc(downvoteRef),
    ]);

    console.log(`Vote status for ${userId}/${dealId}:`, { upvoteExists: upvoteSnap.exists(), downvoteExists: downvoteSnap.exists() });

    if (upvoteSnap.exists()) {
      console.log("Found upvote");
      return { hasVoted: true, voteType: "upvote" };
    }
    if (downvoteSnap.exists()) {
      console.log("Found downvote");
      return { hasVoted: true, voteType: "downvote" };
    }

    console.log("No vote found");
    return { hasVoted: false, voteType: null };
  } catch (error) {
    console.error("Error checking vote status:", error);
    return { hasVoted: false, voteType: null };
  }
}

/** Upvote a deal (toggle) */
export async function upvoteDeal(userId: string, dealId: string): Promise<boolean> {
  if (!db) throw new Error("Firebase not initialized");

  const upvoteRef = doc(db, "votes", userId, "dealUpvotes", dealId);
  const downvoteRef = doc(db, "votes", userId, "dealDownvotes", dealId);
  const dealRef = doc(db, "deals", dealId);

  try {
    console.log("Upvoting:", { userId, dealId });
    const [upvoteSnap, downvoteSnap, dealSnap] = await Promise.all([
      getDoc(upvoteRef),
      getDoc(downvoteRef),
      getDoc(dealRef),
    ]);

    if (!dealSnap.exists()) throw new Error("Deal not found");

    let netVoteChange = 0;

    if (upvoteSnap.exists()) {
      // Remove upvote
      console.log("Removing upvote");
      await deleteDoc(upvoteRef);
      netVoteChange = -1;
    } else {
      // Add upvote and remove downvote if exists
      console.log("Adding upvote");
      await setDoc(upvoteRef, { votedAt: Timestamp.now() });
      netVoteChange = 1;

      if (downvoteSnap.exists()) {
        await deleteDoc(downvoteRef);
        netVoteChange = 2; // Remove -1, add +1
      }
    }

    console.log("Updating deal netVotes by:", netVoteChange);
    // Update deal's netVotes
    await updateDoc(dealRef, {
      netVotes: (dealSnap.data().netVotes || 0) + netVoteChange,
    });

    // Award XP to deal author when upvoted (not when removing upvote)
    if (!upvoteSnap.exists()) {
      const dealData = dealSnap.data();
      const authorId = (dealData.submittedBy as any)?.id;
      if (authorId && authorId !== userId) {
        awardXP(authorId, XP_VALUES.DEAL_UPVOTE_RECEIVED, "DEAL_UPVOTE_RECEIVED", dealId)
          .then(() => checkAndAwardBadges(authorId))
          .catch(console.error);
      }
    }

    console.log("Vote successful");
    return !upvoteSnap.exists(); // Return true if upvote was added
  } catch (error) {
    console.error("Error upvoting deal:", error);
    throw error;
  }
}

/** Downvote a deal (toggle) */
export async function downvoteDeal(userId: string, dealId: string): Promise<boolean> {
  if (!db) throw new Error("Firebase not initialized");

  const upvoteRef = doc(db, "votes", userId, "dealUpvotes", dealId);
  const downvoteRef = doc(db, "votes", userId, "dealDownvotes", dealId);
  const dealRef = doc(db, "deals", dealId);

  try {
    const [upvoteSnap, downvoteSnap, dealSnap] = await Promise.all([
      getDoc(upvoteRef),
      getDoc(downvoteRef),
      getDoc(dealRef),
    ]);

    if (!dealSnap.exists()) throw new Error("Deal not found");

    let netVoteChange = 0;

    if (downvoteSnap.exists()) {
      // Remove downvote
      await deleteDoc(downvoteRef);
      netVoteChange = 1;
    } else {
      // Add downvote and remove upvote if exists
      await setDoc(downvoteRef, { votedAt: Timestamp.now() });
      netVoteChange = -1;

      if (upvoteSnap.exists()) {
        await deleteDoc(upvoteRef);
        netVoteChange = -2; // Remove +1, add -1
      }
    }

    // Update deal's netVotes
    await updateDoc(dealRef, {
      netVotes: (dealSnap.data().netVotes || 0) + netVoteChange,
    });

    return !downvoteSnap.exists(); // Return true if downvote was added
  } catch (error) {
    console.error("Error downvoting deal:", error);
    throw error;
  }
}

/** Check if user has voted on a comment */
export async function getCommentVoteStatus(userId: string, commentId: string): Promise<VoteStatus> {
  if (!db) return { hasVoted: false, voteType: null };

  try {
    const upvoteRef = doc(db, "votes", userId, "commentUpvotes", commentId);
    const downvoteRef = doc(db, "votes", userId, "commentDownvotes", commentId);

    const [upvoteSnap, downvoteSnap] = await Promise.all([
      getDoc(upvoteRef),
      getDoc(downvoteRef),
    ]);

    if (upvoteSnap.exists()) return { hasVoted: true, voteType: "upvote" };
    if (downvoteSnap.exists()) return { hasVoted: true, voteType: "downvote" };

    return { hasVoted: false, voteType: null };
  } catch (error) {
    console.error("Error checking comment vote status:", error);
    return { hasVoted: false, voteType: null };
  }
}

/** Upvote a comment (toggle) */
export async function upvoteComment(userId: string, commentId: string): Promise<boolean> {
  if (!db) throw new Error("Firebase not initialized");

  const upvoteRef = doc(db, "votes", userId, "commentUpvotes", commentId);
  const downvoteRef = doc(db, "votes", userId, "commentDownvotes", commentId);
  const commentRef = doc(db, "comments", commentId);

  try {
    const [upvoteSnap, downvoteSnap, commentSnap] = await Promise.all([
      getDoc(upvoteRef),
      getDoc(downvoteRef),
      getDoc(commentRef),
    ]);

    if (!commentSnap.exists()) throw new Error("Comment not found");

    let voteChange = 0;

    if (upvoteSnap.exists()) {
      await deleteDoc(upvoteRef);
      voteChange = -1;
    } else {
      await setDoc(upvoteRef, { votedAt: Timestamp.now() });
      voteChange = 1;

      if (downvoteSnap.exists()) {
        await deleteDoc(downvoteRef);
        voteChange = 2;
      }
    }

    await updateDoc(commentRef, {
      upvotes: (commentSnap.data().upvotes || 0) + voteChange,
    });

    // Award XP to comment author when upvoted
    if (!upvoteSnap.exists()) {
      const commentData = commentSnap.data();
      const authorId = (commentData.user as any)?.id;
      if (authorId && authorId !== userId) {
        awardXP(authorId, XP_VALUES.COMMENT_UPVOTE_RECEIVED, "COMMENT_UPVOTE_RECEIVED", commentId)
          .then(() => checkAndAwardBadges(authorId))
          .catch(console.error);
      }
    }

    return !upvoteSnap.exists();
  } catch (error) {
    console.error("Error upvoting comment:", error);
    throw error;
  }
}

/** Downvote a comment (toggle) */
export async function downvoteComment(userId: string, commentId: string): Promise<boolean> {
  if (!db) throw new Error("Firebase not initialized");

  const upvoteRef = doc(db, "votes", userId, "commentUpvotes", commentId);
  const downvoteRef = doc(db, "votes", userId, "commentDownvotes", commentId);
  const commentRef = doc(db, "comments", commentId);

  try {
    const [upvoteSnap, downvoteSnap, commentSnap] = await Promise.all([
      getDoc(upvoteRef),
      getDoc(downvoteRef),
      getDoc(commentRef),
    ]);

    if (!commentSnap.exists()) throw new Error("Comment not found");

    let voteChange = 0;

    if (downvoteSnap.exists()) {
      await deleteDoc(downvoteRef);
      voteChange = 1;
    } else {
      await setDoc(downvoteRef, { votedAt: Timestamp.now() });
      voteChange = -1;

      if (upvoteSnap.exists()) {
        await deleteDoc(upvoteRef);
        voteChange = -2;
      }
    }

    await updateDoc(commentRef, {
      upvotes: (commentSnap.data().upvotes || 0) + voteChange,
    });

    return !downvoteSnap.exists();
  } catch (error) {
    console.error("Error downvoting comment:", error);
    throw error;
  }
}

// ─── Save/Bookmark System ───────────────────────────────────────
/** Save a deal */
export async function saveDeal(userId: string, deal: Deal): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const saveRef = doc(db, "savedDeals", userId, "deals", deal.id);

  try {
    await setDoc(saveRef, {
      dealId: deal.id,
      dealTitle: deal.title,
      dealStore: deal.store.name,
      dealSlug: deal.slug,
      savedAt: Timestamp.now(),
      expiresAt: deal.expiresAt ? Timestamp.fromDate(new Date(deal.expiresAt)) : null,
    });
  } catch (error) {
    console.error("Error saving deal:", error);
    throw error;
  }
}

/** Unsave a deal */
export async function unsaveDeal(userId: string, dealId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const saveRef = doc(db, "savedDeals", userId, "deals", dealId);

  try {
    await deleteDoc(saveRef);
  } catch (error) {
    console.error("Error unsaving deal:", error);
    throw error;
  }
}

/** Check if deal is saved */
export async function isSaved(userId: string, dealId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const saveRef = doc(db, "savedDeals", userId, "deals", dealId);
    const snap = await getDoc(saveRef);
    return snap.exists();
  } catch (error) {
    console.error("Error checking if deal is saved:", error);
    return false;
  }
}

/** Get saved deals for user */
export async function getSavedDeals(userId: string, limit = 50): Promise<Deal[]> {
  if (!db) return [];

  try {
    const savedCol = collection(db, "savedDeals", userId, "deals");
    const q = query(savedCol, orderBy("savedAt", "desc"), firestoreLimit(limit));
    const snap = await getDocs(q);

    // Fetch full deal data for each saved deal
    const deals = await Promise.all(
      snap.docs.map(async (savedDoc) => {
        const data = savedDoc.data();
        return getDealById(data.dealId);
      })
    );

    return deals.filter((d) => d !== null) as Deal[];
  } catch (error) {
    console.error("Error getting saved deals:", error);
    return [];
  }
}

// ─── View Tracking ──────────────────────────────────────────────
/** Track deal view (increment viewCount) */
export async function trackDealView(dealId: string): Promise<void> {
  if (!db) return;

  try {
    const dealRef = doc(db, "deals", dealId);
    const snap = await getDoc(dealRef);

    if (snap.exists()) {
      await updateDoc(dealRef, {
        viewCount: (snap.data().viewCount || 0) + 1,
        lastViewed: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error tracking deal view:", error);
    // Silent fail - don't disrupt user experience
  }
}

// ─── Expiration Management ──────────────────────────────────────
/** Check and update expired deals */
export async function checkExpiredDeals(): Promise<number> {
  if (!db) return 0;

  try {
    const now = Timestamp.now();
    const q = query(
      dealsCol,
      where("expiresAt", "<", now),
      where("status", "!=", "expired")
    );

    const snap = await getDocs(q);
    let updatedCount = 0;

    for (const dealDoc of snap.docs) {
      await updateDoc(dealDoc.ref, { status: "expired" });
      updatedCount++;
    }

    return updatedCount;
  } catch (error) {
    console.error("Error checking expired deals:", error);
    return 0;
  }
}

/** Get expiration time remaining (in hours) */
export function getTimeRemaining(expiresAt: string | undefined): number | null {
  if (!expiresAt) return null;

  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diffMs = expiry - now;

  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60)); // Convert to hours
}

// ─── Admin Review Queue ─────────────────────────────────────────

/** Get all deals pending review, newest first */
export async function getPendingReviewDeals(): Promise<Deal[]> {
  if (!dealsCol) return [];
  try {
    const q = query(
      dealsCol,
      where("status", "==", "pending_review")
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error("Error fetching pending review deals:", err);
    return [];
  }
}

/** Approve a pending deal (moves to newly_added) */
export async function approveDeal(dealId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");
  const dealRef = doc(db, "deals", dealId);
  const dealSnap = await getDoc(dealRef);

  await updateDoc(dealRef, {
    status: "newly_added",
    reviewedAt: Timestamp.now(),
  });

  // Award XP to deal submitter for verification
  if (dealSnap.exists()) {
    const submitterId = (dealSnap.data().submittedBy as any)?.id;
    if (submitterId) {
      awardXP(submitterId, XP_VALUES.DEAL_VERIFIED, "DEAL_VERIFIED", dealId)
        .then(() => checkAndAwardBadges(submitterId))
        .catch(console.error);
    }
  }
}

/** Reject a pending deal (deletes it) */
export async function rejectDeal(dealId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");
  await deleteDoc(doc(db, "deals", dealId));
}

// ─── Gamification: XP & Leaderboard ─────────────────────────────────────────

/** Award XP to a user atomically and update their rank */
export async function awardXP(
  userId: string,
  amount: number,
  actionType: XPActionType,
  _sourceId?: string
): Promise<void> {
  if (!db || !userId || amount <= 0) return;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const currentXP = (snap.data().xp as number) || 0;
    const newXP = currentXP + amount;
    const rank = getUserRank(newXP);

    // Build stat increment field based on action type
    const statField: Record<string, unknown> = {
      xp: newXP,
      rank: rank.name,
      xpUpdatedAt: Timestamp.now(),
    };

    if (actionType === "DEAL_SUBMITTED") statField.dealsSubmitted = increment(1);
    if (actionType === "DEAL_VERIFIED") statField.dealsVerified = increment(1);
    if (actionType === "DEAL_COMMUNITY_PICK") statField.dealsCommunityPick = increment(1);
    if (actionType === "DEAL_UPVOTE_RECEIVED") statField.totalDealUpvotesReceived = increment(1);
    if (actionType === "COMMENT_POSTED") statField.commentsPosted = increment(1);
    if (actionType === "COMMENT_UPVOTE_RECEIVED") statField.totalCommentUpvotesReceived = increment(1);
    if (actionType === "DEAL_WORKED_VOTE") statField.totalWorkedYes = increment(1);

    // Update streak
    const lastActive = snap.data().lastActiveDate as string | undefined;
    const today = new Date().toISOString().split("T")[0];
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const currentStreak = (snap.data().currentStreak as number) || 0;
      const longestStreak = (snap.data().longestStreak as number) || 0;

      if (lastActive === yesterday) {
        const newStreak = currentStreak + 1;
        statField.currentStreak = newStreak;
        statField.longestStreak = Math.max(longestStreak, newStreak);
      } else {
        statField.currentStreak = 1;
        statField.longestStreak = Math.max(longestStreak, 1);
      }
      statField.lastActiveDate = today;
    }

    await updateDoc(userRef, statField);
  } catch (error) {
    console.error("Error awarding XP:", error);
  }
}

/** Recalculate a user's total XP from their stats */
export async function recalculateUserXP(userId: string): Promise<number> {
  if (!db) return 0;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return 0;

    const data = snap.data();
    const stats: UserStats = {
      dealsSubmitted: (data.dealsSubmitted as number) || 0,
      dealsVerified: (data.dealsVerified as number) || 0,
      dealsCommunityPick: (data.dealsCommunityPick as number) || 0,
      totalDealUpvotesReceived: (data.totalDealUpvotesReceived as number) || 0,
      commentsPosted: (data.commentsPosted as number) || 0,
      totalCommentUpvotesReceived: (data.totalCommentUpvotesReceived as number) || 0,
      totalWorkedYes: (data.totalWorkedYes as number) || 0,
    };

    const xp = calculateUserXP(stats);
    const rank = getUserRank(xp);

    await updateDoc(userRef, { xp, rank: rank.name, xpUpdatedAt: Timestamp.now() });
    return xp;
  } catch (error) {
    console.error("Error recalculating XP:", error);
    return 0;
  }
}

/** Check and award badges for a user */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  if (!db) return [];
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return [];

    const data = snap.data();
    const stats = {
      dealsSubmitted: (data.dealsSubmitted as number) || 0,
      dealsVerified: (data.dealsVerified as number) || 0,
      dealsCommunityPick: (data.dealsCommunityPick as number) || 0,
      totalDealUpvotesReceived: (data.totalDealUpvotesReceived as number) || 0,
      commentsPosted: (data.commentsPosted as number) || 0,
      totalCommentUpvotesReceived: (data.totalCommentUpvotesReceived as number) || 0,
      totalWorkedYes: (data.totalWorkedYes as number) || 0,
      joinedAt: tsToISO(data.createdAt),
      currentStreak: (data.currentStreak as number) || 0,
      longestStreak: (data.longestStreak as number) || 0,
    };

    const earned = getEarnedBadges(stats);
    const existingBadges: string[] = (data.badges as string[]) || [];
    const newBadgeIds = earned.map((b) => b.id).filter((id) => !existingBadges.includes(id));

    if (newBadgeIds.length > 0) {
      await updateDoc(userRef, { badges: [...existingBadges, ...newBadgeIds] });
    }

    return newBadgeIds;
  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
}

/** Get leaderboard snapshot for a given period */
export async function getLeaderboard(period: LeaderboardPeriod = "alltime"): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  try {
    const snapshotRef = doc(db, "leaderboardSnapshots", period);
    const snap = await getDoc(snapshotRef);

    if (snap.exists()) {
      return (snap.data().entries as LeaderboardEntry[]) || [];
    }

    // If no snapshot exists, build one on-the-fly from users collection
    return await rebuildLeaderboardSnapshot(period);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

/** Get a user's rank position in a leaderboard period */
export async function getUserRankPosition(
  userId: string,
  period: LeaderboardPeriod = "alltime"
): Promise<{ position: number; entry: LeaderboardEntry | null }> {
  const entries = await getLeaderboard(period);
  const index = entries.findIndex((e) => e.userId === userId);
  if (index === -1) return { position: -1, entry: null };
  return { position: index + 1, entry: entries[index] };
}

// ─── User Deal Management (Edit/Delete) ─────────────────────────

/** Get all deals submitted by a specific user */
export async function getUserSubmittedDeals(userId: string): Promise<Deal[]> {
  if (!dealsCol || !userId) return [];
  try {
    const q = query(dealsCol, where("submittedBy.id", "==", userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => docToDeal(d as unknown as { id: string; data: () => Record<string, unknown> }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching user submitted deals:", error);
    return [];
  }
}

/** Update a deal (only by the original submitter) */
export async function updateDeal(
  dealId: string,
  userId: string,
  updates: Partial<Pick<Deal, "title" | "description" | "code" | "dealUrl" | "savingsAmount" | "conditions">>
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");
  if (!dealId || !userId) throw new Error("Deal ID and User ID required");

  const dealRef = doc(db, "deals", dealId);
  const snap = await getDoc(dealRef);
  if (!snap.exists()) throw new Error("Deal not found");

  const data = snap.data();
  if ((data.submittedBy as any)?.id !== userId) {
    throw new Error("You can only edit your own deals");
  }

  const allowedFields: Record<string, unknown> = {};
  if (updates.title !== undefined) allowedFields.title = updates.title;
  if (updates.description !== undefined) allowedFields.description = updates.description;
  if (updates.code !== undefined) allowedFields.code = updates.code || null;
  if (updates.dealUrl !== undefined) allowedFields.dealUrl = updates.dealUrl;
  if (updates.savingsAmount !== undefined) allowedFields.savingsAmount = updates.savingsAmount;
  if (updates.conditions !== undefined) allowedFields.conditions = updates.conditions || null;

  allowedFields.updatedAt = Timestamp.now();

  await updateDoc(dealRef, allowedFields);
}

/** Delete a deal (only by the original submitter) */
export async function deleteUserDeal(dealId: string, userId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");
  if (!dealId || !userId) throw new Error("Deal ID and User ID required");

  const dealRef = doc(db, "deals", dealId);
  const snap = await getDoc(dealRef);
  if (!snap.exists()) throw new Error("Deal not found");

  const data = snap.data();
  if ((data.submittedBy as any)?.id !== userId) {
    throw new Error("You can only delete your own deals");
  }

  const storeId = (data.store as any)?.id;

  await deleteDoc(dealRef);

  // Decrement store activeDeals count
  if (storeId) {
    try {
      const storeRef = doc(db, "stores", storeId);
      await updateDoc(storeRef, { activeDeals: increment(-1) });
    } catch {
      // Non-critical — store counter decrement can fail silently
    }
  }
}

/** Rebuild leaderboard snapshot from users collection */
export async function rebuildLeaderboardSnapshot(period: LeaderboardPeriod = "alltime"): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  try {
    const usersCol = collection(db, "users");
    const q = query(usersCol, orderBy("xp", "desc"), firestoreLimit(100));
    const snap = await getDocs(q);

    const entries: LeaderboardEntry[] = snap.docs
      .filter((d) => (d.data().xp || 0) > 0)
      .map((d, i) => {
        const data = d.data();
        const xp = (data.xp as number) || 0;
        const rank = getUserRank(xp);
        return {
          userId: d.id,
          handle: (data.handle as string) || (data.displayName as string) || "User",
          displayName: (data.displayName as string) || "User",
          photoURL: (data.photoURL as string) || null,
          xp,
          rank: rank.name,
          rankColor: rank.color,
          rankIcon: rank.icon,
          dealsSubmitted: (data.dealsSubmitted as number) || 0,
          totalUpvotes: (data.totalDealUpvotesReceived as number) || (data.totalUpvotes as number) || 0,
          badges: (data.badges as string[]) || [],
          position: i + 1,
        };
      });

    // Save snapshot
    try {
      const snapshotRef = doc(db, "leaderboardSnapshots", period);
      await setDoc(snapshotRef, {
        entries,
        updatedAt: Timestamp.now(),
        period,
      });
    } catch {
      // Non-critical — snapshot save can fail silently
    }

    return entries;
  } catch (error) {
    console.error("Error rebuilding leaderboard:", error);
    return [];
  }
}
