import { useState, useEffect, type ChangeEvent } from "react";
import api from "../api/axiosInstance";
import { X, Plus, Trash2 } from "lucide-react";
import Button from "./Button";
import Input from "./Input";

interface Recording {
  _id: string;
  title: string;
  description?: string;
  links: { title: string; url: string }[];
}

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recording?: Recording | null;
}

const RecordingModal = ({ isOpen, onClose, onSuccess, recording }: RecordingModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState([{ title: "", url: "" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recording) {
      setTitle(recording.title);
      setDescription(recording.description || "");
      setLinks(recording.links.length > 0 ? [...recording.links] : [{ title: "", url: "" }]);
    } else {
      setTitle("");
      setDescription("");
      setLinks([{ title: "", url: "" }]);
    }
  }, [recording, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (recording) {
        await api.put(`/recordings/${recording._id}`, {
          title,
          description,
          links,
        });
      } else {
        await api.post("/recordings", {
          title,
          description,
          links,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => setLinks([...links, { title: "", url: "" }]);
  
  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index: number, field: "title" | "url", value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{recording ? "Edit Recording" : "Add New Recording"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input 
              label="Title" 
              value={title} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
              required 
            />
            <Input 
              label="Description" 
              value={description} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} 
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Videos</label>
                <button type="button" onClick={addLink} className="text-indigo-600 text-sm flex items-center gap-1 hover:text-indigo-700 font-medium">
                    <Plus size={16} /> Add Another Video
                </button>
            </div>
            {links.map((link, index) => (
                <div key={index} className="flex items-end gap-2 p-3 bg-slate-50 rounded-xl border">
                    <div className="flex-1 space-y-2">
                        <Input 
                          label="Link Title" 
                          value={link.title} 
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updateLink(index, "title", e.target.value)} 
                          required 
                        />
                        <Input 
                          label="Link URL" 
                          value={link.url} 
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updateLink(index, "url", e.target.value)} 
                          required 
                        />
                    </div>
                    {links.length > 1 && (
                        <button type="button" onClick={() => removeLink(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            ))}
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            {recording ? "Save Changes" : "Create Recording"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RecordingModal;
