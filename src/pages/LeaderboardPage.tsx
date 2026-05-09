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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
            Leaderboard Rankings
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Track and compare mentee performance across tasks and attendance.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/20 transition-all focus:outline-none"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-6 px-8 text-xs font-black font-heading uppercase tracking-widest text-slate-400">
                  Rank
                </th>
                <th className="py-6 px-8 text-xs font-black font-heading uppercase tracking-widest text-slate-400">
                  Mentee
                </th>
                <th className="py-6 px-8 text-xs font-black font-heading uppercase tracking-widest text-slate-400">
                  Institution
                </th>
                <th className="py-6 px-8 text-xs font-black font-heading uppercase tracking-widest text-slate-400 text-center">
                  Task XP
                </th>
                <th className="py-6 px-8 text-xs font-black font-heading uppercase tracking-widest text-slate-400 text-center">
                  Attendance XP
                </th>
                <th className="py-6 px-8 text-xs font-black font-heading uppercase tracking-widest text-indigo-600 text-right">
                  Total XP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-slate-400 font-medium">No results found.</p>
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
                            "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm",
                            entry.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            entry.rank === 2 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                            "bg-orange-100 text-orange-700 border border-orange-200"
                          )}>
                            {entry.rank}
                          </div>
                        ) : (
                          <span className="text-lg font-black font-heading text-slate-400 w-8 text-center">
                            #{entry.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {entry.firstName} {entry.lastName}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{entry.email}</div>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="text-sm text-slate-600 font-medium truncate max-w-[200px] block">
                        {entry.institution}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black tracking-wider">
                        {entry.taskPoints}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black tracking-wider">
                        {entry.attendancePoints}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <span className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                        {entry.totalPoints}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
