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
    className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-neutral-500 text-sm font-medium">{title}</p>
    <h3 className="text-3xl font-heading font-bold text-neutral-900 mt-1">
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Admin Overview</h1>
        <p className="text-neutral-500 mt-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-neutral-900">
              Recent Fellow Activity
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              {recentActivity.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-neutral-400 text-xs font-heading font-bold uppercase tracking-wider">
                      <th className="pb-4">Fellow</th>
                      <th className="pb-4">Task</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {recentActivity.map((row: any, i: number) => (
                      <tr key={i} className="text-sm">
                        <td className="py-4 font-semibold text-neutral-900">
                          {row.ambassadorName}
                        </td>
                        <td className="py-4 text-neutral-500">
                          {row.taskTitle}
                        </td>
                        <td className="py-4">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
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
                        <td className="py-4 text-neutral-400 text-xs">
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

        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-neutral-900">System Tasks</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
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
