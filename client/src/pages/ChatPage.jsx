import Sidebar from "../components/chat/Sidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";

export default function ChatPage() {
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "var(--bg-base)",
      overflow: "hidden",
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
}