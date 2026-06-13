import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Send,
  RefreshCcw,
  CheckSquare,
  Square,
  Mail,
  Award,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import axiosInstance from "../api/axiosInstance";
import Input from "../components/Input";
import Button from "../components/Button";
import { toast } from "../store/useToastStore";
import { cn } from "../utils/cn";

interface FellowRecord {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountStatus: string;
  profile?: {
    institution?: string;
    courseOfStudy?: string;
    isGraduated?: boolean;
    graduationDate?: string;
  };
  createdAt: string;
  taskPoints?: number;
  attendancePoints?: number;
  capstonePoints?: number;
  totalPoints?: number;
  obtainablePoints?: number;
  rank?: number;
}

interface LeaderboardEntry {
  id: string;
  taskPoints: number;
  attendancePoints: number;
  capstonePoints: number;
  totalPoints: number;
  obtainablePoints?: number;
  rank: number;
}

const GraduationManagementPage = () => {
  const { user } = useAuthStore();
  const [fellows, setFellows] = useState<FellowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"graduated" | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Stats
  const [stats, setStats] = useState({ total: 0, graduated: 0, active: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Graduation Composer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    "🎓 Congratulations on Graduating from NextIF!"
  );
  const [emailBody, setEmailBody] = useState(
    `We are incredibly proud of your dedication and hard work throughout the NextIF Global Islamic Finance Career Mentorship and Accelerator Program Cohort 2.\n\nYou have officially graduated, and this milestone is a testament to your commitment to excellence in Islamic Finance.\n\nMay Allah bless your journey ahead and may this achievement open doors to remarkable opportunities in your career.\n\nWarm regards,\nThe NextIF Team`
  );
  const [rankingMessages, setRankingMessages] = useState({
    first: "Your outstanding performance placed you at the very top of this cohort. Congratulations on earning the Gold Medal as the highest ranked fellow.",
    second: "Your excellence, consistency, and dedication earned you the Silver Medal as the second highest ranked fellow. Congratulations on this remarkable achievement.",
    third: "Your strong performance secured the Bronze Medal as the third highest ranked fellow. Congratulations on being one of the cohort's top achievers.",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Super Admin check
  const titleLower = (user?.title || "").toLowerCase().trim();
  const isSuperAdmin =
    titleLower === "tech lead" ||
    titleLower === "ceo" ||
    titleLower === "chief executive officer";

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [totalRes, graduatedRes] = await Promise.all([
        axiosInstance.get("/admin/ambassadors", { params: { limit: 1 } }),
        axiosInstance.get("/admin/ambassadors", {
          params: { limit: 1, isGraduated: "true" },
        }),
      ]);
      const total = totalRes.data.meta?.total || 0;
      const graduated = graduatedRes.data.meta?.total || 0;
      setStats({ total, graduated, active: total - graduated });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFellows = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10000 };

      if (searchTerm) params.search = searchTerm;

      if (activeTab === "graduated") {
        params.isGraduated = "true";
      }

      const [fellowsRes, leaderboardRes] = await Promise.all([
        axiosInstance.get("/admin/ambassadors", { params }),
        axiosInstance.get("/admin/leaderboard"),
      ]);
      const leaderboardMap = new Map<string, LeaderboardEntry>(
        (leaderboardRes.data || []).map((entry: LeaderboardEntry) => [
          entry.id,
          entry,
        ])
      );
      const fellowsWithXp = (fellowsRes.data.data || [])
        .map((fellow: FellowRecord) => {
          const leaderboardEntry = leaderboardMap.get(fellow._id);
          return {
            ...fellow,
            taskPoints: leaderboardEntry?.taskPoints || 0,
            attendancePoints: leaderboardEntry?.attendancePoints || 0,
            capstonePoints: leaderboardEntry?.capstonePoints || 0,
            totalPoints: leaderboardEntry?.totalPoints || 0,
            obtainablePoints: leaderboardEntry?.obtainablePoints || 0,
            rank: leaderboardEntry?.rank,
          };
        })
        .sort(
          (a: FellowRecord, b: FellowRecord) =>
            (b.totalPoints || 0) - (a.totalPoints || 0)
        );
      setFellows(fellowsWithXp);
      setTotalPages(fellowsRes.data.meta?.totalPages || 1);
      setTotalCount(fellowsRes.data.meta?.total || 0);
    } catch (err) {
      console.error("Failed to load fellows:", err);
      toast.error("Failed to load fellows list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchStats();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchFellows();
    setSelectedIds(new Set()); // Clear selection on tab/page change
  }, [activeTab, page, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    setPage(1);
    const timer = setTimeout(() => fetchFellows(), 450);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isSuperAdmin) return <Navigate to="/unauthorized" replace />;

  // --- Selection Handlers ---
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = fellows.map((f) => f._id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const visibleIds = fellows.map((f) => f._id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));
  const selectedRankedFellows = fellows
    .filter(
      (fellow) =>
        selectedIds.has(fellow._id) &&
        typeof fellow.rank === "number" &&
        fellow.rank <= 3
    )
    .sort((a, b) => (a.rank || 99) - (b.rank || 99));

  // --- Graduation Submit ---
  const handleGraduate = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/admin/ambassadors/graduate", {
        ambassadorIds: Array.from(selectedIds),
        emailSubject,
        emailBody,
        rankingMessages,
        logoUrl: "https://res.cloudinary.com/dwryrfa1u/image/upload/v1780914626/nextIf-logo-3_c7ckde.jpg",
        graduationImageUrl: "https://res.cloudinary.com/dwryrfa1u/image/upload/v1780914568/graduated_byrtsy.png",
      });
      toast.success(
        `🎓 ${res.data.successCount} fellow(s) graduated successfully!`
      );
      if (res.data.failedCount > 0) {
        toast.error(`${res.data.failedCount} email(s) failed to send.`);
      }
      setIsModalOpen(false);
      setSelectedIds(new Set());
      fetchFellows();
      fetchStats();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to process graduation."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: "graduated" | "all") => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-neutral-900 flex items-center gap-3">
            <GraduationCap className="text-amber-500" size={32} /> Graduation
            Management
          </h1>
          <p className="text-neutral-500 mt-1">
            Select fellows who have completed the program and mark them as
            graduated — triggering in-app notifications and personalised emails.
          </p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchFellows(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 bg-white hover:bg-neutral-50 active:scale-95 transition-all self-start md:self-auto"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total Fellows</p>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">
              {loadingStats ? "..." : stats.total}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Graduated</p>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">
              {loadingStats ? "..." : stats.graduated}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Active / Current</p>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">
              {loadingStats ? "..." : stats.active}
            </h3>
          </div>
        </div>
      </div>

      {/* Floating batch action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-neutral-950 text-white rounded-2xl shadow-2xl shadow-black/30 px-6 py-4 flex items-center gap-5"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center font-black text-sm">
                {selectedIds.size}
              </div>
              <span className="text-sm font-semibold">
                fellow{selectedIds.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-bold text-neutral-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/30"
            >
              <GraduationCap size={16} />
              Graduate {selectedIds.size} Fellow{selectedIds.size > 1 ? "s" : ""}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/20">
          {/* Tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl w-fit">
            {(["graduated", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all",
                  activeTab === tab
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-950"
                )}
              >
                {tab === "graduated" ? `Graduated (${stats.graduated})` : `All (${stats.total})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="animate-spin text-amber-500 mb-4" size={36} />
            <p className="text-neutral-500 text-sm font-medium">Loading fellows...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-xs font-black uppercase tracking-wider text-neutral-400 bg-neutral-50/50">
                  <th className="py-4 px-6 w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="text-neutral-400 hover:text-neutral-700 transition-colors"
                    >
                      {allVisibleSelected ? (
                        <CheckSquare size={18} className="text-amber-500" />
                      ) : someVisibleSelected ? (
                        <CheckSquare size={18} className="text-amber-300" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6">Fellow</th>
                  <th className="py-4 px-6">Institution</th>
                  <th className="py-4 px-6 text-center">Rank</th>
                  <th className="py-4 px-6 text-right">XP</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Graduation Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {fellows.map((fellow) => {
                  const isGraduated = !!fellow.profile?.isGraduated;
                  const isSelected = selectedIds.has(fellow._id);

                  return (
                    <motion.tr
                      key={fellow._id}
                      animate={{ backgroundColor: isSelected ? "rgb(255 251 235)" : "transparent" }}
                      className="text-sm transition-colors cursor-pointer hover:bg-neutral-50/40"
                      onClick={() => toggleSelect(fellow._id)}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-6">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-amber-500 border-amber-500"
                              : "border-neutral-300"
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </td>

                      {/* Name / Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {fellow.firstName?.[0]}
                            {fellow.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 leading-tight">
                              {fellow.firstName} {fellow.lastName}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {fellow.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Institution */}
                      <td className="py-4 px-6 text-xs text-neutral-600 max-w-[180px] truncate">
                        {fellow.profile?.institution || (
                          <span className="italic text-neutral-400">Not specified</span>
                        )}
                      </td>

                      {/* Rank */}
                      <td className="py-4 px-6 text-center">
                        {fellow.rank ? (
                          <span
                            className={cn(
                              "inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-xl text-xs font-black border",
                              fellow.rank === 1
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : fellow.rank === 2
                                  ? "bg-slate-100 text-slate-700 border-slate-300"
                                  : fellow.rank === 3
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : "bg-neutral-50 text-neutral-500 border-neutral-100"
                            )}
                            title={
                              fellow.rank === 1
                                ? "Gold Medal"
                                : fellow.rank === 2
                                  ? "Silver Medal"
                                  : fellow.rank === 3
                                    ? "Bronze Medal"
                                    : `Rank #${fellow.rank}`
                            }
                          >
                            {fellow.rank <= 3 ? fellow.rank : `#${fellow.rank}`}
                          </span>
                        ) : (
                          <span className="text-neutral-300 italic">-</span>
                        )}
                      </td>

                      {/* XP */}
                      <td className="py-4 px-6 text-right">
                        <div className="font-black text-neutral-900">
                          {fellow.totalPoints || 0}/{fellow.obtainablePoints || 0} XP
                        </div>
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          T {fellow.taskPoints || 0} / A {fellow.attendancePoints || 0} / C {fellow.capstonePoints || 0}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                            isGraduated
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-green-50 text-green-700 border border-green-100"
                          )}
                        >
                          {isGraduated ? (
                            <><GraduationCap size={11} /> Graduated</>
                          ) : (
                            <><Clock size={11} /> Active</>
                          )}
                        </span>
                      </td>

                      {/* Graduation Date */}
                      <td className="py-4 px-6 text-xs text-neutral-500">
                        {fellow.profile?.graduationDate ? (
                          new Date(fellow.profile.graduationDate).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })
                        ) : (
                          <span className="text-neutral-300 italic">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}

                {fellows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <GraduationCap size={48} className="mx-auto mb-4 text-neutral-200" />
                      <p className="font-semibold text-neutral-500">No fellows found</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Try adjusting your tab or search filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-5 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/20">
            <span className="text-xs text-neutral-500">
              Page {page} of {totalPages} ({totalCount} results)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 border border-neutral-200 text-xs font-bold rounded-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 border border-neutral-200 text-xs font-bold rounded-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Graduation Composer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-black text-neutral-900">
                      Graduate {selectedIds.size} Fellow{selectedIds.size > 1 ? "s" : ""}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Compose the graduation email sent to each selected fellow
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Info Banner */}
              <div className="px-6 pt-5">
                <div className="flex gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-bold mb-1">What happens when you confirm?</p>
                    <ul className="space-y-0.5 font-medium">
                      <li>• Each selected fellow's portal will show a "Graduated" status badge</li>
                      <li>• An in-app notification is sent: "🎓 Graduation Confirmed!"</li>
                      <li>• A branded graduation email (with logo & imagery) is sent to each fellow</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email Composer */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-neutral-700 flex items-center gap-2">
                    <Mail size={14} className="text-neutral-400" /> Email Subject
                  </label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="🎓 Congratulations on Graduating from NextIF!"
                  />
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-neutral-700">
                    Email Body
                  </label>
                  <textarea
                    rows={10}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all resize-none text-sm font-medium text-neutral-700 leading-relaxed"
                    placeholder="Write your graduation message here..."
                  />
                  <p className="text-[10px] text-neutral-400">
                    This message will appear in the highlighted block of the graduation email. The logo, graduation image, award emojis, and "What happens next" section are automatically added.
                  </p>
                </div>

                {/* Top Ranked Messages */}
                <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-neutral-900 flex items-center gap-2">
                        <Award size={15} className="text-amber-600" />
                        Top Ranked Messages
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                        These optional messages are added only for rank 1, rank 2, and rank 3 fellows.
                      </p>
                    </div>
                    {selectedRankedFellows.length > 0 && (
                      <span className="shrink-0 rounded-full bg-white border border-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                        {selectedRankedFellows.length} selected
                      </span>
                    )}
                  </div>

                  {selectedRankedFellows.length > 0 && (
                    <div className="grid gap-2">
                      {selectedRankedFellows.map((fellow) => (
                        <div
                          key={fellow._id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 border border-amber-100"
                        >
                          <span className="text-xs font-bold text-neutral-700 truncate">
                            {fellow.firstName} {fellow.lastName}
                          </span>
                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider whitespace-nowrap">
                            Rank #{fellow.rank} / {fellow.totalPoints || 0} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {([
                    ["first", "Gold medal message", "Rank 1 / highest graded mentee"],
                    ["second", "Silver medal message", "Rank 2"],
                    ["third", "Bronze medal message", "Rank 3"],
                  ] as const).map(([key, label, helper]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="block text-xs font-black text-neutral-700 uppercase tracking-wider">
                        {label}
                      </label>
                      <textarea
                        rows={3}
                        value={rankingMessages[key]}
                        onChange={(e) =>
                          setRankingMessages((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-white border border-amber-100 focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all resize-none text-sm font-medium text-neutral-700 leading-relaxed"
                        placeholder={`Extra congratulatory note for ${helper}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Preview of what email looks like */}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                  <p className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                    <Award size={14} /> Email Preview Summary
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1 font-medium">
                    <li>🖼️ <strong>Header:</strong> NextIF Logo on dark navy background</li>
                    <li>🏅 <strong>Hero:</strong> Gold gradient with "Congratulations, [Name]!"</li>
                    <li>📸 <strong>Image:</strong> Graduation image centered below the banner</li>
                    <li>✉️ <strong>Body:</strong> Your custom message in amber highlighted block</li>
                    <li>📋 <strong>Footer:</strong> "What happens next?" + CTA button + dark footer</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end bg-neutral-50/30">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isLoading={isSubmitting}
                  onClick={handleGraduate}
                  className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                >
                  <Send size={15} className="mr-2" />
                  Confirm & Graduate {selectedIds.size} Fellow{selectedIds.size > 1 ? "s" : ""}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GraduationManagementPage;
