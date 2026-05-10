import { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import VideoPlayer from "../components/VideoPlayer";
import RecordingModal from "../components/RecordingModal";
import { Plus, ChevronDown, Edit2, Trash2 } from "lucide-react";
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
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const fetchRecordings = () => api.get("/recordings").then((res) => setRecordings(res.data));

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleEdit = (e: React.MouseEvent, rec: Recording) => {
    e.stopPropagation();
    setEditingRecording(rec);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this recording?")) {
      try {
        await api.delete(`/recordings/${id}`);
        fetchRecordings();
      } catch (err) {
        console.error("Failed to delete recording:", err);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecording(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Session Recordings</h1>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingRecording(null);
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" /> Add Recording
          </button>
        )}
      </div>

      <div className="space-y-4">
        {recordings.map((rec) => (
          <div key={rec._id} className="border rounded-xl overflow-hidden bg-white">
            <div
              onClick={() => setExpandedId(expandedId === rec._id ? null : rec._id)}
              className="w-full p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold text-lg text-left">{rec.title}</span>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEdit(e, rec)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, rec._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${expandedId === rec._id ? "rotate-180" : ""}`} />
            </div>
            {expandedId === rec._id && (
              <div className="py-4 sm:py-6 border-t space-y-6">
                {rec.description && <p className="text-slate-600 px-4 sm:px-6">{rec.description}</p>}
                <div className="space-y-6">
                  {rec.links.map((link, idx) => (
                      <div key={idx} className="space-y-3">
                          <p className="font-medium text-slate-700 px-4 sm:px-6">{link.title}</p>
                          <div className="px-1 sm:px-6">
                              <VideoPlayer url={link.url} />
                          </div>
                      </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <RecordingModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchRecordings}
        recording={editingRecording}
      />
    </div>
  );
};

export default RecordingsPage;
