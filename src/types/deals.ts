export type DealStatus = 'verified' | 'expiring_soon' | 'newly_added' | 'user_submitted' | 'expired';
export type DealSource = 'ai_discovered' | 'user_submitted';
export type DealType = 'percent_off' | 'dollar_off' | 'bogo' | 'free_shipping' | 'free_trial' | 'cashback';
export type DiscountType = 'code' | 'deal' | 'sale';

export interface Store {
  id: string;
  name: string;
  slug: string;
  domain: string;
  activeDeals: number;
  isFeatured: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  dealCount: number;
  color: string;
}

export interface User {
  id: string;
  username: string;
  reputation: number;
  badges: string[];
  dealsSubmitted: number;
}

export interface Comment {
  id: string;
  dealId: string;
  user: User;
  content: string;
  createdAt: string;
  upvotes: number;
  replies?: Comment[];
}

export interface Deal {
  id: string;
  slug: string;
  title: string;
  description: string;
  discount: string;
  code?: string;
  store: Store;
  category: Category;
  savingsType: DealType;
  savingsAmount: string;
  savingsValue: number;
  discountType: DiscountType;
  conditions?: string;
  upvotes: number;
  downvotes: number;
  workedYes: number;
  workedNo: number;
  commentCount: number;
  netVotes: number;
  viewCount: number;
  usedLastHour: number;
  status: DealStatus;
  source: DealSource;
  isVerified: boolean;
  isTrending: boolean;
  isCommunityPick: boolean;
  createdAt: string;
  expiresAt?: string;
  lastVerifiedAt: string;
  dealUrl: string;
  imageUrl?: string;
  submittedBy?: User;
  tags: string[];
}
