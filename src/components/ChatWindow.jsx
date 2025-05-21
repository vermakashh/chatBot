import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import voicecloneIcon from "./assets/voiceclone.webp";
import { Volume2 } from "lucide-react";
import VoiceUploadModal from "./VoiceUploadModal";
import MessageBar from "./MessageBar";

export default function ChatWindow() {
  const { user, selectedUser, socket } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [voiceUploaded, setVoiceUploaded] = useState(false);
  const [showVoiceInfoBox, setShowVoiceInfoBox] = useState(false);
  const messagesEndRef = useRef(null);

  const handleReceiveMessage = (msg) => {
    const isVoice = msg.message?.includes(".wav") || msg.type === "voice";
    if (isVoice) msg.type = "voice";

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

  const handlePlayVoice = async (messageText, index) => {
    const userId = user.username || user.email || user.id;
    if (!messageText || !userId) return;

    try {
      setPlayingIndex(index);
      const res = await fetch("https://40e2-192-140-153-103.ngrok-free.app/api/tts-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText, user_id: user.username }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert("Voice playback failed. Server said: " + errorText);
        return;
      }

      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
      audio.onended = () => setPlayingIndex(null);
    } catch (err) {
      console.error("Playback error:", err);
      setPlayingIndex(null);
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
    <div className="w-3/4 h-screen flex flex-col relative">
      {/* Chat Header */}
      <div className="p-4 border-b font-semibold text-lg bg-white flex justify-between items-center">
        <span>{selectedUser.username || selectedUser.email}</span>
        <button
          className="transition hover:opacity-80"
          onClick={() => {
            if (voiceUploaded) {
              setShowVoiceInfoBox(true);
            } else {
              setShowVoiceModal(true);
            }
          }}
          title="Voice Cloning"
        >
          <img src={voicecloneIcon} alt="Voice Cloning" className="w-8 h-8" />
        </button>
      </div>

      {/* Info Box if Voice Cloning already enabled */}
      {showVoiceInfoBox && (
        <div className="absolute top-20 right-6 z-50 bg-white border rounded-md shadow-lg p-4 w-80">
          <p className="text-sm text-gray-800 mb-2">
            ✅ You have successfully enabled Voice Cloning Feature.
          </p>
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => {
              setShowVoiceModal(true);
              setShowVoiceInfoBox(false);
            }}
          >
            Wish to upload a better audio file? Re-Upload
          </button>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-xs p-3 rounded-lg shadow-sm ${
              msg.senderId === user.id ? "bg-blue-100 ml-auto" : "bg-white mr-auto"
            }`}
          >
            {/* Voice Message */}
            {msg.type === "voice" || msg.message?.includes(".wav") ? (
              <audio controls className="mt-1">
                <source src={`https://chatbot-01ki.onrender.com${msg.message}`} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <p>{msg.message}</p>
            )}

            {/* Timestamp */}
            <span className="text-xs text-gray-400 block mt-1 text-right">
              {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
              })}
            </span>

            {/* Play Button for Text-to-Speech */}
            {msg.type !== "voice" && (
              <button
                onClick={() => handlePlayVoice(msg.message, idx)}
                className={`mt-1 text-sm transition-colors duration-200 ${
                  playingIndex === idx
                    ? "text-blue-900"
                    : "text-blue-600 hover:text-blue-800"
                }`}
                title="Play Voice"
              >
                <Volume2 className="w-4 h-4 inline" />
              </button>
            )}
          </div>
        ))}
        {typingUser && (
          <div className="italic text-sm text-gray-500">typing...</div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Message Bar */}
      <MessageBar
        selectedUser={selectedUser}
        onTyping={() =>
          socket.emit("typing", { from: user.id, to: selectedUser._id })
        }
        onSendMessage={(text) => {
          const msg = {
            senderId: user.id,
            receiverId: selectedUser._id,
            message: text,
            timestamp: new Date(),
          };
          socket.emit("send-message", msg);
          setMessages((prev) => [...prev, msg]);
        }}
        onSendVoiceNote={async (blob) => {
          const formData = new FormData();
          formData.append("voiceNote", blob, "voice-note.wav");

          try {
            const res = await axios.post("https://chatbot-01ki.onrender.com/api/voice/upload", formData);
            const voiceUrl = res.data.url;

            const msg = {
              senderId: user.id,
              receiverId: selectedUser._id,
              message: voiceUrl,
              type: "voice",
              timestamp: new Date(),
            };

            socket.emit("send-message", msg);
            setMessages((prev) => [...prev, msg]);
          } catch (err) {
            console.error("Voice upload failed:", err);
            alert("Voice note upload failed.");
          }
        }}
      />

      {/* Voice Cloning Modal */}
      {showVoiceModal && (
        <VoiceUploadModal
          onClose={() => setShowVoiceModal(false)}
          onUploadSuccess={() => {
            setVoiceUploaded(true);
            setShowVoiceModal(false);
          }}
        />
      )}
    </div>
  );
}
