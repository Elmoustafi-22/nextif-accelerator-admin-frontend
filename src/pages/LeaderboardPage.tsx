import { useState, useEffect } from "react";
import { Search } from "lucide-react";
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

const LeaderboardPage = () => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

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

  const filteredData = data.filter((entry) =>
    `${entry.firstName} ${entry.lastName} ${entry.email} ${entry.institution}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight">
            Leaderboard Rankings
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-lg mt-1">
            Track and compare mentee performance across tasks and attendance.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email, or institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 md:h-12 pl-12 pr-4 bg-slate-50 border-transparent rounded-xl md:rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-600/5 focus:bg-white transition-all focus:outline-none border border-transparent focus:border-indigo-600/20"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop View */}
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

        {/* Mobile View - Card Layout */}
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
      </div>
    </div>
  );
};

export default LeaderboardPage;
