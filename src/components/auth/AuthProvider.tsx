"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthChange, type FirebaseUser } from "@/lib/auth";
import { ensureUserProfile, getUserProfile, type UserProfile } from "@/lib/firestore";
import { HandleSetupModal } from "./HandleSetupModal";

interface AuthCtx {
  user: FirebaseUser | null;
  loading: boolean;
  userProfile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  userProfile: null,
  profileLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchProfile(user.uid);
    }
  }, [user?.uid, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        // Ensure profile exists (creates one with random handle if new)
        await ensureUserProfile(u.uid, {
          displayName: u.displayName || undefined,
          email: u.email || undefined,
          photoURL: u.photoURL || undefined,
        });
        await fetchProfile(u.uid);
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
    });
    return unsubscribe;
  }, [fetchProfile]);

  const showHandleSetup = !loading && !profileLoading && user && userProfile?.needsHandleSetup;

  return (
    <AuthContext.Provider value={{ user, loading, userProfile, profileLoading, refreshProfile }}>
      {children}
      {showHandleSetup && (
        <HandleSetupModal
          mode="setup"
          onClose={refreshProfile}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
