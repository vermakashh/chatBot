import { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const { user } = useContext(AuthContext);
  const [showRegister, setShowRegister] = useState(false);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white px-4">
        {showRegister ? (
          <Register switchToLogin={() => setShowRegister(false)} />
        ) : (
          <Login switchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gray-100 font-sans">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
