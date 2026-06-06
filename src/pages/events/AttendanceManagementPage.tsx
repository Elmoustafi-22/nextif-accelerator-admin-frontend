import { useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import Button from "../../components/Button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid";
import { cn } from "../../utils/cn";

interface Event {
  _id: string;
  title: string;
  date: string;
  type: string;
}

interface AttendanceRecord {
  _id: string; // Fellow ID
  firstName: string;
  lastName: string;
  email: string;
  attendanceStatus: "PRESENT" | "ABSENT" | "EXCUSED" | "NOT_MARKED";
  marks: number;
}

const AttendanceManagementPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [globalPoints, setGlobalPoints] = useState(5);
  const [excusedPoints, setExcusedPoints] = useState(2); // Default to 2 points for excused

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Synchronize changes to global/excused points across already marked fellows
  useEffect(() => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.attendanceStatus === "PRESENT" ? { ...a, marks: globalPoints } : a
      )
    );
  }, [globalPoints]);

  useEffect(() => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.attendanceStatus === "EXCUSED" ? { ...a, marks: excusedPoints } : a
      )
    );
  }, [excusedPoints]);

  const toggleEvent = async (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      setAttendees([]);
      return;
    }

    setExpandedEventId(eventId);
    setLoadingAttendees(true);
    try {
      const res = await api.get(`/events/${eventId}/attendance`);
      setAttendees(res.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const updateLocalStatus = (
    ambassadorId: string,
    status: "PRESENT" | "ABSENT" | "EXCUSED"
  ) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a._id === ambassadorId
          ? {
            ...a,
            attendanceStatus: status,
            marks:
              status === "PRESENT"
                ? globalPoints
                : status === "EXCUSED"
                ? excusedPoints
                : 0,
          }
          : a
      )
    );
  };

  const updateLocalMarks = (ambassadorId: string, marks: number) => {
    setAttendees((prev) =>
      prev.map((a) => (a._id === ambassadorId ? { ...a, marks } : a))
    );
  };

  const handleSave = async (eventId: string) => {
    setSaving(true);
    try {
      const items = attendees
        .filter((a) => a.attendanceStatus !== "NOT_MARKED")
        .map((a) => ({
          ambassadorId: a._id,
          status: a.attendanceStatus,
          marks: a.marks,
        }));

      await api.post(`/events/${eventId}/attendance/bulk`, { items });
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleResendNotifications = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to resend notifications for this event? This will send emails to all fellows and admins.")) return;
    
    setResending(eventId);
    try {
      await api.post(`/events/${eventId}/resend-notifications`);
      alert("Notifications resent successfully!");
    } catch (error) {
      console.error("Error resending notifications:", error);
      alert("Failed to resend notifications.");
    } finally {
      setResending(null);
    }
  };

  const downloadCSV = (eventTitle: string) => {
    if (attendees.length === 0) return;

    const headers = ["First Name", "Last Name", "Email", "Status", "Points"];
    const rows = attendees.map(a => [
      a.firstName,
      a.lastName,
      a.email,
      a.attendanceStatus,
      a.marks
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${eventTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.toLowerCase());
      
      setAttendees(prev => prev.map(a => {
        const firstName = a.firstName?.toLowerCase().trim() || "";
        const lastName = a.lastName?.toLowerCase().trim() || "";
        
        const isPresent = rows.some(row => {
          const hasFirst = firstName.length > 1 && row.includes(firstName);
          const hasLast = lastName.length > 1 && row.includes(lastName);
          
          // Option 1: Both names are present in the row
          if (hasFirst && hasLast) return true;
          
          // Option 2: Only one of the names is present (allows for manual verification)
          if (hasFirst || hasLast) return true;
          
          return false;
        });

        if (isPresent) {
          return {
            ...a,
            attendanceStatus: "PRESENT",
            marks: globalPoints
          };
        }
        return a;
      }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black font-heading text-neutral-900 tracking-tight">
            Attendance Hub
          </h1>
          <p className="text-neutral-500 font-medium">
            Manage attendance for all training sessions and tactical meetings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-neutral-200 flex items-center gap-4 shadow-sm">
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Global Session Points:</span>
            <input
              type="number"
              value={globalPoints}
              onChange={(e) => setGlobalPoints(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-neutral-100 bg-neutral-50 rounded-xl text-center font-black text-neutral-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-neutral-200 flex items-center gap-4 shadow-sm">
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Global Excused Points:</span>
            <input
              type="number"
              value={excusedPoints}
              onChange={(e) => setExcusedPoints(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-neutral-100 bg-neutral-50 rounded-xl text-center font-black text-neutral-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {loadingEvents ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-neutral-100">
          <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm"></div>
          <p className="mt-6 text-neutral-400 font-black font-heading uppercase tracking-widest text-xs">
            Synchronizing Event Logs...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.length === 0 ? (
             <div className="text-center py-32 bg-white rounded-[3rem] border border-neutral-100">
                <p className="text-neutral-400 font-black font-heading uppercase tracking-widest text-xs">
                  No events found in local database.
                </p>
             </div>
          ) : (
            events.map((event) => (
              <div
                key={event._id}
                className={cn(
                  "bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
                  expandedEventId === event._id 
                    ? "border-indigo-600 shadow-2xl shadow-indigo-600/5" 
                    : "border-neutral-100 shadow-sm hover:shadow-md"
                )}
              >
                <button
                  onClick={() => toggleEvent(event._id)}
                  className={cn(
                    "w-full px-4 sm:px-10 py-5 sm:py-8 flex items-center justify-between transition-colors",
                    expandedEventId === event._id ? "bg-indigo-50/30" : "hover:bg-neutral-50/50"
                  )}
                >
                  <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                    <div className={cn(
                      "w-12 h-12 sm:w-16 sm:h-16 rounded-[1.5rem] flex items-center justify-center text-white shrink-0 shadow-lg transition-all",
                      expandedEventId === event._id ? "bg-indigo-600 scale-110" : "bg-neutral-900"
                    )}>
                      <span className="font-black text-[10px] uppercase tracking-widest">
                        {event.type.substring(0, 3)}
                      </span>
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-lg sm:text-2xl font-black font-heading text-neutral-900 tracking-tight leading-none mb-1 sm:mb-2 truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                        <div className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">
                          {event.type}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ml-2",
                    expandedEventId === event._id ? "bg-indigo-600 text-white" : "bg-neutral-50 text-neutral-400"
                  )}>
                    {expandedEventId === event._id ? (
                      <ChevronUpIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                </button>

                {expandedEventId === event._id && (
                  <div className="p-4 sm:p-10 space-y-6 sm:space-y-10 animate-in slide-in-from-top-4 duration-500">
                    {loadingAttendees ? (
                      <div className="text-center py-20 bg-neutral-50 rounded-[2rem]">
                        <div className="w-10 h-10 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm"></div>
                        <p className="mt-6 text-neutral-400 font-black font-heading uppercase tracking-widest text-[10px]">
                          Loading Personnel Roster...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 sm:space-y-8">
                        {/* Stats + Action bar */}
                        <div className="flex flex-col gap-4">
                          {/* Stats row */}
                          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                Present: <b className="text-emerald-600 ml-1">{attendees.filter(a => a.attendanceStatus === 'PRESENT').length}</b>
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                Absent: <b className="text-rose-600 ml-1">{attendees.filter(a => a.attendanceStatus === 'ABSENT').length}</b>
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                Excused: <b className="text-yellow-600 ml-1">{attendees.filter(a => a.attendanceStatus === 'EXCUSED').length}</b>
                              </span>
                            </div>
                          </div>
                          {/* Action buttons row */}
                          <div className="flex flex-wrap items-center gap-3">
                            <input 
                              type="file" 
                              accept=".csv" 
                              id={`csv-upload-${event._id}`} 
                              className="hidden" 
                              onChange={handleCSVUpload} 
                            />
                            <label 
                              htmlFor={`csv-upload-${event._id}`} 
                              className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 font-bold text-xs sm:text-sm cursor-pointer hover:bg-indigo-100 transition-colors inline-flex items-center"
                            >
                              Upload CSV
                            </label>
                            <button 
                              onClick={() => downloadCSV(event.title)}
                              className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-bold text-xs sm:text-sm hover:bg-emerald-100 transition-colors inline-flex items-center"
                            >
                              Download CSV
                            </button>
                            <Button 
                              onClick={() => handleSave(event._id)} 
                              isLoading={saving}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                              Save Briefing Log
                            </Button>
                            <Button 
                              onClick={() => handleResendNotifications(event._id)} 
                              isLoading={resending === event._id}
                              className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-5 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                            >
                              Resend Invites
                            </Button>
                          </div>
                        </div>

                        {/* Mobile: card layout | Desktop: table layout */}
                        <div className="space-y-3 md:hidden">
                          {attendees.map((a) => (
                            <div
                              key={a._id}
                              className={cn(
                                "rounded-2xl border p-4 transition-all",
                                a.attendanceStatus === "PRESENT"
                                  ? "bg-emerald-50/40 border-emerald-100"
                                  : a.attendanceStatus === "ABSENT"
                                  ? "bg-rose-50/40 border-rose-100"
                                  : a.attendanceStatus === "EXCUSED"
                                  ? "bg-amber-50/40 border-amber-100"
                                  : "bg-white border-neutral-100"
                              )}
                            >
                              {/* Name + email */}
                              <div className="mb-3">
                                <div className="font-black text-neutral-900 text-base tracking-tight leading-none mb-0.5">
                                  {a.firstName} {a.lastName}
                                </div>
                                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest truncate">{a.email}</div>
                              </div>
                              {/* Actions row */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateLocalStatus(a._id, "PRESENT")}
                                    title="Mark Present"
                                    className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                      a.attendanceStatus === "PRESENT"
                                        ? "bg-emerald-100 text-emerald-600 shadow-inner"
                                        : "bg-neutral-100 text-neutral-300 hover:bg-emerald-50 hover:text-emerald-500"
                                    )}
                                  >
                                    {a.attendanceStatus === "PRESENT" ? (
                                      <CheckCircleSolid className="w-6 h-6" />
                                    ) : (
                                      <CheckCircleIcon className="w-6 h-6" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => updateLocalStatus(a._id, "ABSENT")}
                                    title="Mark Absent"
                                    className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                      a.attendanceStatus === "ABSENT"
                                        ? "bg-rose-100 text-rose-600 shadow-inner"
                                        : "bg-neutral-100 text-neutral-300 hover:bg-rose-50 hover:text-rose-500"
                                    )}
                                  >
                                    {a.attendanceStatus === "ABSENT" ? (
                                      <XCircleSolid className="w-6 h-6" />
                                    ) : (
                                      <XCircleIcon className="w-6 h-6" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => updateLocalStatus(a._id, "EXCUSED")}
                                    className={cn(
                                      "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                                      a.attendanceStatus === "EXCUSED"
                                        ? "bg-amber-100 border-amber-200 text-amber-700 shadow-inner"
                                        : "bg-neutral-100 border-transparent text-neutral-400 hover:border-amber-200 hover:text-amber-600"
                                    )}
                                  >
                                    Excused
                                  </button>
                                </div>
                                {/* XP input */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">XP</span>
                                  <input
                                    type="number"
                                    value={a.marks}
                                    onChange={(e) => updateLocalMarks(a._id, parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-2 bg-white border border-neutral-200 rounded-lg text-center font-black text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                                    min="0"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop table (hidden on mobile) */}
                        <div className="hidden md:block overflow-hidden rounded-[2rem] border border-neutral-100 bg-white">
                          <table className="w-full text-left">
                            <thead className="bg-neutral-50/50">
                              <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Fellow Personnel</th>
                                <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center">Status Action</th>
                                <th className="px-10 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center">Assigned XP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                              {attendees.map((a) => (
                                <tr key={a._id} className="hover:bg-neutral-50/30 transition-colors group">
                                  <td className="px-10 py-8">
                                    <div className="font-black text-neutral-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors leading-none mb-1">
                                      {a.firstName} {a.lastName}
                                    </div>
                                    <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{a.email}</div>
                                  </td>
                                  <td className="px-10 py-8">
                                    <div className="flex justify-center items-center gap-5">
                                      <button
                                        onClick={() => updateLocalStatus(a._id, "PRESENT")}
                                        title="Mark Present"
                                        className={cn(
                                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                          a.attendanceStatus === "PRESENT"
                                            ? "bg-emerald-100 text-emerald-600 shadow-inner"
                                            : "bg-neutral-50 text-neutral-300 hover:bg-emerald-50 hover:text-emerald-500"
                                        )}
                                      >
                                        {a.attendanceStatus === "PRESENT" ? (
                                          <CheckCircleSolid className="w-7 h-7" />
                                        ) : (
                                          <CheckCircleIcon className="w-7 h-7" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => updateLocalStatus(a._id, "ABSENT")}
                                        title="Mark Absent"
                                        className={cn(
                                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                          a.attendanceStatus === "ABSENT"
                                            ? "bg-rose-100 text-rose-600 shadow-inner"
                                            : "bg-neutral-50 text-neutral-300 hover:bg-rose-50 hover:text-rose-500"
                                        )}
                                      >
                                        {a.attendanceStatus === "ABSENT" ? (
                                          <XCircleSolid className="w-7 h-7" />
                                        ) : (
                                          <XCircleIcon className="w-7 h-7" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => updateLocalStatus(a._id, "EXCUSED")}
                                        className={cn(
                                          "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                          a.attendanceStatus === "EXCUSED"
                                            ? "bg-amber-100 border-amber-200 text-amber-700 shadow-inner"
                                            : "bg-neutral-50 border-transparent text-neutral-400 hover:border-amber-200 hover:text-amber-600"
                                        )}
                                      >
                                        Excused
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-10 py-8">
                                    <div className="flex justify-center">
                                      <input
                                        type="number"
                                        value={a.marks}
                                        onChange={(e) => updateLocalMarks(a._id, parseInt(e.target.value) || 0)}
                                        className="w-20 px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-center font-black text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                                        min="0"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManagementPage;
