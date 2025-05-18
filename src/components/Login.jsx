import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import logo from "./assets/logo.png";

export default function Login({ switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, socket } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    try {
      const res = await axios.post("https://chatbot-01ki.onrender.com/api/auth/login", {
        email,
        password,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      setUser(res.data.user);
      socket.emit("register-user", res.data.user.id);
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        {/* Logo */}
        <img src={logo} alt="EchoChat Logo" className="h-16 w-auto" />

        {/* Email Input */}
        <div className="w-full bg-blue-50 rounded px-5 py-3 text-left text-lg">
          <input
            type="email"
            placeholder="Email Address"
            className="bg-transparent outline-none w-full text-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="w-full relative bg-blue-50 rounded px-5 py-3 text-left flex items-center text-lg">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="bg-transparent outline-none w-full pr-10 text-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 text-lg rounded hover:bg-blue-700 transition"
        >
          Sign In
        </button>

        {/* Register Link*/}
        <p className="text-base text-gray-700 mt-2">
          Don’t have an account?{" "}
          <button onClick={switchToRegister} className="text-blue-600 underline">
            Register
          </button>
        </p>
      </div>
    </div>
  );
}