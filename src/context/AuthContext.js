import { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { devLog, devWarn, devError } from "../utils/logger";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [selectedUser, setSelectedUser] = useState(null);

  const socket = useMemo(() => {
    const s = io("https://chatbot-01ki.onrender.com", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    s.on("connect_error", (err) => {
      devWarn("[Socket] Connect error:", err.message);
    });

    return s;
  }, []);

  useEffect(() => {
    const fetchUserFromToken = async () => {
      devLog("[AuthContext] Fetching user from token...");
      const token = localStorage.getItem("token");

      if (!token) {
        devWarn("[AuthContext] No token found.");
        setUser(null);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        devLog("[AuthContext] Token decoded:", decoded);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          devWarn("[AuthContext] Token expired.");
          localStorage.removeItem("token");
          setUser(null);
          return;
        }

        const res = await axios.get("https://chatbot-01ki.onrender.com/api/auth/users");
        devLog("[AuthContext] Fetched all users");

        const foundUser = res.data.find((u) => u._id === decoded.id);
        if (foundUser) {
          const fullUser = { ...foundUser, token };
          setUser(fullUser);
          devLog("[AuthContext] User found:", foundUser);
        } else {
          devWarn("[AuthContext] No matching user found.");
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (err) {
        devError("[AuthContext] Token validation or fetch failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    setTimeout(fetchUserFromToken, 100); 
  }, [socket]);

  useEffect(() => {
    if (user && user._id) {
      devLog("[AuthContext] Registering socket for user:", user._id);
      socket.emit("register-user", user._id);
    }
  }, [user, socket]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        selectedUser,
        setSelectedUser,
        socket,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
