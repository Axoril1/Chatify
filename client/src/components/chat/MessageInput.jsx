import { useState, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function MessageInput() {
  const [content, setContent] = useState("");
  const { activeChannel } = useChatStore();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const typingTimeout = useRef(null);

  const handleSend = () => {
    if (!content.trim() || !activeChannel || !socket) return;

    socket.emit("message:send", {
      channelId: activeChannel._id,
      content: content.trim(),
    });

    socket.emit("typing:stop", { channelId: activeChannel._id });
    clearTimeout(typingTimeout.current);
    setContent("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);

    if (!activeChannel || !socket) return;

    socket.emit("typing:start", {
      channelId: activeChannel._id,
      username: user.username,
    });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { channelId: activeChannel._id });
    }, 2000);
  };

  return (
    <div style={{
      padding: "0.75rem 1rem",
      borderTop: "1px solid var(--border)",
      background: "var(--bg-surface)",
      display: "flex",
      gap: "0.5rem",
      alignItems: "flex-end",
    }}>
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={activeChannel ? `Message #${activeChannel.name}` : "Select a channel first"}
        disabled={!activeChannel}
        rows={1}
        style={{
          flex: 1,
          padding: "0.625rem 0.875rem",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          color: "var(--text-primary)",
          fontSize: "0.875rem",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          lineHeight: "1.5",
        }}
      />
      <button
        onClick={handleSend}
        disabled={!content.trim() || !activeChannel}
        style={{
          padding: "0.625rem 1.25rem",
          background: content.trim() && activeChannel ? "var(--accent)" : "var(--bg-elevated)",
          color: content.trim() && activeChannel ? "#fff" : "var(--text-secondary)",
          border: "none",
          borderRadius: "8px",
          fontSize: "0.875rem",
          fontWeight: "600",
          cursor: content.trim() && activeChannel ? "pointer" : "not-allowed",
          transition: "background 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        Send
      </button>
    </div>
  );
}