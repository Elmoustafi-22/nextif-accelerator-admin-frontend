import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../utils/cn";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDropdown = ({ isOpen, onClose }: UserDropdownProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
        >
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
            <p className="text-sm font-bold text-neutral-900 leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-wider">
              {user?.title || "Administrator"}
            </p>
          </div>

          <div className="p-2">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="text-sm font-medium text-neutral-700">My Profile</span>
              </div>
              <ChevronRight size={16} className="text-neutral-300 group-hover:text-neutral-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <LogOut size={18} />
                </div>
                <span className="text-sm font-medium text-red-600">Sign Out</span>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserDropdown;
