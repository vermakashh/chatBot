import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { RiSoundModuleLine } from "react-icons/ri";
import VoiceUploadModal from "./VoiceUploadModal";

export default function ChatWindow() {
  const { user, selectedUser, socket } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const messagesEndRef = useRef(null);

  const handleReceiveMessage = (msg) => {
    if (
      (msg.senderId === user.id && msg.receiverId === selectedUser._id) ||
      (msg.receiverId === user.id && msg.senderId === selectedUser._id)
    ) {
      setMessages((prev) => [...prev, msg]);
    }
  };

  const handleTyping = ({ from }) => {
    if (from === selectedUser._id) {
      setTypingUser(from);
      setTimeout(() => setTypingUser(null), 2000);
    }
  };

  const handlePlayVoice = async (messageText) => {
    const userId = user.username || user.email || user.id;
    if (!messageText || !userId) {
      console.error("Missing text or username. Skipping request.");
      return;
    }

    try {
      const res = await fetch("https://ac8a-192-140-153-103.ngrok-free.app/api/tts-clone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: messageText,
          user_id: user.username,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("TTS API Error:", errorText);
        alert("Voice playback failed. Server said: " + errorText);
        return;
      }      

      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (!selectedUser) return;

    axios
      .get(`https://chatbot-01ki.onrender.com/api/messages/${user.id}/${selectedUser._id}`)
      .then((res) => setMessages(res.data));

    socket.on("receive-message", handleReceiveMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("typing", handleTyping);
    };
  }, [selectedUser, user.id]);

  const handleSend = () => {
    if (message.trim() === "") return;

    const newMessage = {
      senderId: user.id,
      receiverId: selectedUser._id,
      message,
      timestamp: new Date(),
    };

    socket.emit("send-message", newMessage);
    setMessage("");
  };

  const handleTypingInput = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", {
      from: user.id,
      to: selectedUser._id,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a user to start chatting
      </div>
    );
  }

  return (
    <div className="w-3/4 h-screen flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b font-semibold text-lg bg-white flex justify-between items-center">
        <span>{selectedUser.username || selectedUser.email}</span>
        <button
          className="text-blue-600 hover:text-blue-800 transition"
          onClick={() => setShowVoiceModal(true)}
        >
          <RiSoundModuleLine className="w-6 h-6" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-xs p-3 rounded-lg shadow-sm ${
              msg.senderId === user.id ? "bg-blue-100 ml-auto" : "bg-white mr-auto"
            }`}
          >
            <p>{msg.message}</p>
            <span className="text-xs text-gray-400 block mt-1 text-right">
              {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
              })}
            </span>

            <button
              onClick={() => handlePlayVoice(msg.message)}
              className="mt-1 text-blue-600 hover:text-blue-800 text-sm"
              title="Play Voice"
            >
              🔊
            </button>
          </div>
        ))}
        {typingUser && (
          <div className="italic text-sm text-gray-500">typing...</div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Box */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center bg-blue-50 rounded-full px-4 py-2 w-full">
          <input
            type="text"
            value={message}
            onChange={handleTypingInput}
            placeholder="Type your message...."
            className="flex-1 bg-transparent outline-none placeholder-gray-500 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="ml-2 p-2 rounded-full hover:bg-blue-100 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-blue-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.4 20.3l17.2-8.6c.6-.3.6-1.1 0-1.4L3.4 1.7c-.7-.3-1.4.3-1.2 1.1l2.1 7.6c.1.3.3.5.6.6l8.2 1.9-8.2 1.9c-.3.1-.5.3-.6.6l-2.1 7.6c-.2.8.5 1.4 1.2 1.1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Voice Cloning Modal */}
      {showVoiceModal && (
        <VoiceUploadModal
          onClose={() => setShowVoiceModal(false)}
          onUploadSuccess={() => setShowVoiceModal(false)}
        />
      )}
    </div>
  );
}
