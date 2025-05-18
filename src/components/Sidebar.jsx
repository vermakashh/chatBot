import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import OptionsMenu from "./OptionsMenu";
import logo from "./assets/logo.png";
import { FiTrash2 } from "react-icons/fi";
import AddContactModal from "./AddContactModal"; // NEW MODAL COMPONENT

export default function Sidebar() {
  const { user, setSelectedUser, socket, selectedUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    socket.on("online-users", (list) => setOnlineUsers(list));
    return () => socket.off("online-users");
  }, [socket]);

  // Fetch only added contacts
  useEffect(() => {
    axios
      .get(`https://chatbot-01ki.onrender.com/api/auth/contacts/${user.id}`)
      .then((res) => setUsers(res.data));
  }, [user]);

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;

    try {
      await axios.delete(`https://chatbot-01ki.onrender.com/api/auth/contacts/${user.id}/${contactId}`);
      setUsers((prev) => prev.filter((u) => u._id !== contactId));
      if (selectedUser?._id === contactId) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Error deleting contact:", err, err.response?.data || err.message);
      alert("Failed to delete contact. Try again.");
    }
  };

  return (
    <div className="w-1/4 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b h-16">
        <div className="h-8 w-auto">
          <img
            src={logo}
            alt="ChatBot Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <OptionsMenu />
      </div>

      {/* Add Contact Button */}
      <div className="px-4 pt-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="text-blue-600 text-sm hover:underline"
        >
          + Add Contact
        </button>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {users.map((u) => (
          <div
            key={u._id}
            className={`flex items-center justify-between p-2 rounded cursor-pointer ${
              selectedUser?._id === u._id ? "bg-blue-50" : "hover:bg-gray-100"
            }`}
          >
            <div
              className="flex items-center gap-2 flex-1"
              onClick={() => setSelectedUser(u)}
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  onlineUsers.includes(u._id) ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>
              <span className="text-sm">{u.username || u.email}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteContact(u._id);
              }}
              className="text-red-500 hover:text-red-700"
              title="Delete Contact"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal for Add Contact */}
      {showAddModal && (
        <AddContactModal
          userId={user.id}
          onClose={() => setShowAddModal(false)}
          onContactAdded={(newContact) => setUsers((prev) => [...prev, newContact])}
        />
      )}
    </div>
  );
}
