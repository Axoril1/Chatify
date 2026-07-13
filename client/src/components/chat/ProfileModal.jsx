import { useState } from "react";
import { BsX, BsPersonCircle, BsCamera } from "react-icons/bs";
import { useAuthStore } from "../../store/useAuthStore";
import axiosClient from "../../lib/axios";

export default function ProfileModal({ onClose }) {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [tab, setTab] = useState("profile");

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose an image file");
      return;
    }

    setIsUploadingAvatar(true);
    setProfileError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await updateProfile({ avatarUrl: uploadRes.data.url });
      setProfileSuccess("Profile picture updated");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileError("");
    setProfileSuccess("");
    setIsSavingProfile(true);
    try {
      const updates = {};
      if (username.trim() && username.trim() !== user.username) updates.username = username.trim();
      if (email.trim() && email.trim() !== user.email) updates.email = email.trim();

      if (Object.keys(updates).length === 0) {
        setProfileSuccess("Nothing to update");
        return;
      }

      await updateProfile(updates);
      setProfileSuccess("Profile updated successfully");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword) {
      setPasswordError("Please fill in both fields");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    setIsSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
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
            <BsPersonCircle color="var(--accent)" />
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Your Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", display: "flex" }}
          >
            <BsX size={20} />
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setTab("profile")}
            style={{
              flex: 1, padding: "0.625rem", border: "none", background: "transparent",
              color: tab === "profile" ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: tab === "profile" ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer",
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setTab("password")}
            style={{
              flex: 1, padding: "0.625rem", border: "none", background: "transparent",
              color: tab === "password" ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: tab === "password" ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer",
            }}
          >
            Password
          </button>
        </div>

        <div style={{ padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {tab === "profile" && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}>
                <label style={{ position: "relative", cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} disabled={isUploadingAvatar} />
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      style={{
                        width: "72px", height: "72px", borderRadius: "50%",
                        objectFit: "cover", border: "2px solid var(--border)",
                        opacity: isUploadingAvatar ? 0.5 : 1,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "72px", height: "72px", borderRadius: "50%",
                      background: "var(--accent)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "1.5rem", fontWeight: "600",
                      color: "#fff", opacity: isUploadingAvatar ? 0.5 : 1,
                    }}>
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: "var(--accent)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    border: "2px solid var(--bg-surface)",
                  }}>
                    <BsCamera size={11} color="#fff" />
                  </div>
                </label>
              </div>
              {isUploadingAvatar && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>
                  Uploading...
                </p>
              )}

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-elevated)",
                    border: "1px solid var(--border)", borderRadius: "6px",
                    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-elevated)",
                    border: "1px solid var(--border)", borderRadius: "6px",
                    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none",
                  }}
                />
              </div>

              {profileError && <p style={{ fontSize: "0.8125rem", color: "var(--error)" }}>{profileError}</p>}
              {profileSuccess && <p style={{ fontSize: "0.8125rem", color: "var(--success)" }}>{profileSuccess}</p>}

              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                style={{
                  padding: "0.625rem", background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: "8px", fontSize: "0.875rem",
                  fontWeight: "600", cursor: "pointer",
                }}
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

          {tab === "password" && (
            <>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-elevated)",
                    border: "1px solid var(--border)", borderRadius: "6px",
                    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-elevated)",
                    border: "1px solid var(--border)", borderRadius: "6px",
                    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-elevated)",
                    border: "1px solid var(--border)", borderRadius: "6px",
                    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none",
                  }}
                />
              </div>

              {passwordError && <p style={{ fontSize: "0.8125rem", color: "var(--error)" }}>{passwordError}</p>}
              {passwordSuccess && <p style={{ fontSize: "0.8125rem", color: "var(--success)" }}>{passwordSuccess}</p>}

              <button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
                style={{
                  padding: "0.625rem", background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: "8px", fontSize: "0.875rem",
                  fontWeight: "600", cursor: "pointer",
                }}
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}