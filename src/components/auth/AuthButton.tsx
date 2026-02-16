"use client";

import { useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { signInWithGoogle, signOut } from "@/lib/auth";

export function AuthButton() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-4 h-4 text-emerald-600" />
          )}
        </div>
        <button
          onClick={() => signOut()}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await signInWithGoogle();
        } catch {
          // User closed popup or error
        }
        setBusy(false);
      }}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <LogIn className="w-3.5 h-3.5" />
      Sign In
    </button>
  );
}
