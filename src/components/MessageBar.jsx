import { useRef, useState } from "react";
import { Mic, Smile, X } from "lucide-react";
import { Menu } from "@headlessui/react";
import EmojiPicker from "emoji-picker-react";

export default function MessageBar({ selectedUser, onTyping, onSendMessage, onSendVoiceNote }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const chunksRef = useRef([]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const startVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
  };

  const handleUnifiedSend = () => {
    if (audioBlob) {
      onSendVoiceNote(audioBlob);
      setAudioBlob(null);
    } else {
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-white relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-50">
          <EmojiPicker onEmojiClick={handleEmojiSelect} theme="light" />
        </div>
      )}

      <div className="flex items-center bg-blue-50 rounded-full px-4 py-2 w-full">
        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="mr-2 text-gray-600 hover:text-blue-600 transition"
          title="Insert Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Message Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping();
          }}
          placeholder="Type your message..."
          className="flex-1 bg-transparent outline-none placeholder-gray-500 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleUnifiedSend()}
        />

        {/* Voice Recording Controls */}
        {isRecording || audioBlob ? (
          <>
            {isRecording && (
              <div className="flex items-center gap-1 ml-2 text-sm text-red-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                Recording...
              </div>
            )}

            {/* Cancel Recording Button */}
            <button
              onClick={cancelRecording}
              className="ml-2 p-2 rounded-full hover:bg-red-100 text-red-600 transition"
              title="Cancel Recording"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          // Mic Dropdown (Only when not recording)
          <Menu as="div" className="relative inline-block text-left ml-2">
            <Menu.Button
              className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
              title="Voice Options"
            >
              <Mic className="w-5 h-5" />
            </Menu.Button>

            <Menu.Items className="absolute right-0 z-10 bottom-10 w-32 origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={startVoiceNote}
                    className={`${
                      active ? "bg-blue-100" : ""
                    } block w-full px-4 py-2 text-sm text-left text-gray-700`}
                  >
                    Voice Note
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => alert("ASR coming soon")}
                    className={`${
                      active ? "bg-blue-100" : ""
                    } block w-full px-4 py-2 text-sm text-left text-gray-700`}
                  >
                    ASR
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        )}

        {/* Unified Send Button */}
        <button
          onClick={handleUnifiedSend}
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
  );
}
