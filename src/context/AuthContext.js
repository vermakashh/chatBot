import { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const socket = useMemo(() => {
    return io("https://chatbot-01ki.onrender.com", {
      transports: ["websocket"],
    });
  }, []);

  useEffect(() => {
    const fetchUserFromToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);

        // ✅ Optional: Token expiration check
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.warn("JWT token expired");
          localStorage.removeItem("token");
          setUser(null);
          return;
        }

        // ✅ Fetch all users
        const res = await axios.get("https://chatbot-01ki.onrender.com/api/auth/users");

        // ✅ Match user by decoded ID
        const foundUser = res.data.find((u) => u._id === decoded.id);
        if (foundUser) {
          setUser({ ...foundUser, token });
          socket.emit("register-user", decoded.id); // ✅ Register for socket communication
        } else {
          console.warn("User not found with decoded ID.");
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Token validation or user fetch failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    fetchUserFromToken();
  }, [socket]);

  return (
    <AuthContext.Provider
      value={{ user, setUser, selectedUser, setSelectedUser, socket }}
    >
      {children}
    </AuthContext.Provider>
  );
};
