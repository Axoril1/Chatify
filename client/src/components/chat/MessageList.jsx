import { useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function MessageList() {
  const { messages, activeChannel, isLoadingMessages, typingUsers, addMessage, updateMessage, removeMessage, setTyping, clearTyping } = useChatStore();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:new", addMessage);
    socket.on("message:updated", updateMessage);
    socket.on("message:deleted", ({ messageId }) => removeMessage(messageId));
    socket.on("typing:start", ({ userId, username }) => setTyping(userId, username));
    socket.on("typing:stop", ({ userId }) => clearTyping(userId));

    return () => {
      socket.off("message:new", addMessage);
      socket.off("message:updated", updateMessage);
      socket.off("message:deleted");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const typingList = Object.values(typingUsers);

  if (!activeChannel) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
      }}>
        Select a channel to start chatting
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
      }}>
        Loading messages...
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
      gap: "0.5rem",
    }}>
      <div style={{
        paddingBottom: "1rem",
        borderBottom: "1px solid var(--border)",
        marginBottom: "0.5rem",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>
          # {activeChannel.name}
        </h2>
      </div>

      {messages.length === 0 && (
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
        return (
          <div key={msg._id} style={{
            display: "flex",
            gap: "0.625rem",
            alignItems: "flex-start",
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: isOwn ? "var(--accent)" : "var(--bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: "600",
              color: isOwn ? "#fff" : "var(--text-secondary)",
              flexShrink: 0,
            }}>
              {msg.senderId.username?.[0]?.toUpperCase() || "?"}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: isOwn ? "var(--accent)" : "var(--text-primary)" }}>
                  {msg.senderId.username || "Unknown"}
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.editedAt && (
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>(edited)</span>
                )}
              </div>

              <p style={{
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                lineHeight: "1.5",
                wordBreak: "break-word",
              }}>
                {msg.deletedAt ? (
                  <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                    This message was deleted
                  </span>
                ) : msg.content}
              </p>
            </div>
          </div>
        );
      })}

      {typingList.length > 0 && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
          {typingList.join(", ")} {typingList.length === 1 ? "is" : "are"} typing...
        </p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}