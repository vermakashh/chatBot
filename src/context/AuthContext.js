import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

const socket = io("https://chatbot-01ki.onrender.com", {
  transports: ["websocket"],
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        setUser({ id: decoded.id, token });

        socket.emit("register-user", decoded.id); 

      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, selectedUser, setSelectedUser, socket }}
    >
      {children}
    </AuthContext.Provider>
  );
};
