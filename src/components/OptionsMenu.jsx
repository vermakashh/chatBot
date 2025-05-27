import { useState, useContext } from "react";
import { MoreHorizontal, LogOut, Settings } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function OptionsMenu() {
  const [open, setOpen] = useState(false);
  const { setUser, setSelectedUser } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(undefined);
    setSelectedUser(null);
    window.location.reload(); 
  };

  return (
    <div className="relative">
      {/* Options Icon */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="hover:bg-gray-200 p-2 rounded"
      >
        <MoreHorizontal />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border shadow-md rounded z-10">
          <ul className="text-sm text-gray-700">
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer">
              <Settings size={16} />
              Settings
            </li>
            <li
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
