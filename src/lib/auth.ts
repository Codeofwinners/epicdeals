import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { ensureUserProfile } from "./firestore";

export type { FirebaseUser };

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!auth) {
    const errorMsg =
      "❌ Firebase not initialized. Check that environment variables are set correctly.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ Google signin successful:", result.user.email);
    await ensureUserProfile(result.user.uid, {
      displayName: result.user.displayName || undefined,
      email: result.user.email || undefined,
      photoURL: result.user.photoURL || undefined,
    });
    return result.user;
  } catch (error: any) {
    console.error("❌ Google signin failed:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user.uid, {
    displayName: result.user.displayName || undefined,
    email: result.user.email || undefined,
    photoURL: result.user.photoURL || undefined,
  });
  return result.user;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(cb: (user: FirebaseUser | null) => void) {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}
