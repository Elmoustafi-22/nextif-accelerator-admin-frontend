import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Bell,
  User as UserIcon,
  LogOut,
  X,
  ShieldCheck,
  PlusCircle,
  Upload,
  Menu,
  Calendar,
  Users,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import NotificationDropdown from "./NotificationDropdown";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(
    window.innerWidth >= 768
  );
  const [isHovered, setIsHovered] = React.useState(false);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // effectiveOpen is true if explicitly open OR currently hovered
  const effectiveOpen = isSidebarOpen || isHovered;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const { unreadCount, toggleDropdown, fetchNotifications } =
    useNotificationStore();

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close sidebar on mobile route change
  React.useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
      setIsHovered(false);
    }
  }, [location.pathname]);

  const handleMouseEnter = () => {
    if (!isSidebarOpen && !isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: ShieldCheck },
    { name: "Manage Fellows", href: "/fellows", icon: UserIcon },
    { name: "Bulk Onboarding", href: "/fellows/bulk", icon: Upload },
    { name: "Manage Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Complaints", href: "/complaints", icon: PlusCircle },
    { name: "Team", href: "/team", icon: Users }, // Admin Directory
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Attendance", href: "/attendance", icon: CheckSquare },
    { name: "Announcements", href: "/announcements", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Mobile Backdrop */}
      {effectiveOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-prussian-blue border-r border-blue-700 flex flex-col transition-all duration-300 z-50 fixed md:sticky top-0 h-screen",
          effectiveOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0 md:w-20"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-2 flex items-center gap-3 justify-center">
          {effectiveOpen ? (
            <span className="font-bold text-xl tracking-tight text-neutral-900">
              <img
                src="/images/nextif-logo-lg.png"
                alt="logo"
                title="logo"
                className="h-10 w-auto"
              />
            </span>
          ) : (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-0 border-0 bg-transparent cursor-pointer focus:outline-none w-full flex justify-center"
            >
              <img
                src="/images/nextif-logo-3.png"
                title="mini-logo"
                alt="mini-logo"
                className="size-12 pt-1 hidden md:block"
              />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 text-blue-300 md:hidden"
          >
            <X size={24} />
          </button>

          {/* Desktop Toggle Button - Only visible when open OR effectively open due to hover */}
          {/* We want to show the close button if it's effectively open so user can pin/unpin or close it */}
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsHovered(false);
            }}
            className="p-2 cursor-pointer transition-colors text-neutral-400 hidden md:block absolute right-2 top-3"
          >
            {effectiveOpen ? <X size={24} className="text-blue-300" /> : null}
          </button>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group",
                  isActive
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                    : "text-blue-300 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-white"
                      : "text-blue-300 group-hover:text-blue-600"
                  )}
                />
                {(effectiveOpen || window.innerWidth < 768) && (
                  <span className="font-heading font-bold text-sm">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-600 shrink-0" />
            {(effectiveOpen || window.innerWidth < 768) && (
              <span className="font-heading font-bold text-blue-300 text-sm">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 bg-royal-blue/10 backdrop-blur-md border-b border-neutral-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <button
            className="md:hidden text-neutral-500 p-2 -ml-2"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 flex justify-end items-center gap-3 md:gap-4">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown();
                }}
                className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-white"></span>
                )}
              </button>
              <NotificationDropdown />
            </div>
            <div className="h-6 w-px bg-neutral-100 mx-1 md:mx-2"></div>
            <Link
              to="/profile"
              className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2 hover:bg-neutral-50 p-1.5 md:p-2 rounded-2xl transition-all group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-neutral-900 leading-none group-hover:text-blue-600 transition-colors">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-wider">
                  {user?.title || "Administrator"}
                </p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-bold text-xs ring-2 md:ring-4 ring-neutral-50 group-hover:ring-blue-50 group-hover:bg-blue-600 transition-all overflow-hidden shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-12">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
