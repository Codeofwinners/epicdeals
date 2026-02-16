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
  if (!auth) throw new Error("Firebase not initialized");
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user.uid, {
    displayName: result.user.displayName || undefined,
    email: result.user.email || undefined,
    photoURL: result.user.photoURL || undefined,
  });
  return result.user;
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
