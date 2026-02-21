"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { updateUserHandle, checkHandleAvailability } from "@/lib/firestore";

interface HandleSetupModalProps {
  mode: "setup" | "edit";
  onClose?: () => void;
}

export function HandleSetupModal({ mode, onClose }: HandleSetupModalProps) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mode === "edit" && userProfile?.handle) {
      setHandle(userProfile.handle);
    }
  }, [mode, userProfile?.handle]);

  // Debounced availability check
  const checkAvailability = useCallback(
    async (value: string) => {
      const h = value.toLowerCase().trim();
      if (!/^[a-z0-9_]{3,20}$/.test(h)) {
        setAvailable(null);
        return;
      }
      setChecking(true);
      const isAvailable = await checkHandleAvailability(h, user?.uid);
      setAvailable(isAvailable);
      setChecking(false);
    },
    [user?.uid]
  );

  useEffect(() => {
    const h = handle.toLowerCase().trim();
    if (h.length < 3) {
      setAvailable(null);
      return;
    }
    if (!/^[a-z0-9_]*$/.test(h)) {
      setAvailable(null);
      return;
    }
    const timer = setTimeout(() => checkAvailability(h), 400);
    return () => clearTimeout(timer);
  }, [handle, checkAvailability]);

  const generateRandom = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    setHandle(`user_${suffix}`);
  };

  const handleSave = async () => {
    if (!user) return;
    const h = handle.toLowerCase().trim();

    if (h.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (h.length > 20) {
      setError("Username must be 20 characters or fewer");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(h)) {
      setError("Only lowercase letters, numbers, and underscores");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await updateUserHandle(user.uid, h);

    if (!result.success) {
      setError(result.error || "Failed to save username");
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSuccess(true);
    setSaving(false);

    // Auto-close after brief pause
    setTimeout(() => {
      onClose?.();
    }, 800);
  };

  const isValid = handle.length >= 3 && handle.length <= 20 && /^[a-z0-9_]+$/i.test(handle);
  const isSetup = mode === "setup";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (!isSetup && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 420,
          padding: "32px 28px 28px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          fontFamily: "Manrope, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>
              {isSetup ? "person_add" : "edit"}
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
            {isSetup ? "Choose your username" : "Edit username"}
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            {isSetup
              ? "Pick a username that will be shown publicly. Your real name stays private."
              : "Change your public username."}
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: `2px solid ${error ? "#fca5a5" : available === true ? "#86efac" : available === false ? "#fca5a5" : "#e2e8f0"}`,
              borderRadius: 12,
              padding: "0 14px",
              background: "#f8fafc",
              transition: "border-color 0.2s",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", marginRight: 2 }}>@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                if (v.length <= 20) {
                  setHandle(v);
                  setError(null);
                  setSuccess(false);
                }
              }}
              placeholder="your_username"
              autoFocus
              style={{
                flex: 1,
                padding: "14px 0",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15,
                fontWeight: 600,
                color: "#0f172a",
                fontFamily: "Manrope, sans-serif",
              }}
            />
            {checking && (
              <div style={{ width: 18, height: 18, border: "2px solid #e2e8f0", borderTopColor: "#0891b2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            )}
            {!checking && available === true && handle.length >= 3 && (
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#22c55e" }}>check_circle</span>
            )}
            {!checking && available === false && (
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ef4444" }}>cancel</span>
            )}
          </div>

          {/* Validation hints */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <div>
              {error && (
                <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, margin: 0 }}>{error}</p>
              )}
              {!error && available === false && (
                <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, margin: 0 }}>Username already taken</p>
              )}
              {!error && available === true && handle.length >= 3 && (
                <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, margin: 0 }}>Available!</p>
              )}
              {!error && available === null && handle.length > 0 && handle.length < 3 && (
                <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, margin: 0 }}>At least 3 characters</p>
              )}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{handle.length}/20</span>
          </div>
        </div>

        {/* Random suggestion button */}
        <button
          onClick={generateRandom}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#64748b",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 20,
            fontFamily: "Manrope, sans-serif",
            transition: "all 0.15s",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>casino</span>
          Random suggestion
        </button>

        {/* Rules */}
        <div style={{ marginBottom: 20, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
            Lowercase letters, numbers, underscores only. 3-20 characters.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {!isSetup && (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: "#f1f5f9",
                color: "#475569",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isValid || available === false || saving || checking}
            style={{
              flex: isSetup ? undefined : 1,
              width: isSetup ? "100%" : undefined,
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: success
                ? "#22c55e"
                : isValid && available !== false
                  ? "linear-gradient(135deg, #06b6d4, #0891b2)"
                  : "#e2e8f0",
              color: isValid && available !== false ? "#fff" : "#94a3b8",
              fontSize: 14,
              fontWeight: 700,
              cursor: isValid && available !== false && !saving ? "pointer" : "not-allowed",
              fontFamily: "Manrope, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {saving && (
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            )}
            {success ? "Saved!" : saving ? "Saving..." : isSetup ? "Set Username" : "Save"}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
