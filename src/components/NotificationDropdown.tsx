import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Info, Megaphone, Mail } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { cn } from "../utils/cn";

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    isOpen,
    closeDropdown,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
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
          className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
        >
          <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-white">
            <h3 className="font-heading font-bold text-neutral-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center text-neutral-400 p-4">
                <Bell size={32} className="mb-3 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      "p-4 hover:bg-neutral-50 transition-colors flex gap-3 cursor-pointer group relative",
                      !notification.read ? "bg-blue-50/30" : "bg-white"
                    )}
                    onClick={() =>
                      !notification.read && markAsRead(notification._id)
                    }
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                        notification.type === "ANNOUNCEMENT"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                      )}
                    >
                      {notification.type === "ANNOUNCEMENT" ? (
                        <Megaphone size={14} />
                      ) : notification.type === "MESSAGE" ? (
                        <Mail size={14} />
                      ) : (
                        <Info size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4
                          className={cn(
                            "text-sm font-bold truncate",
                            !notification.read
                              ? "text-neutral-900"
                              : "text-neutral-600"
                          )}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 shrink-0 whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.body}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                          New
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
