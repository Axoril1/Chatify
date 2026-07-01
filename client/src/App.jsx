import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useSocketStore } from "./store/useSocketStore";
import { useChatStore } from "./store/useChatStore";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function App() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const { fetchChannels } = useChatStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      connect();
      fetchChannels();
    } else {
      disconnect();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        background: "var(--bg-base)"
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <div style={{color:"var(--text-primary)",padding:"2rem"}}>Chat coming soon... logged in as {user.username}</div> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;