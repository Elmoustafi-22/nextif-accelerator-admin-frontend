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
  Award,
  Video,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial state correctly
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

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
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsHovered(false);
    }
  }, [location.pathname, isMobile]);

  const handleMouseEnter = () => {
    if (!isMobile && !isSidebarOpen && !isHovered) {
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
    { name: "Leaderboard", href: "/leaderboard", icon: Award },
    { name: "Announcements", href: "/announcements", icon: Bell },
    { name: "Recordings", href: "/recordings", icon: Video },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Mobile Backdrop */}
      {effectiveOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-all"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-prussian-blue border-r border-blue-700 flex flex-col transition-all duration-300 z-50",
          isMobile ? "fixed h-screen" : "sticky top-0 h-screen",
          effectiveOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0 md:w-20"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 flex items-center gap-3 justify-center relative">
          {effectiveOpen ? (
            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-left-4">
              <img
                src="/images/nextif-logo-lg.png"
                alt="logo"
                className="h-10 w-auto"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-0 border-0 bg-transparent cursor-pointer focus:outline-none w-full flex justify-center"
            >
              <img
                src="/images/nextif-logo-3.png"
                alt="mini-logo"
                className="size-10 pt-1"
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

          {/* Desktop Toggle Button */}
          {effectiveOpen && !isMobile && (
            <button
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen);
                setIsHovered(false);
              }}
              className="p-2 cursor-pointer transition-colors text-blue-300 hidden md:block absolute right-2"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-1.5 overflow-y-auto custom-scrollbar">
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
                    : "text-blue-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-white"
                      : "text-blue-300 group-hover:text-white"
                  )}
                />
                {(effectiveOpen || !isMobile) && (
                  <span className="font-heading font-bold text-sm">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-blue-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 text-blue-300 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
            {(effectiveOpen || !isMobile) && (
              <span className="font-heading font-bold text-sm">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 bg-white/70 backdrop-blur-md border-b border-neutral-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-neutral-500 p-2 hover:bg-neutral-50 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
               <h2 className="text-xl font-heading font-black text-neutral-900">
                {links.find((l) => l.href === location.pathname)?.name || "Dashboard"}
              </h2>
            </div>
            {isMobile && (
              <div className="md:hidden">
                <img src="/images/nextif-logo-3.png" alt="logo" className="h-8 w-auto" />
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-end items-center gap-2 md:gap-4">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown();
                }}
                className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white ring-2 ring-white"></span>
                )}
              </button>
              <NotificationDropdown />
            </div>
            <div className="h-6 md:h-8 w-px bg-neutral-100 mx-1 md:mx-2"></div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserDropdownOpen(!isUserDropdownOpen);
                }}
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
              </button>
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
              />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-12 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
