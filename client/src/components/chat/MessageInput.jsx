import { useState, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";
import axiosClient from "../../lib/axios";
import { BsPaperclip, BsX, BsFileEarmark } from "react-icons/bs";

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

export default function MessageInput() {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { activeChannel } = useChatStore();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; 
    if (!file || !activeChannel) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachment(res.data);
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Upload failed. File may be too large (15MB max).");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = () => {
    if ((!content.trim() && !attachment) || !activeChannel || !socket) return;

    socket.emit("message:send", {
      channelId: activeChannel._id,
      content: content.trim(),
      attachment: attachment || undefined,
    });

    socket.emit("typing:stop", { channelId: activeChannel._id });
    clearTimeout(typingTimeout.current);
    setContent("");
    setAttachment(null);
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

  const canSend = (content.trim() || attachment) && activeChannel && !isUploading;

  return (
    <div style={{
      borderTop: "1px solid var(--border)",
      background: "var(--bg-surface)",
    }}>
      {(attachment || isUploading) && (
        <div style={{
          padding: "0.625rem 1rem 0",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.625rem",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "0.8125rem",
            color: "var(--text-primary)",
          }}>
            {isUploading ? (
              <span style={{ color: "var(--text-secondary)" }}>Uploading...</span>
            ) : (
              <>
                {attachment.resourceType === "image" ? (
                  <img src={attachment.url} alt={attachment.fileName} style={{ width: "28px", height: "28px", objectFit: "cover", borderRadius: "4px" }} />
                ) : (
                  <BsFileEarmark size={16} color="var(--text-secondary)" />
                )}
                <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attachment.fileName}
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  {formatBytes(attachment.fileSize)}
                </span>
                <button
                  onClick={() => setAttachment(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <BsX size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{
        padding: "0.75rem 1rem",
        display: "flex",
        gap: "0.5rem",
        alignItems: "flex-end",
      }}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!activeChannel || isUploading}
          title="Attach file"
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: activeChannel ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BsPaperclip size={16} />
        </button>

        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={activeChannel ? `Message #${activeChannel.name} (try @ai your question)` : "Select a channel first"}
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
          disabled={!canSend}
          style={{
            padding: "0.625rem 1.25rem",
            background: canSend ? "var(--accent)" : "var(--bg-elevated)",
            color: canSend ? "#fff" : "var(--text-secondary)",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: canSend ? "pointer" : "not-allowed",
            transition: "background 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}