import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import Button from "../../components/Button";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid";

interface AttendanceRecord {
  _id: string; // Fellow ID
  firstName: string;
  lastName: string;
  email: string;
  attendanceStatus: "PRESENT" | "ABSENT" | "EXCUSED" | "NOT_MARKED";
  marks: number;
}

const EventAttendancePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalPoints, setGlobalPoints] = useState(5); // Default to 5 points

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await api.get(`/events/${id}`);
        setEventTitle(eventRes.data.title);

        const attendanceRes = await api.get(`/events/${id}/attendance`);
        setAttendees(attendanceRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
            marks: status === "PRESENT" ? globalPoints : 0,
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = attendees
        .filter((a) => a.attendanceStatus !== "NOT_MARKED") // Only send marked ones, or send all if you want to set defaults
        .map((a) => ({
          ambassadorId: a._id,
          status: a.attendanceStatus,
          marks: a.marks,
        }));

      await api.post(`/events/${id}/attendance/bulk`, { items });
      alert("Attendance saved successfully!");
      navigate("/events");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
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
    // Reset file input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const stats = {
    present: attendees.filter((a) => a.attendanceStatus === "PRESENT").length,
    absent: attendees.filter((a) => a.attendanceStatus === "ABSENT").length,
    excused: attendees.filter((a) => a.attendanceStatus === "EXCUSED").length,
    unmarked: attendees.filter((a) => a.attendanceStatus === "NOT_MARKED")
      .length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/events")}
        className="flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Events
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Attendance: {eventTitle}
          </h1>
          <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-600">
            <span className="flex items-center">
              <CheckCircleSolid className="w-4 h-4 text-green-600 mr-1" />{" "}
              Present: <b>{stats.present}</b>
            </span>
            <span className="flex items-center">
              <XCircleSolid className="w-4 h-4 text-red-600 mr-1" /> Absent:{" "}
              <b>{stats.absent}</b>
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5" />{" "}
              Excused: <b>{stats.excused}</b>
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-gray-300 mr-1.5" />{" "}
              Unmarked: <b>{stats.unmarked}</b>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Points for Attendance:</span>
            <input
              type="number"
              value={globalPoints}
              onChange={(e) => setGlobalPoints(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-neutral-300 rounded-lg text-center font-bold"
            />
          </div>
          <div>
            <input 
              type="file" 
              accept=".csv" 
              id="csv-upload" 
              className="hidden" 
              onChange={handleCSVUpload} 
            />
            <label 
              htmlFor="csv-upload" 
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200 font-bold text-sm cursor-pointer hover:bg-indigo-100 transition-colors inline-flex items-center h-10"
            >
              Upload CSV
            </label>
          </div>
          <Button onClick={handleSave} isLoading={saving}>
            Save Attendance
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-500">
          Loading felow list...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Fellow
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">
                    Present
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">
                    Absent
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">
                    Excused
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {attendees.map((ambassador) => (
                  <tr
                    key={ambassador._id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">
                          {ambassador.firstName} {ambassador.lastName}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {ambassador.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          updateLocalStatus(ambassador._id, "PRESENT")
                        }
                        className={`p-2 rounded-full transition-colors ${ambassador.attendanceStatus === "PRESENT"
                          ? "bg-green-100 text-green-600"
                          : "text-neutral-300 hover:text-green-600"
                          }`}
                      >
                        {ambassador.attendanceStatus === "PRESENT" ? (
                          <CheckCircleSolid className="w-6 h-6" />
                        ) : (
                          <CheckCircleIcon className="w-6 h-6" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          updateLocalStatus(ambassador._id, "ABSENT")
                        }
                        className={`p-2 rounded-full transition-colors ${ambassador.attendanceStatus === "ABSENT"
                          ? "bg-red-100 text-red-600"
                          : "text-neutral-300 hover:text-red-600"
                          }`}
                      >
                        {ambassador.attendanceStatus === "ABSENT" ? (
                          <XCircleSolid className="w-6 h-6" />
                        ) : (
                          <XCircleIcon className="w-6 h-6" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          updateLocalStatus(ambassador._id, "EXCUSED")
                        }
                        className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${ambassador.attendanceStatus === "EXCUSED"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : "text-neutral-400 border-neutral-200 hover:border-yellow-400 hover:text-yellow-600"
                          }`}
                      >
                        Excused
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        value={ambassador.marks}
                        onChange={(e) =>
                          updateLocalMarks(
                            ambassador._id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-20 px-2 py-1 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-center"
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAttendancePage;
