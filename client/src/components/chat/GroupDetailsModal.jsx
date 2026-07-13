import { useEffect, useState } from "react";
import { BsX, BsInfoCircle, BsPersonPlus, BsFileEarmark, BsEnvelope, BsPerson, BsCamera, BsPeopleFill } from "react-icons/bs";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore } from "../../store/useSocketStore";
import { useAuthStore } from "../../store/useAuthStore";
import axiosClient from "../../lib/axios";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function GroupDetailsModal({ channel, onClose }) {
  const [tab, setTab] = useState("members");
  const [media, setMedia] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [pendingInvites, setPendingInvites] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const { onlineUsers } = useSocketStore();
  const { user } = useAuthStore();
  const addMembers = useChatStore((s) => s.addMembers);
  const updateChannel = useChatStore((s) => s.updateChannel);
  const channels = useChatStore((s) => s.channels);

  // Use the live copy from the store so it reflects newly added members/avatar instantly
  const liveChannel = channels.find((c) => c._id === channel._id) || channel;
  const isCreator = liveChannel.createdBy?._id === user._id || liveChannel.createdBy === user._id;

  useEffect(() => {
    if (tab !== "media") return;
    setIsLoadingMedia(true);
    axiosClient
      .get(`/messages/${channel._id}/media`)
      .then((res) => setMedia(res.data.media))
      .catch((err) => console.error("Failed to fetch media:", err))
      .finally(() => setIsLoadingMedia(false));
  }, [tab, channel._id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const res = await axiosClient.patch(`/channels/${channel._id}/avatar`, { avatarUrl: uploadRes.data.url });
      updateChannel(res.data.channel);
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Failed to update group photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const addPendingInvite = () => {
    const trimmed = inviteInput.trim();
    if (!trimmed) return;
    const isEmail = EMAIL_REGEX.test(trimmed);
    const value = isEmail ? trimmed.toLowerCase() : trimmed;
    if (pendingInvites.some((i) => i.value === value)) {
      setInviteInput("");
      return;
    }
    setPendingInvites((prev) => [...prev, { value, isEmail }]);
    setInviteInput("");
    setError("");
  };

  const removePendingInvite = (value) => {
    setPendingInvites((prev) => prev.filter((i) => i.value !== value));
  };

  const handleAddMembers = async () => {
    if (pendingInvites.length === 0) return;
    setIsSaving(true);
    setError("");
    try {
      await addMembers(channel._id, pendingInvites.map((i) => i.value));
      setPendingInvites([]);
      setShowAddMember(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add members");
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
          maxWidth: "440px",
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
            <BsInfoCircle color="var(--accent)" />
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-primary)" }}>
              # {liveChannel.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", display: "flex" }}
          >
            <BsX size={20} />
          </button>
        </div>

        <div style={{ padding: "1.25rem 1rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border)" }}>
          <label style={{ position: "relative", cursor: "pointer" }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} disabled={isUploadingAvatar} />
            {liveChannel.avatarUrl ? (
              <img
                src={liveChannel.avatarUrl}
                alt={liveChannel.name}
                style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  objectFit: "cover", border: "2px solid var(--border)",
                  opacity: isUploadingAvatar ? 0.5 : 1,
                }}
              />
            ) : (
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "var(--accent-muted)", display: "flex", alignItems: "center",
                justifyContent: "center", opacity: isUploadingAvatar ? 0.5 : 1,
              }}>
                <BsPeopleFill size={24} color="var(--accent)" />
              </div>
            )}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: "22px", height: "22px", borderRadius: "50%",
              background: "var(--accent)", display: "flex",
              alignItems: "center", justifyContent: "center",
              border: "2px solid var(--bg-surface)",
            }}>
              <BsCamera size={10} color="#fff" />
            </div>
          </label>
          {isUploadingAvatar && (
            <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Uploading...</p>
          )}
          {avatarError && (
            <p style={{ fontSize: "0.6875rem", color: "var(--error)" }}>{avatarError}</p>
          )}
          <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
            Any member can change the group photo
          </p>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setTab("members")}
            style={{
              flex: 1,
              padding: "0.625rem",
              border: "none",
              background: "transparent",
              color: tab === "members" ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: tab === "members" ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: "0.8125rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Members ({liveChannel.members?.length || 0})
          </button>
          <button
            onClick={() => setTab("media")}
            style={{
              flex: 1,
              padding: "0.625rem",
              border: "none",
              background: "transparent",
              color: tab === "media" ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: tab === "media" ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: "0.8125rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Media & Files
          </button>
        </div>

        <div style={{ padding: "1rem", overflowY: "auto", flex: 1 }}>
          {tab === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {isCreator && (
                <div style={{ marginBottom: "0.5rem" }}>
                  {!showAddMember ? (
                    <button
                      onClick={() => setShowAddMember(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        background: "var(--accent-muted)",
                        color: "var(--accent)",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.8125rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      <BsPersonPlus size={14} /> Add member
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addPendingInvite();
                          }
                        }}
                        onBlur={addPendingInvite}
                        placeholder="email or username"
                        autoFocus
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
                      {pendingInvites.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                          {pendingInvites.map(({ value, isEmail }) => (
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
                                onClick={() => removePendingInvite(value)}
                                style={{ border: "none", background: "transparent", color: "var(--accent)", cursor: "pointer", display: "flex" }}
                              >
                                <BsX size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {error && <p style={{ fontSize: "0.75rem", color: "var(--error)" }}>{error}</p>}
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={handleAddMembers}
                          disabled={isSaving || pendingInvites.length === 0}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            background: pendingInvites.length ? "var(--accent)" : "var(--bg-elevated)",
                            color: pendingInvites.length ? "#fff" : "var(--text-secondary)",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.8125rem",
                            fontWeight: "600",
                            cursor: pendingInvites.length ? "pointer" : "not-allowed",
                          }}
                        >
                          {isSaving ? "Adding..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => { setShowAddMember(false); setPendingInvites([]); setError(""); }}
                          style={{
                            padding: "0.5rem 0.75rem",
                            background: "transparent",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {liveChannel.members?.map((member) => (
                <div
                  key={member._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.5rem",
                  }}
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.username}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: "32px",
                      height: "32px",
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
                      {member.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                      {member.username}
                      {(liveChannel.createdBy?._id === member._id || liveChannel.createdBy === member._id) && (
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", marginLeft: "0.375rem" }}>
                          (creator)
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
                      {onlineUsers.includes(member._id) ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              ))}

              {liveChannel.pendingInvites?.length > 0 && (
                <>
                  <p style={{ fontSize: "0.6875rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "0.5rem" }}>
                    Pending invites
                  </p>
                  {liveChannel.pendingInvites.map((email) => (
                    <div key={email} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "var(--bg-elevated)", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <BsEnvelope size={14} color="var(--text-secondary)" />
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{email}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "media" && (
            <div>
              {isLoadingMedia && (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Loading...</p>
              )}
              {!isLoadingMedia && media.length === 0 && (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  No media or files shared yet.
                </p>
              )}
              {!isLoadingMedia && media.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {media.map((m) => (
                    <a key={m._id} href={m.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      {m.attachment.resourceType === "image" ? (
                        <img
                          src={m.attachment.url}
                          alt={m.attachment.fileName}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          aspectRatio: "1",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--bg-elevated)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.25rem",
                          padding: "0.375rem",
                        }}>
                          <BsFileEarmark size={20} color="var(--text-secondary)" />
                          <p style={{
                            fontSize: "0.625rem",
                            color: "var(--text-secondary)",
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: "100%",
                          }}>
                            {m.attachment.fileName}
                          </p>
                          <p style={{ fontSize: "0.5625rem", color: "var(--text-secondary)" }}>
                            {formatBytes(m.attachment.fileSize)}
                          </p>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}