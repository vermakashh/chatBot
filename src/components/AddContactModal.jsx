import { useEffect, useState } from "react";
import axios from "axios";

export default function AddContactModal({ userId, onClose, onContactAdded }) {
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      console.warn("User ID not provided to AddContactModal");
      return;
    }

    setLoading(true);
    axios
      .get("https://chatbot-01ki.onrender.com/api/auth/users")
      .then((res) => {
        const filteredUsers = res.data.filter((u) => u._id !== userId);
        setAllUsers(filteredUsers);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        alert("Error fetching users. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAdd = async (contactId) => {
    if (!userId || !contactId) {
      alert("Invalid user or contact ID.");
      return;
    }

    try {
      await axios.post(
        `https://chatbot-01ki.onrender.com/api/auth/contacts/${userId}/${contactId}`
      );

      const newContact = allUsers.find((u) => u._id === contactId);
      if (newContact) {
        onContactAdded(newContact);
      }
      onClose();
    } catch (err) {
      console.error("Add contact failed:", err.response?.data || err.message);
      alert("Failed to add contact.");
    }
  };

  const filtered = allUsers.filter((u) =>
    u?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto shadow-lg">
        <h2 className="text-lg font-bold mb-4">Add Contact</h2>

        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded text-sm"
        />

        {loading ? (
          <p className="text-sm text-gray-500">Loading users...</p>
        ) : filtered.length > 0 ? (
          filtered.map((u) => (
            <div key={u._id} className="flex justify-between items-center mb-2">
              <span>{u.username}</span>
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => handleAdd(u._id)}
              >
                Add
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No users found</p>
        )}

        <button
          className="mt-4 text-sm text-red-500 hover:underline"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
