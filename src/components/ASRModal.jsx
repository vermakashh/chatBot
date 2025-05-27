export default function ASRModal({ onClose }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded p-4 w-96">
          <h2 className="text-lg font-bold mb-2">ASR Modal</h2>
          <p className="text-sm text-gray-600">Speech-to-text feature coming soon.</p>
          <button onClick={onClose} className="mt-4 text-blue-600 hover:underline text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }
  