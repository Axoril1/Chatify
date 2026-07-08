import { useEffect, useState } from "react";
import { BsX, BsRobot, BsTrash2 } from "react-icons/bs";
import axiosClient from "../../lib/axios";

export default function AutomationModal({ channelId, onClose }) {
  const [rules, setRules] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await axiosClient.get(`/automations/${channelId}`);
      setRules(res.data.rules);
    } catch (err) {
      console.error("Failed to fetch automations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [channelId]);

  const handleAdd = async () => {
    if (!keyword.trim() || !response.trim()) return;
    setIsSaving(true);
    try {
      await axiosClient.post("/automations", { channelId, keyword, response });
      setKeyword("");
      setResponse("");
      fetchRules();
    } catch (err) {
      console.error("Failed to add automation:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/automations/${id}`);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Failed to delete automation:", err);
    }
  };

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
            <BsRobot color="var(--accent)" />
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Automations
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

        <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            When a message contains the keyword, the bot auto-replies in this channel.
          </p>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword (e.g. 'deploy')"
            style={{
              padding: "0.5rem 0.75rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              outline: "none",
            }}
          />
          <input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Auto-reply message"
            style={{
              padding: "0.5rem 0.75rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              fontSize: "0.8125rem",
              outline: "none",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!keyword.trim() || !response.trim() || isSaving}
            style={{
              padding: "0.5rem",
              background: keyword.trim() && response.trim() ? "var(--accent)" : "var(--bg-elevated)",
              color: keyword.trim() && response.trim() ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              cursor: keyword.trim() && response.trim() ? "pointer" : "not-allowed",
            }}
          >
            {isSaving ? "Adding..." : "Add Rule"}
          </button>
        </div>

        <div style={{ padding: "0.75rem 1rem", overflowY: "auto", flex: 1 }}>
          {isLoading && (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Loading...</p>
          )}
          {!isLoading && rules.length === 0 && (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              No automations yet in this channel.
            </p>
          )}
          {rules.map((rule) => (
            <div
              key={rule._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                  <strong>{rule.keyword}</strong> → {rule.response}
                </p>
              </div>
              <button
                onClick={() => handleDelete(rule._id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--error)",
                  cursor: "pointer",
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <BsTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}