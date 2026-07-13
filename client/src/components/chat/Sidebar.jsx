import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";
import ThemeToggle from "./ThemeToggle";
import CreateGroupModal from "./CreateGroupModal";
import { BsX, BsPlusLg } from "react-icons/bs";

function PresenceDot({ isOnline }) {
  return (
    <span style={{
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: isOnline ? "var(--success)" : "var(--border)",
      display: "inline-block",
      flexShrink: 0,
    }} />
  );
}

function ChannelSkeleton() {
  const widths = ["70%", "55%", "80%", "60%", "45%"];
  return (
    <>
      {widths.map((w, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
          }}
        >
          <div className="skeleton" style={{ width: "10px", height: "10px", borderRadius: "3px" }} />
          <div className="skeleton" style={{ width: w, height: "10px" }} />
        </div>
      ))}
    </>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { channels, activeChannel, setActiveChannel, isLoadingChannels } = useChatStore();
  const { socket, onlineUsers } = useSocketStore();
  const { user, logout } = useAuthStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleChannelClick = (channel) => {
    if (activeChannel) socket?.emit("room:leave", activeChannel._id);
    socket?.emit("room:join", channel._id);
    setActiveChannel(channel);
    onClose?.();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}

      <div
        className={`sidebar${isOpen ? " open" : ""}`}
        style={{
          width: "240px",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ThemeToggle />
            <button
              onClick={onClose}
              className="mobile-menu-btn"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BsX size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0.5rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 0.5rem",
            marginBottom: "0.375rem",
          }}>
            <p style={{
              fontSize: "0.6875rem",
              fontWeight: "600",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Groups
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              title="Create group"
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "5px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--accent)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BsPlusLg size={11} />
            </button>
          </div>

          {isLoadingChannels ? (
            <ChannelSkeleton />
          ) : (
            <>
              {channels.length === 0 && (
                <div style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                    You're not in any groups yet.
                  </p>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    style={{
                      padding: "0.5rem 0.875rem",
                      background: "var(--accent)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Create your first group
                  </button>
                </div>
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
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>#</span>
                  <span style={{ flex: 1 }}>{channel.name}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div style={{
          padding: "0.75rem",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.5rem",
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#fff",
              flexShrink: 0,
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: "500", color: "var(--text-primary)" }}>
                {user?.username}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <PresenceDot isOnline={onlineUsers.includes(user?._id)} />
                <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)"}}>
                  {onlineUsers.includes(user?._id) ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

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
              transition: "background 0.15s ease, color 0.15s ease",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}