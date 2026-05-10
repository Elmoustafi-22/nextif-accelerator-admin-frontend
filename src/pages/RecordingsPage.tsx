import { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import VideoPlayer from "../components/VideoPlayer";
import AddRecordingModal from "../components/AddRecordingModal";
import { Plus, ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

interface Recording {
  _id: string;
  title: string;
  description?: string;
  links: { title: string; url: string }[];
}

const RecordingsPage = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const fetchRecordings = () => api.get("/recordings").then((res) => setRecordings(res.data));

  useEffect(() => {
    fetchRecordings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Session Recordings</h1>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" /> Add Recording
          </button>
        )}
      </div>

      <div className="space-y-4">
        {recordings.map((rec) => (
          <div key={rec._id} className="border rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setExpandedId(expandedId === rec._id ? null : rec._id)}
              className="w-full p-4 flex justify-between items-center hover:bg-slate-50"
            >
              <span className="font-semibold text-lg">{rec.title}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedId === rec._id ? "rotate-180" : ""}`} />
            </button>
            {expandedId === rec._id && (
              <div className="p-4 border-t space-y-4">
                {rec.description && <p className="text-slate-600">{rec.description}</p>}
                {rec.links.map((link, idx) => (
                    <div key={idx} className="space-y-2">
                        <p className="font-medium text-slate-700">{link.title}</p>
                        <VideoPlayer url={link.url} />
                    </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <AddRecordingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchRecordings} 
      />
    </div>
  );
};

export default RecordingsPage;
