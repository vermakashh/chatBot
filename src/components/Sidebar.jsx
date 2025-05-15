import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import OptionsMenu from "./OptionsMenu";
import logo from "./assets/logo.png";

export default function Sidebar() {
  const { user, setSelectedUser, socket, selectedUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.on("online-users", (list) => setOnlineUsers(list));
    return () => socket.off("online-users");
  }, [socket]);

  useEffect(() => {
    axios.get("https://chatbot-01ki.onrender.com/api/auth/users").then((res) => {
      setUsers(res.data.filter((u) => u._id !== user.id));
    });
  }, [user]);

  return (
    <div className="w-1/4 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header with Logo and Options */}
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

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => setSelectedUser(u)}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
              selectedUser?._id === u._id ? "bg-blue-50" : "hover:bg-gray-100"
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full ${
                onlineUsers.includes(u._id) ? "bg-green-500" : "bg-gray-400"
              }`}
            ></span>
            <span className="text-sm">{u.username || u.email}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
