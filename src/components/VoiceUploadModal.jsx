import { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

export default function VoiceUploadModal({ onClose, userId, onUploadSuccess }) {
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!audioFile) return alert("Please upload an audio file");

    const formData = new FormData();
    formData.append("voice", audioFile);
    formData.append("username", userId); // ✅ key must match backend (was: userId)

    try {
      setLoading(true);
      const res = await axios.post("https://chatbot-01ki.onrender.com/api/upload-voice", formData);
      alert("Voice uploaded successfully!");
      onUploadSuccess(); // ✅ close modal & mark state
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg relative w-full max-w-2xl shadow-md text-center">
        {/* ❌ Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-4xl font-bold mb-8">Voice Cloning</h2>

        <div className="bg-blue-50 p-6 rounded-md mb-4">
          <label className="block cursor-pointer">
            <input type="file" accept=".wav" className="hidden" onChange={handleFileChange} />
            <div className="text-center text-gray-700">
              ⬆️ Upload 30–60 sec audio sample of your voice<br />
              <span className="text-sm text-gray-500">(WAV format only)</span>
            </div>
          </label>
          {audioFile && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: <strong>{audioFile.name}</strong>
            </p>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Your voice will be used to personalize text-to-speech responses in this chat app.
        </p>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Confirm and Submit"}
        </button>
      </div>
    </div>
  );
}
