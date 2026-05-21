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
  Trophy
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

const CapstoneManagementPage = () => {
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"TEAMS" | "SUBMISSIONS">("SUBMISSIONS");
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [showOnlyShortlisted, setShowOnlyShortlisted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scores, setScores] = useState({
    relevance: 0,
    innovation: 0,
    clarity: 0,
    feasibility: 0,
    presentation: 0,
    remarks: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [teamsRes, subsRes] = await Promise.all([
        axiosInstance.get("/capstone/teams"),
        axiosInstance.get("/capstone/submissions")
      ]);
      setTeams(teamsRes.data.teams);
      setSubmissions(subsRes.data.submissions);
    } catch (error) {
      console.error("Error fetching capstone data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      await axiosInstance.post(`/capstone/submissions/${gradingSubmission._id}/grade`, scores);
      addToast("Submission graded successfully!", "success");
      setGradingSubmission(null);
      fetchData();
    } catch (error: any) {
      addToast(error.response?.data?.message || "Failed to grade submission", "error");
    }
  };

  const handleToggleShortlist = async (id: string) => {
    try {
      await axiosInstance.post(`/capstone/submissions/${id}/shortlist`);
      addToast("Shortlist status updated", "success");
      fetchData();
    } catch (error: any) {
      addToast("Failed to update shortlist status", "error");
    }
  };

  const totalScore = scores.relevance + scores.innovation + scores.clarity + scores.feasibility + scores.presentation;

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.content?.projectTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShortlist = showOnlyShortlisted ? sub.shortlisted : true;
    return matchesSearch && matchesShortlist;
  });

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.founder.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalTeams: teams.length,
    totalSubmissions: submissions.length,
    shortlisted: submissions.filter(s => s.shortlisted).length,
    pendingGrading: submissions.filter(s => !s.score).length
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      addToast("No submissions to export", "error");
      return;
    }

    const headers = [
      "Team Name", "Stage", "Founder", "Members", "Project Title", "Problem Summary", "Document Link",
      "Relevance", "Innovation", "Clarity", "Feasibility", "Presentation", "Total Score", "Status", "Shortlisted", "Remarks"
    ];

    const rows = submissions.map(sub => {
      const founderName = sub.team.founder ? `${sub.team.founder.firstName} ${sub.team.founder.lastName}` : "N/A";
      const otherMembers = (sub.team.members || []).filter(m => m.email !== sub.team.founder?.email).map(m => `${m.firstName} ${m.lastName}`).join(" | ");
      const docLink = sub.stage === "PROPOSAL" ? sub.content?.proposalDocUrl : sub.content?.pitchDeckUrl;

      return [
        `"${sub.team?.name || "Unknown"}"`,
        `"${sub.stage || "N/A"}"`,
        `"${founderName}"`,
        `"${otherMembers || "none"}"`,
        `"${sub.content?.projectTitle || "N/A"}"`,
        `"${(sub.content?.problemStatement || "N/A").replace(/"/g, '""')}"`,
        `"${docLink || "N/A"}"`,
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

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `capstone_report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Capstone Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Manage project formations, evaluate submissions, and shortlist innovation.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black font-heading text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
        >
          <Download size={18} /> Export Full Report
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Teams", value: stats.totalTeams, icon: Users, color: "blue" },
          { label: "Submissions", value: stats.totalSubmissions, icon: FileText, color: "indigo" },
          { label: "Shortlisted", value: stats.shortlisted, icon: Trophy, color: "amber" },
          { label: "Pending Grade", value: stats.pendingGrading, icon: Clock, color: "rose" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                  stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                    "bg-rose-50 text-rose-600"
            )}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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

          <div className="flex items-center gap-3 w-full md:w-auto">
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
      </div>

      {/* Main Content */}
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
                filteredSubmissions.map((sub) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={sub._id}
                    className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col h-full"
                  >
                    {/* Card Header */}
                    <div className="p-6 pb-4 border-b border-slate-50 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                            sub.stage === "PROPOSAL" ? "bg-blue-600 shadow-blue-200" : "bg-purple-600 shadow-purple-200"
                          )}>
                            <Rocket size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.stage.replace("_", " ")}</p>
                            <h3 className="font-black text-slate-900 leading-tight line-clamp-1">{sub.team.name}</h3>
                          </div>
                        </div>
                        {sub.shortlisted && (
                          <div className="bg-amber-100 text-amber-700 p-2 rounded-xl">
                            <Award size={18} />
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-700 text-sm mb-2 line-clamp-1">
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
                              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200" />
                              <circle
                                cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                                strokeDasharray={125.6}
                                strokeDashoffset={125.6 - (125.6 * sub.score.total) / 100}
                                className={cn(sub.score.passed ? "text-green-500" : "text-rose-500")}
                              />
                            </svg>
                            <span className="absolute text-[10px] font-black">{sub.score.total}%</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                            <p className={cn("text-xs font-bold", sub.score.passed ? "text-green-600" : "text-rose-600")}>
                              {sub.score.passed ? "Passed Threshold" : "Needs Review"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 py-2">
                          <Clock className="text-rose-400" size={20} />
                          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Pending Evaluation</p>
                        </div>
                      )}

                      <div className="flex -space-x-2">
                        {sub.team.members.slice(0, 2).map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-700">
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

                    {/* Card Footer - Actions */}
                    <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                      <button
                        onClick={() => handleToggleShortlist(sub._id)}
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
                        onClick={() => {
                          setGradingSubmission(sub);
                          setScores({
                            relevance: sub.score?.relevance || 0,
                            innovation: sub.score?.innovation || 0,
                            clarity: sub.score?.clarity || 0,
                            feasibility: sub.score?.feasibility || 0,
                            presentation: sub.score?.presentation || 0,
                            remarks: sub.score?.remarks || ""
                          });
                        }}
                        className="py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black font-heading shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                      >
                        {sub.score ? "View/Edit Grade" : "Evaluate Now"}
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-black text-slate-900">No submissions found</h3>
                  <p className="text-slate-500 font-medium mt-1">Adjust your search or filters to see more results.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
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
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm uppercase group-hover:scale-110 transition-transform">
                            {t.name[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 font-heading">{t.name}</p>
                            <p className="text-xs text-slate-400 font-medium">Founder: {t.founder.firstName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                          {t.track?.split(' ')[0] || "Innovation"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">{t.members.length} Members</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                          t.status === "OPEN" ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
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

      {/* Grading Modal */}
      <AnimatePresence>
        {gradingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGradingSubmission(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                    <CheckCircle size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-heading text-slate-900 tracking-tight">Project Evaluation</h2>
                    <p className="text-slate-500 font-medium">Reviewing: {gradingSubmission.team.name}</p>
                  </div>
                </div>
                <button onClick={() => setGradingSubmission(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm">
                  <XCircle size={32} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Project Brief */}
                <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50 flex flex-col sm:flex-row gap-6 items-center">
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Project Title</h4>
                    <p className="font-bold text-slate-900 text-lg leading-tight">{gradingSubmission.content.projectTitle}</p>
                  </div>
                  <a
                    href={gradingSubmission.stage === "PROPOSAL" ? gradingSubmission.content.proposalDocUrl : gradingSubmission.content.pitchDeckUrl}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 shrink-0"
                  >
                    <ExternalLink size={16} /> View Artifact
                  </a>
                </div>

                <form onSubmit={handleGrade} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: "Islamic Finance Relevance", max: 25, key: "relevance" },
                      { label: "Innovation Component", max: 25, key: "innovation" },
                      { label: "Clarity & Depth", max: 20, key: "clarity" },
                      { label: "Execution Feasibility", max: 15, key: "feasibility" },
                      { label: "Presentation Quality", max: 15, key: "presentation" }
                    ].map((f) => (
                      <div key={f.key} className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label} (max {f.max})</label>
                        <input
                          type="number"
                          max={f.max} min={0}
                          required
                          className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all font-black text-slate-900"
                          value={scores[f.key as keyof typeof scores] || 0}
                          onChange={e => setScores({ ...scores, [f.key]: Number(e.target.value) })}
                        />
                      </div>
                    ))}
                    <div className="flex flex-col justify-end">
                      <div className={cn(
                        "p-5 rounded-2xl flex items-center justify-between border",
                        totalScore >= 70 ? "bg-green-50 border-green-100" : "bg-rose-50 border-rose-100"
                      )}>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Aggregate</p>
                          <p className={cn("text-3xl font-black", totalScore >= 70 ? "text-green-600" : "text-rose-600")}>{totalScore}%</p>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          totalScore >= 70 ? "bg-green-600 text-white" : "bg-rose-600 text-white"
                        )}>
                          {totalScore >= 70 ? "Passed" : "Failed"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Reviewer Remarks</label>
                    <textarea
                      required
                      className="w-full px-5 py-4 rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all font-medium text-slate-700 min-h-[120px]"
                      value={scores.remarks}
                      onChange={e => setScores({ ...scores, remarks: e.target.value })}
                      placeholder="Provide detailed feedback for the team..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black font-heading text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                  >
                    Commit Evaluation & Notify Team
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CapstoneManagementPage;
