# Firebase Setup Guide for Legit.Discount

## Overview
This guide covers the Firebase/Firestore configuration for Legit.Discount, including authentication, database structure, security rules, and all implemented operations.

## 1. Firebase Project Setup

### Initial Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "Legit Discounts"
3. Enable the following services:
   - **Authentication** (Google & Email/Password)
   - **Firestore Database** (Production mode)
   - **Cloud Storage** (for deal images)

### Environment Variables
Add these to your `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 2. Firestore Collections & Data Structure

### Collections to Create

#### 1. `deals/`
Store all discount deals
```json
{
  "id": "deal_123",
  "title": "Nike Air Max 90 - Red",
  "description": "Latest Nike sneakers with free shipping",
  "store": {
    "id": "store_123",
    "name": "Nike",
    "slug": "nike",
    "logoUrl": "https://..."
  },
  "category": {
    "id": "cat_123",
    "name": "Fashion",
    "slug": "fashion"
  },
  "originalPrice": 130,
  "discountedPrice": 89.99,
  "discountPercent": 31,
  "couponCode": "NIKE25",
  "dealUrl": "https://nike.com/...",
  "imageUrl": "https://...",
  "savingsType": "percentage",
  "discountType": "promo_code",
  "conditions": "Valid for members only",
  "tags": ["hot", "verified", "trending"],
  "status": "active",
  "verified": true,
  "submittedBy": "user_123",
  "upvotes": 245,
  "downvotes": 12,
  "netVotes": 233,
  "workedYes": 120,
  "workedNo": 8,
  "viewCount": 5420,
  "commentCount": 34,
  "usedLastHour": 23,
  "expiresAt": timestamp,
  "createdAt": timestamp,
  "lastVerifiedAt": timestamp,
  "isTrending": true,
  "isCommunityPick": false,
  "source": "user_submitted"
}
```

#### 2. `users/`
User profiles and metadata
```json
{
  "id": "user_123",
  "displayName": "John Doe",
  "email": "john@example.com",
  "photoURL": "https://...",
  "dealsSubmitted": 12,
  "totalUpvotes": 456,
  "reputation": 850,
  "badges": ["verified", "power_user"],
  "createdAt": timestamp,
  "role": "user"
}
```

#### 3. `comments/{commentId}`
Comments on deals
```json
{
  "id": "comment_123",
  "dealId": "deal_123",
  "userId": "user_123",
  "userName": "John Doe",
  "text": "Great deal! Confirmed working on 2024-01-15",
  "upvotes": 42,
  "createdAt": timestamp,
  "user": {
    "id": "user_123",
    "username": "John Doe",
    "avatar": "https://...",
    "badges": ["verified"]
  }
}
```

#### 4. `votes/{userId}/dealUpvotes/{dealId}`
User upvotes on deals
```json
{
  "votedAt": timestamp
}
```

#### 5. `votes/{userId}/dealDownvotes/{dealId}`
User downvotes on deals
```json
{
  "votedAt": timestamp
}
```

#### 6. `savedDeals/{userId}/deals/{dealId}`
Bookmarked deals by user
```json
{
  "dealId": "deal_123",
  "dealTitle": "Nike Air Max 90",
  "dealStore": "Nike",
  "dealSlug": "nike-air-max-90",
  "savedAt": timestamp,
  "expiresAt": timestamp
}
```

#### 7. `stores/`
Store information (admin-maintained)
```json
{
  "id": "store_123",
  "name": "Nike",
  "slug": "nike",
  "logoUrl": "https://...",
  "description": "Premium athletic wear",
  "website": "https://nike.com"
}
```

#### 8. `categories/`
Deal categories (admin-maintained)
```json
{
  "id": "cat_123",
  "name": "Fashion",
  "slug": "fashion",
  "emoji": "👗",
  "description": "Clothing, shoes, and accessories"
}
```

## 3. Security Rules

Apply the rules from `firestore.rules` to your Firestore instance:

1. Go to Firestore Database → Rules
2. Replace the default rules with the content from `firestore.rules`
3. Click "Publish"

**Key Rules Summary:**
- ✅ Deals: Public read, authenticated create, owner/admin edit
- ✅ Users: Public read, owner write (no role modification)
- ✅ Comments: Public read, authenticated create, owner/admin manage
- ✅ Votes: Owner only access
- ✅ Saved Deals: Owner only access
- ✅ Stores/Categories: Admin only write

## 4. Implemented Operations

### User Management

#### Sign Up / Sign In
```typescript
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth";

// Email signup
const user = await signUpWithEmail("user@example.com", "password");

// Google signin (auto-creates profile)
const user = await signInWithGoogle();
```

#### Get User Profile
```typescript
import { getUserProfile } from "@/lib/firestore";

const profile = await getUserProfile("user_123");
// Returns: displayName, email, dealsSubmitted, reputation, badges, etc.
```

### Deal Operations

#### Submit Deal
```typescript
import { submitDeal } from "@/lib/firestore";

const dealId = await submitDeal({
  title: "Nike Sale",
  description: "50% off select items",
  code: "NIKE50",
  store: storeObj,
  category: categoryObj,
  savingsType: "percentage",
  savingsAmount: "50%",
  savingsValue: 50,
  discountType: "promo_code",
  conditions: "Valid until 2024-02-15",
  dealUrl: "https://nike.com/sale",
  expiresAt: "2024-02-15T23:59:59Z",
  tags: ["hot", "verified"]
});
```

#### Track View
```typescript
import { trackDealView } from "@/lib/firestore";

// Call when deal page is opened
await trackDealView("deal_123");
```

### Voting System

#### Upvote/Downvote Deal
```typescript
import { upvoteDeal, downvoteDeal, getVoteStatus } from "@/lib/firestore";

// Check current vote status
const status = await getVoteStatus("user_123", "deal_123");
// Returns: { hasVoted: true, voteType: "upvote" | "downvote" | null }

// Toggle upvote (add if not exists, remove if exists)
const wasAdded = await upvoteDeal("user_123", "deal_123");

// Toggle downvote
const wasAdded = await downvoteDeal("user_123", "deal_123");
```

**Voting Logic:**
- Upvoting removes downvote if exists
- Downvoting removes upvote if exists
- Net vote is automatically updated
- Returns true if vote was added, false if removed

### Comment System

#### Add Comment
```typescript
import { addComment } from "@/lib/firestore";

const commentId = await addComment({
  dealId: "deal_123",
  content: "Great deal! Confirmed working today",
  user: {
    id: "user_123",
    username: "John Doe",
    avatar: "https://...",
    badges: ["verified"]
  }
});
```

#### Get Comments
```typescript
import { getDealComments, getBestComment } from "@/lib/firestore";

// Get all comments for a deal
const comments = await getDealComments("deal_123");

// Get the "best" comment (highest voted or most recent)
const bestComment = await getBestComment("deal_123");
```

#### Real-time Comments
```typescript
import { onDealComments } from "@/lib/firestore";

// Listen for comment updates in real-time
const unsubscribe = onDealComments("deal_123", (comments) => {
  console.log("Updated comments:", comments);
});

// Clean up when component unmounts
return () => unsubscribe();
```

### Save/Bookmark System

#### Save a Deal
```typescript
import { saveDeal, unsaveDeal, isSaved } from "@/lib/firestore";

// Save a deal
await saveDeal("user_123", dealObject);

// Check if saved
const saved = await isSaved("user_123", "deal_123");

// Unsave a deal
await unsaveDeal("user_123", "deal_123");

// Get all saved deals
const savedDeals = await getSavedDeals("user_123");
```

### Expiration Management

#### Check Expired Deals
```typescript
import { checkExpiredDeals, getTimeRemaining } from "@/lib/firestore";

// Check and update expired deals (run periodically)
const updatedCount = await checkExpiredDeals();

// Get time remaining for a deal
const hoursLeft = getTimeRemaining(deal.expiresAt);
// Returns: number of hours remaining (null if no expiry)
```

## 5. Integration Examples

### React Hook for Deal Voting
```typescript
import { useState, useEffect } from 'react';
import { upvoteDeal, getVoteStatus } from "@/lib/firestore";

export function useDealVote(userId: string, dealId: string) {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteType, setVoteType] = useState<"upvote" | "downvote" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkVote();
  }, [userId, dealId]);

  async function checkVote() {
    if (!userId) return;
    const status = await getVoteStatus(userId, dealId);
    setHasVoted(status.hasVoted);
    setVoteType(status.voteType);
  }

  async function handleUpvote() {
    if (!userId) return;
    setLoading(true);
    try {
      await upvoteDeal(userId, dealId);
      await checkVote();
    } finally {
      setLoading(false);
    }
  }

  return { hasVoted, voteType, handleUpvote, loading };
}
```

### React Hook for Saved Deals
```typescript
import { useState, useEffect } from 'react';
import { saveDeal, unsaveDeal, isSaved } from "@/lib/firestore";

export function useSaveDeal(userId: string, dealId: string, deal: Deal) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSaved();
  }, [userId, dealId]);

  async function checkSaved() {
    if (!userId) return;
    const isSavedResult = await isSaved(userId, dealId);
    setSaved(isSavedResult);
  }

  async function toggleSave() {
    if (!userId) return;
    setLoading(true);
    try {
      if (saved) {
        await unsaveDeal(userId, dealId);
        setSaved(false);
      } else {
        await saveDeal(userId, deal);
        setSaved(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return { saved, toggleSave, loading };
}
```

## 6. Performance Considerations

### Indexing
Firestore will prompt you to create composite indexes for queries that need them. Accept these automatically.

### Denormalization
To improve query performance, some data is denormalized:
- Deal info stored in `savedDeals` entries
- User info stored in comments
- Deal titles stored in votes

### Pagination
Use `getDocs()` with limits for large result sets:
```typescript
const q = query(dealsCol, orderBy("createdAt", "desc"), limit(20));
const snap = await getDocs(q);
```

## 7. Admin Operations

### Update User Role (admin only)
```typescript
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

await updateDoc(doc(db, "users", "user_123"), {
  role: "moderator"
});
```

### Bulk Update Expired Deals
```typescript
import { checkExpiredDeals } from "@/lib/firestore";

// Run periodically (e.g., every hour via Cloud Function)
const count = await checkExpiredDeals();
console.log(`Updated ${count} expired deals`);
```

## 8. Backup & Monitoring

### Enable Automatic Backups
1. Go to Firestore Database → Manage
2. Enable automatic daily backups
3. Set retention to 7+ days

### Monitor Quota Usage
- Go to Firestore → Usage tab
- Set up alerts for:
  - Document reads exceeding X/day
  - Document writes exceeding X/day
  - Storage exceeding X GB

## 9. Cost Estimation

For a typical deal site:
- **Reads**: ~100K/day = ~$3/month
- **Writes**: ~10K/day = ~$0.30/month
- **Storage**: ~1GB = ~$0.18/month
- **Total**: ~$3.50/month (within free tier for small projects)

## 10. Troubleshooting

### Authentication Issues
- Ensure Firebase is initialized before using auth functions
- Check browser console for specific error messages
- Verify CORS configuration for your domain

### Firestore Access Denied
- Check security rules match your use case
- Verify user is authenticated for write operations
- Check Firestore emulator is not running

### Query Performance
- Add composite indexes when prompted
- Use appropriate limits in queries
- Avoid querying large collections without filters

## Deploy to Firebase

### Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### View Deployments
```bash
firebase deployments:list
```

## Additional Resources
- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Pricing](https://firebase.google.com/pricing)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
