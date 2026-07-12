import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BsPencil, BsTrash2, BsEmojiSmile, BsList, BsFileEarmark, BsDownload, BsStars, BsClipboardData, BsRobot } from "react-icons/bs";
import axiosClient from "../../lib/axios";
import SummaryModal from "./SummaryModal";
import AutomationModal from "./AutomationModal";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function Attachment({ attachment }) {
  if (!attachment?.url) return null;

  if (attachment.resourceType === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
        <img
          src={attachment.url}
          alt={attachment.fileName}
          style={{
            maxWidth: "280px",
            maxHeight: "280px",
            borderRadius: "8px",
            marginTop: "0.375rem",
            display: "block",
            border: "1px solid var(--border)",
          }}
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.625rem 0.75rem",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        marginTop: "0.375rem",
        maxWidth: "280px",
        textDecoration: "none",
        color: "var(--text-primary)",
      }}
    >
      <BsFileEarmark size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {attachment.fileName}
        </p>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
          {formatBytes(attachment.fileSize)}
        </p>
      </div>
      <BsDownload size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
    </a>
  );
}

function MessageSkeleton() {
  const rows = [
    { avatar: true, w1: "35%", w2: "60%" },
    { avatar: true, w1: "25%", w2: "40%" },
    { avatar: true, w1: "45%", w2: "75%" },
    { avatar: true, w1: "30%", w2: "50%" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem" }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
          <div className="skeleton" style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <div className="skeleton" style={{ width: row.w1, height: "10px" }} />
            <div className="skeleton" style={{ width: row.w2, height: "12px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AIStreamBubble({ text }) {
  return (
    <div style={{
      display: "flex",
      gap: "0.625rem",
      alignItems: "flex-start",
      padding: "0.25rem 0.5rem",
    }}>
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "var(--accent-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "0.125rem",
      }}>
        <BsStars size={14} color="var(--accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--accent)" }}>
            AI Assistant
          </span>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
            typing...
          </span>
        </div>
        <p style={{
          fontSize: "0.875rem",
          color: "var(--text-primary)",
          lineHeight: "1.5",
          wordBreak: "break-word",
        }}>
          {text}
          <span style={{
            display: "inline-block",
            width: "6px",
            height: "14px",
            background: "var(--accent)",
            marginLeft: "2px",
            verticalAlign: "middle",
            animation: "skeleton-pulse 0.8s ease-in-out infinite",
          }} />
        </p>
      </div>
    </div>
  );
}

export default function MessageList({ onMenuClick }) {
  const {
    messages, activeChannel, isLoadingMessages,
    typingUsers, aiStreams,
  } = useChatStore();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const bottomRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showReactions, setShowReactions] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.off("message:new");
    socket.off("message:updated");
    socket.off("message:deleted");
    socket.off("typing:start");
    socket.off("typing:stop");
    socket.off("ai:start");
    socket.off("ai:chunk");
    socket.off("ai:done");
    socket.off("ai:error");

    socket.on("message:new", (msg) => {
      useChatStore.getState().addMessage(msg);
    });
    socket.on("message:updated", (msg) => {
      useChatStore.getState().updateMessage(msg);
    });
    socket.on("message:deleted", ({ messageId }) => {
      useChatStore.getState().removeMessage(messageId);
    });
    socket.on("typing:start", ({ userId, username }) => {
      useChatStore.getState().setTyping(userId, username);
    });
    socket.on("typing:stop", ({ userId }) => {
      useChatStore.getState().clearTyping(userId);
    });
    socket.on("ai:start", ({ streamId }) => {
      useChatStore.getState().startAIStream(streamId);
    });
    socket.on("ai:chunk", ({ streamId, delta }) => {
      useChatStore.getState().appendAIChunk(streamId, delta);
    });
    socket.on("ai:done", ({ streamId, message }) => {
      useChatStore.getState().finishAIStream(streamId, message);
    });
    socket.on("ai:error", ({ streamId }) => {
      useChatStore.getState().errorAIStream(streamId);
    });

    return () => {
      socket.off("message:new");
      socket.off("message:updated");
      socket.off("message:deleted");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("ai:start");
      socket.off("ai:chunk");
      socket.off("ai:done");
      socket.off("ai:error");
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiStreams]);

  const handleEdit = async (msg) => {
    if (!editContent.trim()) return;
    try {
      await axiosClient.patch(`/messages/${msg._id}`, { content: editContent });
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await axiosClient.delete(`/messages/${msgId}`);
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
    }
  };

  const handleReact = async (msgId, emoji) => {
    try {
      await axiosClient.post(`/messages/${msgId}/react`, { emoji });
      setShowReactions(null);
    } catch (err) {
      console.error("React failed:", err);
    }
  };

  const typingList = Object.values(typingUsers);
  const aiStreamEntries = Object.entries(aiStreams);

  const MenuButton = () => (
    <button
      onClick={onMenuClick}
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
        marginRight: "0.625rem",
        flexShrink: 0,
      }}
    >
      <BsList size={16} />
    </button>
  );

  if (!activeChannel) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        fontSize: "0.875rem",
        gap: "0.75rem",
      }}>
        <MenuButton />
        Select a channel to start chatting
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    }}>
      {/* Channel header */}
      <div style={{
        paddingBottom: "1rem",
        borderBottom: "1px solid var(--border)",
        marginBottom: "0.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <MenuButton />
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>
              # {activeChannel.name}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Welcome to #{activeChannel.name} — type @ai or /ai to ask the assistant
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
          <button
            onClick={() => setShowSummary(true)}
            title="Summarize channel"
            style={{
              width: "32px", height: "32px", borderRadius: "6px",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-secondary)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <BsClipboardData size={15} />
          </button>
          <button
            onClick={() => setShowAutomations(true)}
            title="Manage automations"
            style={{
              width: "32px", height: "32px", borderRadius: "6px",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-secondary)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <BsRobot size={15} />
          </button>
        </div>
      </div>

      {showSummary && (
        <SummaryModal channelId={activeChannel._id} onClose={() => setShowSummary(false)} />
      )}
      {showAutomations && (
        <AutomationModal channelId={activeChannel._id} onClose={() => setShowAutomations(false)} />
      )}

      {isLoadingMessages ? (
        <MessageSkeleton />
      ) : (
        <>
          {messages.length === 0 && aiStreamEntries.length === 0 && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
            }}>
              No messages yet. Say hello!
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = msg.senderId._id === user._id || msg.senderId === user._id;
            const isAI = msg.type === "ai";
            const isHovered = hoveredId === msg._id;
            const isEditing = editingId === msg._id;
            const isDeleted = !!msg.deletedAt;

            const reactionGroups = msg.reactions?.reduce((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
              return acc;
            }, {});

            return (
              <div
                key={msg._id}
                onMouseEnter={() => setHoveredId(msg._id)}
                onMouseLeave={() => { setHoveredId(null); setShowReactions(null); }}
                style={{
                  display: "flex",
                  gap: "0.625rem",
                  alignItems: "flex-start",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "8px",
                  background: isHovered ? "var(--bg-elevated)" : "transparent",
                  position: "relative",
                  transition: "background 0.1s ease",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: isAI ? "var(--accent-muted)" : isOwn ? "var(--accent)" : "var(--bg-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: isOwn ? "#fff" : "var(--text-secondary)",
                  flexShrink: 0,
                  marginTop: "0.125rem",
                }}>
                  {isAI ? <BsStars size={14} color="var(--accent)" /> : (msg.senderId.username?.[0]?.toUpperCase() || "?")}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Sender + time */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      color: isAI ? "var(--accent)" : isOwn ? "var(--accent)" : "var(--text-primary)",
                    }}>
                      {msg.senderId.username || "Unknown"}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.editedAt && (
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        (edited)
                      </span>
                    )}
                  </div>

                  {/* Content or edit input */}
                  {isEditing ? (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center"}}>
                      <input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEdit(msg);
                          if (e.key === "Escape") { setEditingId(null); setEditContent(""); }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: "0.375rem 0.625rem",
                          background: "var(--bg-base)",
                          border: "1px solid var(--accent)",
                          borderRadius: "6px",
                          color: "var(--text-primary)",
                          fontSize: "0.875rem",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => handleEdit(msg)}
                        style={{
                          padding: "0.375rem 0.75rem",
                          background: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditContent(""); }}
                        style={{
                          padding: "0.375rem 0.75rem",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={{
                        fontSize: "0.875rem",
                        color: isDeleted ? "var(--text-secondary)" : "var(--text-primary)",
                        fontStyle: isDeleted ? "italic" : "normal",
                        lineHeight: "1.5",
                        wordBreak: "break-word",
                      }}>
                        {isDeleted ? "This message was deleted" : msg.content}
                      </p>
                      {!isDeleted && <Attachment attachment={msg.attachment} />}
                    </>
                  )}

                  {/* Reactions display */}
                  {reactionGroups && Object.keys(reactionGroups).length > 0 && (
                    <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
                      {Object.entries(reactionGroups).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg._id, emoji)}
                          style={{
                            padding: "0.125rem 0.5rem",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            color: "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          {emoji} <span style={{ color: "var(--text-secondary)" }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover action buttons */}
                {isHovered && !isDeleted && !isAI && (
                  <div style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "0.25rem",
                    display: "flex",
                    gap: "0.25rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "0.25rem",
                    zIndex: 5,
                  }}>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setShowReactions(showReactions === msg._id ? null : msg._id)}
                        title="React"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          border: "none",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BsEmojiSmile size={14} />
                      </button>

                      {showReactions === msg._id && (
                        <div style={{
                          position: "absolute",
                          right: 0,
                          top: "110%",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "0.375rem",
                          display: "flex",
                          gap: "0.25rem",
                          zIndex: 10,
                        }}>
                          {QUICK_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg._id, emoji)}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isOwn && (
                      <button
                        onClick={() => { setEditingId(msg._id); setEditContent(msg.content); }}
                        title="Edit"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          border: "none",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BsPencil size={13} />
                      </button>
                    )}

                    {isOwn && (
                      <button
                        onClick={() => handleDelete(msg._id)}
                        title="Delete"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          border: "none",
                          background: "transparent",
                          color: "var(--error)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BsTrash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {aiStreamEntries.map(([streamId, text]) => (
            <AIStreamBubble key={streamId} text={text} />
          ))}

          {typingList.length > 0 && (
            <p style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              fontStyle: "italic",
              padding: "0.25rem 0.5rem",
            }}>
              {typingList.join(", ")} {typingList.length === 1 ? "is" : "are"} typing...
            </p>
          )}

          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}