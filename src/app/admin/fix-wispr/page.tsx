"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";

export default function FixWisprPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("Ready");

  const handleFix = async () => {
    if (!user || !db) {
      setStatus("Not authenticated");
      return;
    }

    try {
      setStatus("Updating...");
      const dealRef = doc(db, "deals", "XxmkTCWiIZjaZU41tfk6");
      await updateDoc(dealRef, {
        title: "1 Month Free of Wispr Flow Pro",
        description:
          "Anyone who signs up through this link gets a full free month of Wispr Flow Pro — the AI dictation tool that lets you write 3x faster with your voice across any app. Flow Pro normally costs $10/mo and includes unlimited dictation, custom vocabulary, and multi-language support.",
      });
      setStatus("Done! Wispr deal updated. You can close this page.");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 500, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Fix Wispr Deal</h1>
      <p style={{ marginBottom: 16, color: "#666", fontSize: 14 }}>
        Updates title to &quot;1 Month Free of Wispr Flow Pro&quot; and rewrites description.
      </p>
      <button
        onClick={handleFix}
        style={{
          padding: "12px 24px",
          backgroundColor: "#0A0A0A",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Update Deal
      </button>
      <p style={{ marginTop: 16, fontWeight: 600, color: status.startsWith("Error") ? "red" : "#059669" }}>
        {status}
      </p>
    </div>
  );
}
