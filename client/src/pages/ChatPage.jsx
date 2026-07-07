import { useState } from "react";
import Sidebar from "../components/chat/Sidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "var(--bg-base)",
      overflow: "hidden",
    }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
      }}>
        <MessageList onMenuClick={() => setSidebarOpen(true)} />
        <MessageInput />
      </div>
    </div>
  );
}