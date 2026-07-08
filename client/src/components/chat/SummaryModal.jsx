import { useEffect, useState } from "react";
import { BsX, BsStars } from "react-icons/bs";
import axiosClient from "../../lib/axios";

export default function SummaryModal({ channelId, onClose }) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosClient.post(`/summarize/${channelId}`, { limit: 50 });
        setSummary(res.data.summary);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to generate summary");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [channelId]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          maxWidth: "480px",
          width: "100%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{
          padding: "1rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BsStars color="var(--accent)" />
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Channel Summary
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <BsX size={20} />
          </button>
        </div>

        <div style={{ padding: "1.25rem", overflowY: "auto" }}>
          {isLoading && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Reading recent messages and summarizing...
            </p>
          )}
          {error && (
            <p style={{ color: "var(--error)", fontSize: "0.875rem" }}>{error}</p>
          )}
          {!isLoading && !error && (
            <p style={{
              fontSize: "0.875rem",
              color: "var(--text-primary)",
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
            }}>
              {summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}