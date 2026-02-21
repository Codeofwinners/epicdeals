"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";

export default function FixWisprPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("1 Month Free of Wispr Flow Pro");
  const [description, setDescription] = useState(
    "Get a full free month of Wispr Flow Pro \u2014 the AI-powered voice dictation tool that lets you write 3x faster by speaking naturally across any app on your Mac. Flow Pro normally costs $10/mo and includes unlimited dictation, custom vocabulary, 100+ language support, and seamless integration with every text field. Use this link to activate your free month instantly."
  );

  const handleSave = async () => {
    if (!user || !db) {
      setStatus("Please sign in first");
      return;
    }
    try {
      setStatus("Saving...");
      const dealRef = doc(db, "deals", "XxmkTCWiIZjaZU41tfk6");
      await updateDoc(dealRef, { title, description });
      setStatus("Saved!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: 600, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 24, color: "#0A0A0A" }}>
        Edit Wispr Deal
      </h1>

      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 6 }}>
        Title
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px", fontSize: 15, fontWeight: 700,
          border: "1px solid #ddd", borderRadius: 10, marginBottom: 20,
          outline: "none", boxSizing: "border-box",
        }}
      />

      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 6 }}>
        Description
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
        style={{
          width: "100%", padding: "12px 14px", fontSize: 14, lineHeight: 1.6,
          border: "1px solid #ddd", borderRadius: 10, marginBottom: 24,
          outline: "none", resize: "vertical", boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleSave}
        style={{
          padding: "14px 32px", backgroundColor: "#1A3A2A", color: "#fff",
          border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800,
          cursor: "pointer", width: "100%",
        }}
      >
        Save Changes
      </button>

      {status && (
        <p style={{
          marginTop: 14, fontWeight: 700, fontSize: 14, textAlign: "center",
          color: status.startsWith("Error") ? "#dc2626" : "#059669",
        }}>
          {status}
        </p>
      )}
    </div>
  );
}
