import { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function Sidebar() {
  const { channels, activeChannel, setActiveChannel } = useChatStore();
  const { socket } = useSocketStore();
  const { user, logout } = useAuthStore();

  const handleChannelClick = (channel) => {
    if (activeChannel) socket?.emit("room:leave", activeChannel._id);
    socket?.emit("room:join", channel._id);
    setActiveChannel(channel);
  };

  return (
    <div style={{
      width: "240px",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{
        padding: "1rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: "700", color: "var(--accent)" }}>
          Chatify
        </h1>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          {user?.username}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0.5rem" }}>
        <p style={{
          fontSize: "0.6875rem",
          fontWeight: "600",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "0 0.5rem",
          marginBottom: "0.375rem",
        }}>
          Channels
        </p>

        {channels.length === 0 && (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", padding: "0.5rem" }}>
            No channels yet
          </p>
        )}

        {channels.map((channel) => (
          <button
            key={channel._id}
            onClick={() => handleChannelClick(channel)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "none",
              background: activeChannel?._id === channel._id ? "var(--accent-muted)" : "transparent",
              color: activeChannel?._id === channel._id ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: activeChannel?._id === channel._id ? "500" : "400",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s ease",
            }}
          >
            # {channel.name}
          </button>
        ))}
      </div>

      <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}