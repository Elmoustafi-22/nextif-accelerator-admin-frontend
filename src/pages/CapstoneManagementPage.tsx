import { useState, useEffect } from "react";
import {
  FileText,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Award,
  ExternalLink,
  Download,
  Search,
  ChevronRight,
  Rocket,
  Clock,
  Trophy,
  Filter,
  Target,
  Lightbulb,
  Leaf,
  TrendingUp,
  Globe,
  User,
  Star
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useToastStore } from "../store/useToastStore";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "framer-motion";

interface Team {
  _id: string;
  name: string;
  founder: { firstName: string; lastName: string; email: string };
  members: { firstName: string; lastName: string; email: string }[];
  segment: string;
  track: string;
  status: string;
}

interface Submission {
  _id: string;
  team: Team;
  stage: "PROPOSAL" | "PITCH_DECK";
  content: any;
  shortlisted: boolean;
  score?: {
    relevance: number;
    innovation: number;
    clarity: number;
    feasibility: number;
    presentation: number;
    total: number;
    passed: boolean;
    remarks: string;
  };
  createdAt: string;
}

type StageFilter = "ALL" | "PROPOSAL" | "PITCH_DECK";

const CapstoneManagementPage = () => {
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"TEAMS" | "SUBMISSIONS">("SUBMISSIONS");
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [showOnlyShortlisted, setShowOnlyShortlisted] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [scores, setScores] = useState({
    relevance: 0,
    innovation: 0,
    clarity: 0,
    feasibility: 0,
    presentation: 0,
    remarks: ""
  });

  const [proposalDeadline, setProposalDeadline] = useState("2026-06-03T23:59");
  const [pitchDeckDeadline, setPitchDeckDeadline] = useState("2026-06-11T23:59");
  const [isSavingProposal, setIsSavingProposal] = useState(false);
  const [isSavingPitchDeck, setIsSavingPitchDeck] = useState(false);

  const [maxGroupMembers, setMaxGroupMembers] = useState(5);
  const [isSavingGroupSize, setIsSavingGroupSize] = useState(false);

  const toDateTimeLocalString = (dateInput: any) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fetchDeadlines = async () => {
    try {
      const res = await axiosInstance.get("/capstone/deadlines");
      const list = res.data.deadlines || [];
      const proposal = list.find((d: any) => d.stage === "PROPOSAL");
      const pitch = list.find((d: any) => d.stage === "PITCH_DECK");
      if (proposal) setProposalDeadline(toDateTimeLocalString(proposal.deadline));
      if (pitch) setPitchDeckDeadline(toDateTimeLocalString(pitch.deadline));
    } catch (err) {
      console.error("Failed to fetch deadlines:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get("/settings");
      if (res.data.capstoneGroupMaxMembers) {
        setMaxGroupMembers(res.data.capstoneGroupMaxMembers);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleUpdateGroupSize = async () => {
    if (maxGroupMembers < 1 || maxGroupMembers > 20) {
      addToast("Group size must be between 1 and 20", "error");
      return;
    }
    setIsSavingGroupSize(true);
    try {
      await axiosInstance.put("/settings", { capstoneGroupMaxMembers: maxGroupMembers });
      addToast("Capstone group size updated successfully!", "success");
    } catch (error: any) {
      addToast(error.response?.data?.message || "Failed to update group size", "error");
    } finally {
      setIsSavingGroupSize(false);
    }
  };

  const handleUpdateDeadline = async (stage: "PROPOSAL" | "PITCH_DECK", deadlineStr: string) => {
    if (stage === "PROPOSAL") setIsSavingProposal(true);
    else setIsSavingPitchDeck(true);
    try {
      await axiosInstance.post("/capstone/deadlines", {
        stage,
        deadline: new Date(deadlineStr).toISOString()
      });
      addToast(`${stage === "PROPOSAL" ? "Proposal" : "Pitch Deck"} deadline updated successfully!`, "success");
    } catch (error: any) {
      addToast(error.response?.data?.message || "Failed to update deadline", "error");
    } finally {
      if (stage === "PROPOSAL") setIsSavingProposal(false);
      else setIsSavingPitchDeck(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [teamsRes, subsRes] = await Promise.all([
        axiosInstance.get("/capstone/teams"),
        axiosInstance.get("/capstone/submissions"),
        fetchDeadlines(),
        fetchSettings()
      ]);
      setTeams(teamsRes.data.teams);
      setSubmissions(subsRes.data.submissions);
    } catch (error) {
      console.error("Error fetching capstone data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (sub: Submission) => {
    setViewingSubmission(sub);
    setScores({
      relevance: sub.score?.relevance || 0,
      innovation: sub.score?.innovation || 0,
      clarity: sub.score?.clarity || 0,
      feasibility: sub.score?.feasibility || 0,
      presentation: sub.score?.presentation || 0,
      remarks: sub.score?.remarks || ""
    });
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingSubmission) return;
    try {
      await axiosInstance.post(`/capstone/submissions/${viewingSubmission._id}/grade`, scores);
      addToast("Submission graded successfully!", "success");
      setViewingSubmission(null);
      fetchData();
    } catch (error: any) {
      addToast(error.response?.data?.message || "Failed to grade submission", "error");
    }
  };

  const handleToggleShortlist = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axiosInstance.post(`/capstone/submissions/${id}/shortlist`);
      addToast("Shortlist status updated", "success");
      fetchData();
    } catch (error: any) {
      addToast("Failed to update shortlist status", "error");
    }
  };

  const getTeamLogoUrl = (sub: Submission) => {
    if (sub.content?.logoUrl) return sub.content.logoUrl;
    const otherSub = submissions.find(
      (s) => s.team._id === sub.team._id && s.content?.logoUrl
    );
    return otherSub?.content?.logoUrl || null;
  };

  const totalScore =
    scores.relevance + scores.innovation + scores.clarity + scores.feasibility + scores.presentation;

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.content?.projectTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShortlist = showOnlyShortlisted ? sub.shortlisted : true;
    const matchesStage = stageFilter === "ALL" ? true : sub.stage === stageFilter;
    return matchesSearch && matchesShortlist && matchesStage;
  });

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.founder.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalTeams: teams.length,
    totalSubmissions: submissions.length,
    shortlisted: submissions.filter((s) => s.shortlisted).length,
    pendingGrading: submissions.filter((s) => !s.score).length
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      addToast("No submissions to export", "error");
      return;
    }
    const headers = [
      "Team Name", "Stage", "Founder", "Members", "Project Title", "Problem Summary",
      "Logo URL", "Proposal Doc", "Pitch Deck",
      "Relevance", "Innovation", "Clarity", "Feasibility", "Presentation",
      "Total Score", "Status", "Shortlisted", "Remarks"
    ];
    const rows = submissions.map((sub) => {
      const founderName = sub.team.founder
        ? `${sub.team.founder.firstName} ${sub.team.founder.lastName}`
        : "N/A";
      const otherMembers = (sub.team.members || [])
        .filter((m) => m.email !== sub.team.founder?.email)
        .map((m) => `${m.firstName} ${m.lastName}`)
        .join(" | ");
      return [
        `"${sub.team?.name || "Unknown"}"`,
        `"${sub.stage || "N/A"}"`,
        `"${founderName}"`,
        `"${otherMembers || "none"}"`,
        `"${sub.content?.projectTitle || "N/A"}"`,
        `"${(sub.content?.problemStatement || "N/A").replace(/"/g, '""')}"`,
        `"${sub.content?.logoUrl || "N/A"}"`,
        `"${sub.content?.proposalDocUrl || "N/A"}"`,
        `"${sub.content?.pitchDeckUrl || "N/A"}"`,
        sub.score?.relevance || 0,
        sub.score?.innovation || 0,
        sub.score?.clarity || 0,
        sub.score?.feasibility || 0,
        sub.score?.presentation || 0,
        sub.score?.total || 0,
        sub.score ? (sub.score.passed ? "PASSED" : "FAILED") : "PENDING",
        sub.shortlisted ? "YES" : "NO",
        `"${(sub.score?.remarks || "N/A").replace(/"/g, '""')}"`
      ];
    });
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `capstone_report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Detail field renderer ────────────────────────────────────────────────
  const DetailField = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => {
    if (!value) return null;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-indigo-400 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed pl-5">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Capstone Hub</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage project formations, evaluate submissions, and shortlist innovation.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black font-heading text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
        >
          <Download size={18} /> Export Full Report
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Teams", value: stats.totalTeams, icon: Users, color: "blue" },
          { label: "Submissions", value: stats.totalSubmissions, icon: FileText, color: "indigo" },
          { label: "Shortlisted", value: stats.shortlisted, icon: Trophy, color: "amber" },
          { label: "Pending Grade", value: stats.pendingGrading, icon: Clock, color: "rose" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                stat.color === "blue"
                  ? "bg-blue-50 text-blue-600"
                  : stat.color === "indigo"
                    ? "bg-indigo-50 text-indigo-600"
                    : stat.color === "amber"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-rose-50 text-rose-600"
              )}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Deadlines Settings ── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="text-indigo-600" size={20} />
          <h2 className="text-lg font-black text-slate-900">Capstone Deadlines Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Stage I: Proposal Deadline
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={proposalDeadline}
                onChange={(e) => setProposalDeadline(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
              />
              <button
                onClick={() => handleUpdateDeadline("PROPOSAL", proposalDeadline)}
                disabled={isSavingProposal}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center min-w-[80px]"
              >
                {isSavingProposal ? <Loader2 size={16} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Stage II: Pitch Deck Deadline
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={pitchDeckDeadline}
                onChange={(e) => setPitchDeckDeadline(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
              />
              <button
                onClick={() => handleUpdateDeadline("PITCH_DECK", pitchDeckDeadline)}
                disabled={isSavingPitchDeck}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center min-w-[80px]"
              >
                {isSavingPitchDeck ? <Loader2 size={16} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Group Size Settings ── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          <h2 className="text-lg font-black text-slate-900">Capstone Group Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Max Members Per Group
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Set the maximum number of people allowed in each capstone group
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="20"
                value={maxGroupMembers}
                onChange={(e) => setMaxGroupMembers(parseInt(e.target.value) || 5)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium"
              />
              <button
                onClick={handleUpdateGroupSize}
                disabled={isSavingGroupSize}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center min-w-[80px]"
              >
                {isSavingGroupSize ? <Loader2 size={16} className="animate-spin" /> : "Save"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Current setting: <span className="font-bold text-slate-700">{maxGroupMembers} members</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs & Filters ── */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
            {(["SUBMISSIONS", "TEAMS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black font-heading transition-all",
                  activeTab === tab
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab === "SUBMISSIONS" ? "Submissions & Grading" : "Teams Directory"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search projects or teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all font-medium text-sm shadow-sm"
              />
            </div>

            {/* Stage filter */}
            {activeTab === "SUBMISSIONS" && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(["ALL", "PROPOSAL", "PITCH_DECK"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStageFilter(f)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-[11px] font-black transition-all whitespace-nowrap",
                      stageFilter === f
                        ? f === "PROPOSAL"
                          ? "bg-blue-600 text-white shadow-sm"
                          : f === "PITCH_DECK"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-white text-slate-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {f === "ALL" ? "All Types" : f === "PROPOSAL" ? "Proposal" : "Pitch Deck"}
                  </button>
                ))}
              </div>
            )}

            {/* Shortlisted filter */}
            {activeTab === "SUBMISSIONS" && (
              <button
                onClick={() => setShowOnlyShortlisted(!showOnlyShortlisted)}
                className={cn(
                  "p-3 rounded-2xl border transition-all flex items-center gap-2 font-black font-heading text-xs",
                  showOnlyShortlisted
                    ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100"
                    : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                )}
              >
                <Award size={18} className={showOnlyShortlisted ? "text-amber-500" : "text-slate-400"} />
                <span className="hidden sm:inline">Shortlisted Only</span>
              </button>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {activeTab === "SUBMISSIONS" && (stageFilter !== "ALL" || showOnlyShortlisted) && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Active filters:</span>
            {stageFilter !== "ALL" && (
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 cursor-pointer",
                  stageFilter === "PROPOSAL"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                )}
                onClick={() => setStageFilter("ALL")}
              >
                {stageFilter === "PROPOSAL" ? "Proposal" : "Pitch Deck"} ×
              </span>
            )}
            {showOnlyShortlisted && (
              <span
                className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 flex items-center gap-1 cursor-pointer"
                onClick={() => setShowOnlyShortlisted(false)}
              >
                Shortlisted Only ×
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-500 font-bold animate-pulse">Gathering project data...</p>
          </div>
        ) : activeTab === "SUBMISSIONS" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => {
                  const logoUrl = getTeamLogoUrl(sub);
                  const hasLogo = !!logoUrl;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={sub._id}
                      onClick={() => openModal(sub)}
                      className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col h-full cursor-pointer"
                    >
                      {/* Logo banner if available */}
                      {hasLogo && (
                        <div className="h-28 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center border-b border-slate-100 relative">
                          <img
                            src={logoUrl}
                            alt={`${sub.team.name} logo`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          {/* Stage badge overlay */}
                          <span
                            className={cn(
                              "absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow",
                              sub.stage === "PROPOSAL" ? "bg-blue-600" : "bg-purple-600"
                            )}
                          >
                            {sub.stage.replace("_", " ")}
                          </span>
                          {sub.shortlisted && (
                            <div className="absolute top-3 right-3 bg-amber-400 text-white p-1.5 rounded-lg shadow">
                              <Award size={14} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Header */}
                      <div className="p-6 pb-4 border-b border-slate-50 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {!hasLogo && (
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0",
                                  sub.stage === "PROPOSAL"
                                    ? "bg-blue-600 shadow-blue-200"
                                    : "bg-purple-600 shadow-purple-200"
                                )}
                              >
                                <Rocket size={18} />
                              </div>
                            )}
                            <div>
                              {!hasLogo && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {sub.stage.replace("_", " ")}
                                </p>
                              )}
                              <h3 className="font-black text-slate-900 leading-tight line-clamp-1">
                                {sub.team.name}
                              </h3>
                            </div>
                          </div>
                          {!hasLogo && sub.shortlisted && (
                            <div className="bg-amber-100 text-amber-700 p-2 rounded-xl shrink-0">
                              <Award size={16} />
                            </div>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-700 text-sm mb-1.5 line-clamp-1">
                          {sub.content?.projectTitle || "Untitled Project"}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                          {sub.content?.problemStatement || "No problem statement provided yet."}
                        </p>
                      </div>

                      {/* Card Body - Scores */}
                      <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between">
                        {sub.score ? (
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                              <svg className="w-12 h-12 transform -rotate-90">
                                <circle
                                  cx="24" cy="24" r="20"
                                  stroke="currentColor" strokeWidth="4" fill="transparent"
                                  className="text-slate-200"
                                />
                                <circle
                                  cx="24" cy="24" r="20"
                                  stroke="currentColor" strokeWidth="4" fill="transparent"
                                  strokeDasharray={125.6}
                                  strokeDashoffset={125.6 - (125.6 * sub.score.total) / 100}
                                  className={cn(sub.score.passed ? "text-green-500" : "text-rose-500")}
                                />
                              </svg>
                              <span className="absolute text-[10px] font-black">{sub.score.total}%</span>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Performance
                              </p>
                              <p className={cn("text-xs font-bold", sub.score.passed ? "text-green-600" : "text-rose-600")}>
                                {sub.score.passed ? "Passed Threshold" : "Needs Review"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 py-2">
                            <Clock className="text-rose-400" size={20} />
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                              Pending Evaluation
                            </p>
                          </div>
                        )}

                        <div className="flex -space-x-2">
                          {sub.team.members.slice(0, 2).map((m, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-700"
                            >
                              {m.firstName[0]}{m.lastName[0]}
                            </div>
                          ))}
                          {sub.team.members.length > 2 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">
                              +{sub.team.members.length - 2}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                        <button
                          onClick={(e) => handleToggleShortlist(sub._id, e)}
                          className={cn(
                            "py-2.5 rounded-xl text-xs font-black font-heading transition-all border",
                            sub.shortlisted
                              ? "bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-200 hover:bg-amber-700"
                              : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                          )}
                        >
                          {sub.shortlisted ? "Un-Shortlist" : "Shortlist"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(sub); }}
                          className="py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black font-heading shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                        >
                          {sub.score ? "View / Edit Grade" : "Evaluate Now"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-black text-slate-900">No submissions found</h3>
                  <p className="text-slate-500 font-medium mt-1">
                    Adjust your search or filters to see more results.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Teams Table */
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Focus Track</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Formation Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeams.map((t) => (
                    <tr key={t._id} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {submissions.find((s) => s.team._id === t._id && s.content?.logoUrl)?.content.logoUrl ? (
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform bg-white">
                              <img
                                src={submissions.find((s) => s.team._id === t._id && s.content?.logoUrl)!.content.logoUrl}
                                alt={`${t.name} logo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm uppercase group-hover:scale-110 transition-transform">
                              {t.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-900 font-heading">{t.name}</p>
                            <p className="text-xs text-slate-400 font-medium">Founder: {t.founder.firstName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                          {t.track?.split(" ")[0] || "Innovation"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">{t.members.length} Members</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                            t.status === "OPEN"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          Unified Detail + Grading Modal
          ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingSubmission(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
            >
              {/* ── Modal Header ── */}
              <div
                className={cn(
                  "p-7 pb-5 border-b border-slate-100 flex justify-between items-start shrink-0",
                  viewingSubmission.stage === "PROPOSAL"
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                    : "bg-gradient-to-r from-purple-50 to-fuchsia-50"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Logo or Stage Icon */}
                  {getTeamLogoUrl(viewingSubmission) ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg shrink-0 bg-white">
                      <img
                        src={getTeamLogoUrl(viewingSubmission)!}
                        alt="Project logo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.innerHTML =
                            `<div class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400"><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg></div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0",
                        viewingSubmission.stage === "PROPOSAL"
                          ? "bg-blue-600 shadow-blue-200"
                          : "bg-purple-600 shadow-purple-200"
                      )}
                    >
                      <Rocket size={28} />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white",
                          viewingSubmission.stage === "PROPOSAL" ? "bg-blue-600" : "bg-purple-600"
                        )}
                      >
                        {viewingSubmission.stage.replace("_", " ")}
                      </span>
                      {viewingSubmission.shortlisted && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-400 text-white flex items-center gap-1">
                          <Award size={10} /> Shortlisted
                        </span>
                      )}
                      {viewingSubmission.score && (
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white",
                            viewingSubmission.score.passed ? "bg-green-600" : "bg-rose-500"
                          )}
                        >
                          {viewingSubmission.score.passed ? "✓ Passed" : "✗ Failed"} · {viewingSubmission.score.total}%
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black font-heading text-slate-900 leading-tight">
                      {viewingSubmission.content?.projectTitle || "Untitled Project"}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">{viewingSubmission.team.name}</p>
                  </div>
                </div>

                <button
                  onClick={() => setViewingSubmission(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm shrink-0"
                >
                  <XCircle size={28} />
                </button>
              </div>

              {/* ── Modal Body ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-7 space-y-8">

                  {/* ── Team Members ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={15} className="text-indigo-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Team Members</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {viewingSubmission.team.members.map((m, i) => {
                        const isFounder = m.email === viewingSubmission.team.founder?.email;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm",
                              isFounder
                                ? "bg-indigo-50 border-indigo-100 text-indigo-800"
                                : "bg-slate-50 border-slate-100 text-slate-700"
                            )}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white",
                                isFounder ? "bg-indigo-600" : "bg-slate-400"
                              )}
                            >
                              {m.firstName[0]}{m.lastName[0]}
                            </div>
                            <span className="font-semibold">{m.firstName} {m.lastName}</span>
                            {isFounder && (
                              <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                                FOUNDER
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Track: <span className="font-bold text-slate-600">{viewingSubmission.team.track || "N/A"}</span>
                      &nbsp;·&nbsp; Segment: <span className="font-bold text-slate-600">{viewingSubmission.team.segment?.replace(/_/g, " ") || "N/A"}</span>
                    </p>
                  </div>

                  {/* ── Project Logo ── */}
                  {getTeamLogoUrl(viewingSubmission) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-indigo-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Project Logo</h3>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm animate-in fade-in duration-300">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                          <img
                            src={getTeamLogoUrl(viewingSubmission)!}
                            alt="Project Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Startup Brand Identity</p>
                          <a
                            href={getTeamLogoUrl(viewingSubmission)!}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 font-black text-xs hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> View Full Logo
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Project Details (Proposal fields) ── */}
                  {viewingSubmission.stage === "PROPOSAL" && (
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-5 border border-slate-100">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText size={13} className="text-indigo-400" /> Proposal Details
                      </h3>

                      <DetailField
                        icon={Target}
                        label="Problem Statement"
                        value={viewingSubmission.content?.problemStatement}
                      />
                      <DetailField
                        icon={Lightbulb}
                        label="Proposed Solution"
                        value={viewingSubmission.content?.proposedSolution}
                      />
                      <DetailField
                        icon={User}
                        label="Target Beneficiaries"
                        value={viewingSubmission.content?.targetBeneficiaries}
                      />
                      <DetailField
                        icon={Leaf}
                        label="Islamic Finance Relevance"
                        value={viewingSubmission.content?.islamicFinanceRelevance}
                      />
                      <DetailField
                        icon={Star}
                        label="Innovation Component"
                        value={viewingSubmission.content?.innovationComponent}
                      />
                      <DetailField
                        icon={TrendingUp}
                        label="Feasibility"
                        value={viewingSubmission.content?.feasibility}
                      />
                      <DetailField
                        icon={Globe}
                        label="Expected Impact"
                        value={viewingSubmission.content?.expectedImpact}
                      />
                    </div>
                  )}

                  {/* ── Documents ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ExternalLink size={13} className="text-indigo-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Submitted Documents</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {viewingSubmission.content?.proposalDocUrl && (
                        <a
                          href={viewingSubmission.content.proposalDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                        >
                          <FileText size={15} /> View Proposal Document
                        </a>
                      )}
                      {viewingSubmission.content?.pitchDeckUrl && (
                        <a
                          href={viewingSubmission.content.pitchDeckUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 transition-all shadow-md shadow-purple-100"
                        >
                          <Rocket size={15} /> View Pitch Deck
                        </a>
                      )}
                      {!viewingSubmission.content?.proposalDocUrl && !viewingSubmission.content?.pitchDeckUrl && (
                        <p className="text-sm text-slate-400 italic">No documents attached.</p>
                      )}
                    </div>
                  </div>

                  {/* ── Existing Score Breakdown (read-only) ── */}
                  {viewingSubmission.score && (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <CheckCircle size={13} className="text-green-400" /> Previous Grade Breakdown
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Relevance", value: viewingSubmission.score.relevance, max: 25 },
                          { label: "Innovation", value: viewingSubmission.score.innovation, max: 25 },
                          { label: "Clarity", value: viewingSubmission.score.clarity, max: 20 },
                          { label: "Feasibility", value: viewingSubmission.score.feasibility, max: 15 },
                          { label: "Presentation", value: viewingSubmission.score.presentation, max: 15 }
                        ].map((s) => (
                          <div key={s.label} className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                            <p className="text-xl font-black text-slate-900 mt-1">{s.value}</p>
                            <p className="text-[10px] text-slate-400">/ {s.max}</p>
                          </div>
                        ))}
                        <div
                          className={cn(
                            "bg-white rounded-xl p-3 border text-center",
                            viewingSubmission.score.passed ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"
                          )}
                        >
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
                          <p className={cn("text-xl font-black mt-1", viewingSubmission.score.passed ? "text-green-600" : "text-rose-600")}>
                            {viewingSubmission.score.total}%
                          </p>
                          <p className={cn("text-[10px] font-bold", viewingSubmission.score.passed ? "text-green-500" : "text-rose-500")}>
                            {viewingSubmission.score.passed ? "PASSED" : "FAILED"}
                          </p>
                        </div>
                      </div>
                      {viewingSubmission.score.remarks && (
                        <div className="mt-2 p-3 bg-white rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Remarks</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{viewingSubmission.score.remarks}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Grading Form ── */}
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                      <CheckCircle size={13} className="text-indigo-400" />
                      {viewingSubmission.score ? "Update Evaluation" : "Submit Evaluation"}
                    </h3>
                    <form onSubmit={handleGrade} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Islamic Finance Relevance", max: 25, key: "relevance" },
                          { label: "Innovation Component", max: 25, key: "innovation" },
                          { label: "Clarity & Depth", max: 20, key: "clarity" },
                          { label: "Execution Feasibility", max: 15, key: "feasibility" },
                          { label: "Presentation Quality", max: 15, key: "presentation" }
                        ].map((f) => (
                          <div key={f.key} className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {f.label} <span className="text-slate-300">(max {f.max})</span>
                            </label>
                            <input
                              type="number"
                              max={f.max}
                              min={0}
                              required
                              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all font-black text-slate-900"
                              value={scores[f.key as keyof typeof scores] || 0}
                              onChange={(e) => setScores({ ...scores, [f.key]: Number(e.target.value) })}
                            />
                          </div>
                        ))}

                        {/* Live total */}
                        <div className="flex flex-col justify-end">
                          <div
                            className={cn(
                              "p-4 rounded-2xl flex items-center justify-between border",
                              totalScore >= 70 ? "bg-green-50 border-green-100" : "bg-rose-50 border-rose-100"
                            )}
                          >
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total</p>
                              <p className={cn("text-3xl font-black", totalScore >= 70 ? "text-green-600" : "text-rose-600")}>
                                {totalScore}%
                              </p>
                            </div>
                            <div
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white",
                                totalScore >= 70 ? "bg-green-600" : "bg-rose-600"
                              )}
                            >
                              {totalScore >= 70 ? "Passed" : "Failed"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Reviewer Remarks
                        </label>
                        <textarea
                          required
                          className="w-full px-5 py-4 rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all font-medium text-slate-700 min-h-[100px] resize-none"
                          value={scores.remarks}
                          onChange={(e) => setScores({ ...scores, remarks: e.target.value })}
                          placeholder="Provide detailed feedback for the team..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 text-white py-4 rounded-[2rem] font-black font-heading text-base hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                      >
                        Commit Evaluation & Notify Team
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CapstoneManagementPage;
