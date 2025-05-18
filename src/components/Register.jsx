import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import logo from "./assets/logo.png";

export default function Register({ switchToLogin }) {
  const { setUser, socket } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.password) {
      alert("All fields are required");
      return;
    }

    try {
      const res = await axios.post("https://chatbot-01ki.onrender.com/api/auth/register", form);
      const token = res.data.token;
      localStorage.setItem("token", token);
      setUser(res.data.user);
      socket.emit("register-user", res.data.user.id);
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        <img src={logo} alt="EchoChat Logo" className="h-16 w-auto" />

        <div className="w-full bg-blue-50 rounded px-5 py-3 text-left text-lg">
          <input
            type="email"
            placeholder="Email Address"
            className="bg-transparent outline-none w-full text-lg"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="w-full bg-blue-50 rounded px-5 py-3 text-left text-lg">
          <input
            type="text"
            placeholder="Username"
            className="bg-transparent outline-none w-full text-lg"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div className="w-full relative bg-blue-50 rounded px-5 py-3 text-left flex items-center text-lg">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="bg-transparent outline-none w-full pr-10 text-lg"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          onClick={handleRegister}
          className="w-full bg-blue-600 text-white py-3 text-lg rounded hover:bg-blue-700 transition"
        >
          Register
        </button>

        <p className="text-base text-gray-700">
          Already have an account?{" "}
          <button onClick={switchToLogin} className="text-blue-600 underline">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
