/**
 * Backfill script — adds slug field to any deals missing it.
 * Run: npx tsx scripts/backfill-slugs.ts
 *
 * Requires NEXT_PUBLIC_FIREBASE_* env vars in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[$%]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function generateDealSlug(title: string, storeSlug: string): string {
  return `${slugify(title)}-${storeSlug}`;
}

async function backfill() {
  console.log("Backfilling deal slugs...\n");

  const snap = await getDocs(collection(db, "deals"));
  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (data.slug) continue;

    const store = data.store as { slug: string };
    const slug = generateDealSlug(data.title as string, store.slug);

    await updateDoc(doc(db, "deals", d.id), { slug });
    console.log(`  + ${d.id} -> ${slug}`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} deals (${snap.size - updated} already had slugs).`);
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
