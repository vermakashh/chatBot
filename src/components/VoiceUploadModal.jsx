import { useState, useContext } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function VoiceUploadModal({ onClose, onUploadSuccess }) {
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user } = useContext(AuthContext); // ✅ Get user context

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== "audio/wav") {
      alert("Only .wav files are supported.");
      return;
    }
    setAudioFile(file);
  };

  const handleSubmit = async () => {
    if (!audioFile) return alert("Please upload a .wav file");
    if (!user?.username) return alert("Username missing in context");

    const formData = new FormData();
    formData.append("voice", audioFile);
    formData.append("username", user.username); // ✅ Backend expects this

    try {
      setLoading(true);
      console.log("[UPLOAD] Sending voice sample for:", user.username);

      const res = await axios.post(
        "https://chatbot-01ki.onrender.com/api/upload-voice",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("[UPLOAD SUCCESS]", res.data);
      alert("Voice uploaded successfully!");
      onUploadSuccess();
    } catch (err) {
      console.error("[UPLOAD FAILED]", err.response?.data || err.message);
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg relative w-full max-w-2xl shadow-md text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-4xl font-bold mb-8">Voice Cloning</h2>

        <div className="bg-blue-50 p-6 rounded-md mb-4">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept=".wav"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="text-center text-gray-700">
              ⬆️ Upload 30–60 sec audio sample<br />
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
          Your voice will be used to personalize AI speech output in this chat.
        </p>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Confirm and Submit"}
        </button>
      </div>
    </div>
  );
}
