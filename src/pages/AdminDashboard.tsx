import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { cn } from "../utils/cn";
import Button from "../components/Button";
import axiosInstance from "../api/axiosInstance";

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-neutral-100 shadow-sm"
  >
    <div className="flex justify-between items-start mb-3 md:mb-4">
      <div className={cn("p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-lg shadow-blue-600/10", color)}>
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-green-600 text-[10px] md:text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp size={10} className="md:w-3 md:h-3" /> {trend}
        </span>
      )}
    </div>
    <p className="text-neutral-500 text-xs md:text-sm font-medium">{title}</p>
    <h3 className="text-2xl md:text-3xl font-heading font-black text-neutral-900 mt-1 tracking-tight">
      {value}
    </h3>
  </motion.div>
);

const AdminDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/admin/stats");
        setData(response.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDistanceToNow = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl text-center">
        <p className="font-bold">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const { stats, recentActivity } = data;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl md:text-3xl font-black font-heading text-neutral-900 tracking-tight">Admin Overview</h1>
        <p className="text-neutral-500 mt-1 text-sm md:text-base font-medium">
          Manage fellows and oversee platform activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Fellows"
          value={stats.activeAmbassadors}
          icon={Users}
          color="bg-blue-600"
          trend={
            stats.activeAmbassadors > 0
              ? `Total: ${stats.activeAmbassadors}`
              : null
          }
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingSubmissions}
          icon={CheckSquare}
          color="bg-amber-500"
        />
        <StatCard
          title="Open Complaints"
          value={stats.openComplaints}
          icon={AlertCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Messages Sent"
          value={stats.messagesSent}
          icon={MessageSquare}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-neutral-100 bg-neutral-50/30">
            <h2 className="text-base md:text-lg font-black font-heading text-neutral-900">
              Recent Fellow Activity
            </h2>
          </div>
          <div className="p-0 md:p-6">
            <div className="overflow-x-auto">
              {recentActivity.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-neutral-400 text-[10px] md:text-xs font-heading font-black uppercase tracking-wider border-b border-neutral-50">
                      <th className="px-5 md:px-0 pb-3 md:pb-4">Fellow</th>
                      <th className="hidden md:table-cell pb-4">Task</th>
                      <th className="pb-3 md:pb-4 text-center md:text-left">Status</th>
                      <th className="pr-5 md:pr-0 pb-3 md:pb-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {recentActivity.map((row: any, i: number) => (
                      <tr key={i} className="text-xs md:text-sm hover:bg-neutral-50 transition-colors">
                        <td className="px-5 md:px-0 py-4 font-bold text-neutral-900">
                          <div className="flex flex-col">
                            <span>{row.ambassadorName}</span>
                            <span className="md:hidden text-[10px] text-neutral-400 font-medium mt-0.5 line-clamp-1">{row.taskTitle}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-4 text-neutral-500 font-medium">
                          {row.taskTitle}
                        </td>
                        <td className="py-4 text-center md:text-left">
                          <span
                            className={cn(
                              "px-2 md:px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest",
                              row.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : row.status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {row.status === "SUBMITTED"
                              ? "PENDING"
                              : row.status}
                          </span>
                        </td>
                        <td className="pr-5 md:pr-0 py-4 text-neutral-400 text-[10px] md:text-xs text-right font-medium">
                          {formatDistanceToNow(row.time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-neutral-500">No recent activity found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-neutral-100 bg-neutral-50/30">
            <h2 className="text-base md:text-lg font-black font-heading text-neutral-900">System Tasks</h2>
          </div>
          <div className="p-5 md:p-6 space-y-3 md:space-y-4">
            <Link to="/fellows/bulk">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-2xl mb-4"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-heading font-bold">
                    Import Fellows
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    CSV or Excel format
                  </p>
                </div>
              </Button>
            </Link>
            <Link to="/tasks">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-2xl mb-4"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <CheckSquare size={18} className="text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-heading font-bold">Create Task</p>
                  <p className="text-[10px] text-neutral-400">
                    Assign to fellows
                  </p>
                </div>
              </Button>
            </Link>
            <Link to="/announcements">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-2xl"
              >
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <AlertCircle size={18} className="text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-heading font-bold">
                    Send Announcement
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Notify all fellows
                  </p>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
