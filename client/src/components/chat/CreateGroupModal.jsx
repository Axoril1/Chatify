import { useState } from "react";
import { BsX, BsPeople, BsEnvelope, BsPerson } from "react-icons/bs";
import { useChatStore } from "../../store/useChatStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateGroupModal({ onClose }) {
  const [name, setName] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [invites, setInvites] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const createGroup = useChatStore((s) => s.createGroup);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);

  const addInvite = () => {
    const trimmed = inviteInput.trim();
    if (!trimmed) return;
    const isEmail = EMAIL_REGEX.test(trimmed);
    const value = isEmail ? trimmed.toLowerCase() : trimmed;

    if (!isEmail && value.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (invites.some((i) => i.value === value)) {
      setInviteInput("");
      return;
    }
    setInvites((prev) => [...prev, { value, isEmail }]);
    setInviteInput("");
    setError("");
  };

  const handleInviteKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addInvite();
    }
  };

  const removeInvite = (value) => {
    setInvites((prev) => prev.filter((i) => i.value !== value));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const channel = await createGroup(name.trim(), invites.map((i) => i.value));
      setActiveChannel(channel);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setIsSaving(false);
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
          maxWidth: "420px",
          width: "100%",
          maxHeight: "85vh",
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
            <BsPeople color="var(--accent)" />
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Create Group
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", display: "flex" }}
          >
            <BsX size={20} />
          </button>
        </div>

        <div style={{ padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Group name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
              Invite by email or username
            </label>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Email invites work even before they sign up. Usernames must already have an account.
            </p>
            <input
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              onKeyDown={handleInviteKeyDown}
              onBlur={addInvite}
              placeholder="friend@example.com or username (press Enter)"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />

            {invites.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.625rem" }}>
                {invites.map(({ value, isEmail }) => (
                  <span
                    key={value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.25rem 0.5rem",
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {isEmail ? <BsEnvelope size={10} /> : <BsPerson size={10} />}
                    {value}
                    <button
                      onClick={() => removeInvite(value)}
                      style={{ border: "none", background: "transparent", color: "var(--accent)", cursor: "pointer", display: "flex" }}
                    >
                      <BsX size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p style={{ fontSize: "0.8125rem", color: "var(--error)" }}>{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={isSaving || !name.trim()}
            style={{
              padding: "0.625rem",
              background: name.trim() ? "var(--accent)" : "var(--bg-elevated)",
              color: name.trim() ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            {isSaving ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}