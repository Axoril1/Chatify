import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../store/useAuthStore";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(24, "Username too long"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignupPage() {
  const { signup } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setServerError("");
      await signup(data.username, data.email, data.password);
      navigate("/");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "420px",
      }}>

        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--accent)" }}>
            Chatify
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Create your account
          </p>
        </div>

        {serverError && (
          <div style={{
            background: "#D6433A20",
            border: "1px solid var(--error)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "var(--error)",
            fontSize: "0.875rem",
          }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: "500",
              color: "var(--text-secondary)",
              marginBottom: "0.5rem",
            }}>
              Username
            </label>
            <input
              {...register("username")}
              type="text"
              placeholder="yourname"
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                background: "var(--bg-elevated)",
                border: `1px solid ${errors.username ? "var(--error)" : "var(--border)"}`,
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
            {errors.username && (
              <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "0.375rem" }}>
                {errors.username.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: "500",
              color: "var(--text-secondary)",
              marginBottom: "0.5rem",
            }}>
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                background: "var(--bg-elevated)",
                border: `1px solid ${errors.email ? "var(--error)" : "var(--border)"}`,
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
            {errors.email && (
              <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "0.375rem" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: "500",
              color: "var(--text-secondary)",
              marginBottom: "0.5rem",
            }}>
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                background: "var(--bg-elevated)",
                border: `1px solid ${errors.password ? "var(--error)" : "var(--border)"}`,
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
            {errors.password && (
              <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "0.375rem" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: isLoading ? "var(--accent-muted)" : "var(--accent)",
              color: isLoading ? "var(--text-secondary)" : "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9375rem",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
            }}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>

        </form>

        <p style={{
          textAlign: "center",
          marginTop: "1.5rem",
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
        }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: "500" }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}