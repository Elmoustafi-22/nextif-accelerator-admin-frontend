import { useState, useEffect } from "react";
import { Search, Clock, Rocket } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { cn } from "../utils/cn";

interface LeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
  accountStatus: string;
  taskPoints: number;
  attendancePoints: number;
  totalPoints: number;
  rank: number;
}

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

const LeaderboardPage = () => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Project Rankings state (Option B)
  const [activeMainTab, setActiveMainTab] = useState<"INDIVIDUAL" | "PROJECTS">("INDIVIDUAL");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectStage, setProjectStage] = useState<"PROPOSAL" | "PITCH_DECK">("PROPOSAL");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (activeMainTab === "PROJECTS" && submissions.length === 0) {
      fetchSubmissions();
    }
  }, [activeMainTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/leaderboard");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoadingProjects(true);
      const res = await axiosInstance.get("/capstone/submissions");
      setSubmissions(res.data.submissions || []);
    } catch (error) {
      console.error("Error fetching capstone submissions:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const getTeamLogoUrl = (sub: Submission) => {
    if (sub.content?.logoUrl) return sub.content.logoUrl;
    const otherSub = submissions.find(
      (s) => s.team?._id === sub.team?._id && s.content?.logoUrl
    );
    return otherSub?.content?.logoUrl || null;
  };

  const formatLogoUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return url;
    return `/${url}`;
  };

  const getProjectTitle = (sub: Submission) => {
    if (sub.content?.projectTitle) return sub.content.projectTitle;
    const otherSub = submissions.find(
      (s) => s.team?._id === sub.team?._id && s.content?.projectTitle
    );
    return otherSub?.content?.projectTitle || sub.team?.name || "Untitled Project";
  };

  const getRankedProjects = () => {
    const stageSubs = submissions.filter((sub) => sub.stage === projectStage);

    // Sort by total score descending, put ungraded ones at the end
    const sorted = [...stageSubs].sort((a, b) => {
      const scoreA = a.score?.total ?? -1;
      const scoreB = b.score?.total ?? -1;
      return scoreB - scoreA;
    });

    let currentRank = 1;
    return sorted.map((sub, index) => {
      if (index > 0) {
        const prevSub = sorted[index - 1];
        const prevScore = prevSub.score?.total ?? -1;
        const currScore = sub.score?.total ?? -1;
        if (currScore !== prevScore) {
          currentRank = index + 1;
        }
      }
      return {
        ...sub,
        rank: sub.score ? currentRank : null,
      };
    });
  };

  const filteredData = data.filter((entry) =>
    `${entry.firstName} ${entry.lastName} ${entry.email} ${entry.institution}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const rankedProjects = getRankedProjects();
  const filteredProjects = rankedProjects.filter((sub) => {
    const title = getProjectTitle(sub).toLowerCase();
    const teamName = (sub.team?.name || "").toLowerCase();
    const founderName = `${sub.team?.founder?.firstName || ""} ${sub.team?.founder?.lastName || ""}`.toLowerCase();
    const membersNames = (sub.team?.members || [])
      .map((m) => `${m.firstName} ${m.lastName}`)
      .join(" ")
      .toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      title.includes(search) ||
      teamName.includes(search) ||
      founderName.includes(search) ||
      membersNames.includes(search)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight">
            Leaderboard Rankings
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-lg mt-1">
            Track and compare performance across individuals and projects.
          </p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto self-start border border-slate-200/40">
        <button
          onClick={() => setActiveMainTab("INDIVIDUAL")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black font-heading transition-all cursor-pointer",
            activeMainTab === "INDIVIDUAL"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Individual Mentees
        </button>
        <button
          onClick={() => setActiveMainTab("PROJECTS")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black font-heading transition-all cursor-pointer",
            activeMainTab === "PROJECTS"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Capstone Projects
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder={
              activeMainTab === "INDIVIDUAL"
                ? "Search by name, email, or institution..."
                : "Search by title, team, or members..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 md:h-12 pl-12 pr-4 bg-slate-50 border-transparent rounded-xl md:rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-600/5 focus:bg-white transition-all focus:outline-none border border-transparent focus:border-indigo-600/20"
          />
        </div>

        {/* Stage Toggle for Projects */}
        {activeMainTab === "PROJECTS" && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setProjectStage("PROPOSAL")}
              className={cn(
                "flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer",
                projectStage === "PROPOSAL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Proposal Stage
            </button>
            <button
              onClick={() => setProjectStage("PITCH_DECK")}
              className={cn(
                "flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer",
                projectStage === "PITCH_DECK"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Pitch Deck Stage
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard Table / Content */}
      <div className="bg-white rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        {activeMainTab === "INDIVIDUAL" ? (
          <>
            {/* Desktop View (Individual) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400">
                      Rank
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400">
                      Mentee
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400">
                      Institution
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400 text-center">
                      Task XP
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400 text-center">
                      Attendance XP
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-indigo-600 text-right">
                      Total XP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-6 px-8"><div className="w-8 h-8 bg-slate-100 rounded-full" /></td>
                        <td className="py-6 px-8">
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-32" />
                            <div className="h-3 bg-slate-100 rounded w-24" />
                          </div>
                        </td>
                        <td className="py-6 px-8"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                        <td className="py-6 px-8 text-center"><div className="h-6 bg-slate-100 rounded w-12 mx-auto" /></td>
                        <td className="py-6 px-8 text-center"><div className="h-6 bg-slate-100 rounded w-12 mx-auto" /></td>
                        <td className="py-6 px-8 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Results Detected</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-3">
                            {entry.rank <= 3 ? (
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm",
                                entry.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                entry.rank === 2 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                                "bg-orange-100 text-orange-700 border border-orange-200"
                              )}>
                                {entry.rank}
                              </div>
                            ) : (
                              <span className="text-base font-black font-heading text-slate-400 w-8 text-center">
                                #{entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <div>
                            <div className="font-black font-heading text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                              {entry.firstName} {entry.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{entry.email}</div>
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <span className="text-xs text-slate-500 font-black uppercase tracking-widest truncate max-w-[200px] block">
                            {entry.institution}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-center">
                          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 shadow-sm">
                            {entry.taskPoints}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-center">
                          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 shadow-sm">
                            {entry.attendancePoints}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <span className="text-2xl font-black font-heading text-slate-900 tracking-tighter">
                            {entry.totalPoints}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Individual) */}
            <div className="md:hidden divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-5 animate-pulse space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                        <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                      </div>
                      <div className="h-8 w-12 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))
              ) : filteredData.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No Operational Records</p>
                </div>
              ) : (
                filteredData.map((entry) => (
                  <div key={entry.id} className="p-5 active:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black text-xs shadow-sm",
                        entry.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                        entry.rank === 2 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                        entry.rank === 3 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                        "bg-slate-50 text-slate-400 border border-slate-100"
                      )}>
                        {entry.rank <= 3 ? entry.rank : `#${entry.rank}`}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black font-heading text-slate-900 uppercase tracking-tight truncate">
                          {entry.firstName} {entry.lastName}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">
                          {entry.institution}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-indigo-100/50">
                          T: {entry.taskPoints}
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-100/50">
                          A: {entry.attendancePoints}
                        </div>
                      </div>
                      <div className="text-xl font-black font-heading text-slate-900 tracking-tighter">
                        {entry.totalPoints} XP
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Desktop View (Project Rankings) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400">
                      Rank
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400">
                      Project & Team
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400">
                      Team Lead & Members
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-slate-400 text-center">
                      Detailed Scores
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black font-heading uppercase tracking-[0.2em] text-indigo-600 text-right">
                      Grade & Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingProjects ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-6 px-8"><div className="w-8 h-8 bg-slate-100 rounded-full" /></td>
                        <td className="py-6 px-8">
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-40" />
                            <div className="h-3 bg-slate-100 rounded w-24" />
                          </div>
                        </td>
                        <td className="py-6 px-8"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                        <td className="py-6 px-8 text-center"><div className="h-6 bg-slate-100 rounded w-32 mx-auto" /></td>
                        <td className="py-6 px-8 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Ranked Projects Found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((sub) => {
                      const logoUrl = getTeamLogoUrl(sub);
                      const hasLogo = !!logoUrl;
                      return (
                        <tr
                          key={sub._id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-3">
                              {sub.rank !== null && sub.rank <= 3 ? (
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm",
                                  sub.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                  sub.rank === 2 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                                  "bg-orange-100 text-orange-700 border border-orange-200"
                                )}>
                                  {sub.rank}
                                </div>
                              ) : (
                                <span className="text-base font-black font-heading text-slate-400 w-8 text-center">
                                  {sub.rank !== null ? `#${sub.rank}` : "-"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-3">
                              {hasLogo ? (
                                <img
                                  src={formatLogoUrl(logoUrl)}
                                  alt="Logo"
                                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                                  <Rocket className="text-slate-400" size={18} />
                                </div>
                              )}
                              <div>
                                <div className="font-black font-heading text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">
                                  {getProjectTitle(sub)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                  Team: {sub.team?.name || "Independent"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div>
                              <span className="text-xs text-slate-700 font-bold block">
                                Lead: {sub.team?.founder?.firstName} {sub.team?.founder?.lastName}
                              </span>
                              <div className="flex -space-x-1.5 mt-1.5">
                                {sub.team?.members?.map((member, i) => (
                                  <div
                                    key={i}
                                    className="w-5 h-5 rounded-full bg-indigo-50 border border-white flex items-center justify-center text-[8px] font-black text-indigo-700"
                                    title={`${member.firstName} ${member.lastName}`}
                                  >
                                    {member.firstName[0]}{member.lastName[0]}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-8 text-center">
                            {sub.score ? (
                              <div className="flex flex-wrap gap-1.5 justify-center max-w-[300px] mx-auto">
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-black tracking-wide border border-slate-100" title="Relevance (25%)">R: {sub.score.relevance}</span>
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-black tracking-wide border border-slate-100" title="Innovation (25%)">I: {sub.score.innovation}</span>
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-black tracking-wide border border-slate-100" title="Clarity (20%)">C: {sub.score.clarity}</span>
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-black tracking-wide border border-slate-100" title="Feasibility (15%)">F: {sub.score.feasibility}</span>
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-black tracking-wide border border-slate-100" title="Presentation (15%)">P: {sub.score.presentation}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Scores Pending
                              </span>
                            )}
                          </td>
                          <td className="py-5 px-8 text-right">
                            {sub.score ? (
                              <div className="text-right">
                                <span className={cn(
                                  "text-2xl font-black font-heading tracking-tighter block",
                                  sub.score.passed ? "text-green-600" : "text-rose-600"
                                )}>
                                  {sub.score.total}%
                                </span>
                                <span className={cn(
                                  "inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                  sub.score.passed ? "bg-green-50 text-green-700 border border-green-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                                )}>
                                  {sub.score.passed ? "Passed" : "Needs Review"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 justify-end text-rose-500 font-bold text-xs uppercase tracking-wider">
                                <Clock size={14} className="text-rose-400" />
                                <span>Pending</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Project Rankings) */}
            <div className="md:hidden divide-y divide-slate-50">
              {loadingProjects ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-5 animate-pulse space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                      <div className="h-8 w-12 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))
              ) : filteredProjects.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No Projects Graded Yet</p>
                </div>
              ) : (
                filteredProjects.map((sub) => (
                  <div key={sub._id} className="p-5 active:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={cn(
                        "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black text-xs shadow-sm",
                        sub.rank !== null && sub.rank <= 3 ? (
                          sub.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                          sub.rank === 2 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                          "bg-orange-100 text-orange-700 border border-orange-200"
                        ) : "bg-slate-50 text-slate-400 border border-slate-100"
                      )}>
                        {sub.rank ? (sub.rank <= 3 ? sub.rank : `#${sub.rank}`) : "-"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black font-heading text-slate-900 uppercase tracking-tight truncate leading-tight">
                          {getProjectTitle(sub)}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate mt-0.5">
                          Team: {sub.team?.name || "Independent"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Lead: {sub.team?.founder?.firstName} {sub.team?.founder?.lastName?.[0]}.
                      </div>
                      <div>
                        {sub.score ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black font-heading text-slate-900 tracking-tighter">
                              {sub.score.total}%
                            </span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest",
                              sub.score.passed ? "text-green-600" : "text-rose-600"
                            )}>
                              ({sub.score.passed ? "Passed" : "Failed"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
