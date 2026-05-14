import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    type: "WEBINAR",
    speaker: "",
    recordingLinks: [] as { title: string; url: string }[],
    status: "UPCOMING",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchEvent = async () => {
        try {
          const response = await api.get(`/events/${id}`);
          const event = response.data;
          // Format date for datetime-local input
          // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
          const formattedDate = format(new Date(event.date), "yyyy-MM-dd'T'HH:mm");

          let formattedEndDate = "";
          if (event.endDate) {
            formattedEndDate = format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm");
          }

          setFormData({
            title: event.title,
            description: event.description,
            date: formattedDate,
            endDate: formattedEndDate,
            location: event.location || "",
            type: event.type,
            speaker: event.speaker || "",
            recordingLinks: event.recordingLinks || [],
            status: event.status,
          });
        } catch (error) {
          console.error("Error fetching event:", error);
        }
      };
      fetchEvent();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.date)) {
      alert("End time must be after start time.");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };

    try {
      if (isEditing) {
        await api.patch(`/events/${id}`, payload);
      } else {
        await api.post("/events", payload);
      }
      navigate("/events");
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/events")}
        className="flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Events
      </button>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">
          {isEditing ? "Edit Event" : "Create New Event"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Event Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            placeholder="e.g., Q1 Town Hall Meeting"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              placeholder="Describe the event agenda and details..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />

            <Input
              label="Location / Link"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., Zoom Link or Physical Address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Event Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
              >
                <option value="WEBINAR">Webinar</option>
                <option value="MEETING">Meeting</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="SESSION">Session</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Speaker"
              value={formData.speaker}
              onChange={(e) =>
                setFormData({ ...formData, speaker: e.target.value })
              }
              placeholder="e.g., Dr. Jane Smith"
            />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">
                Recording Links
              </label>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  recordingLinks: [...formData.recordingLinks, { title: "Session Recording", url: "" }]
                })}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Link
              </button>
            </div>

            <div className="space-y-3">
              {formData.recordingLinks.map((link, index) => (
                <div key={index} className="flex gap-3 items-start bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div className="flex-1 space-y-3">
                    <Input
                      label="Link Title"
                      value={link.title}
                      onChange={(e) => {
                        const newLinks = [...formData.recordingLinks];
                        newLinks[index].title = e.target.value;
                        setFormData({ ...formData, recordingLinks: newLinks });
                      }}
                      placeholder="e.g., Session Recording"
                    />
                    <Input
                      label="URL"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...formData.recordingLinks];
                        newLinks[index].url = e.target.value;
                        setFormData({ ...formData, recordingLinks: newLinks });
                      }}
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newLinks = formData.recordingLinks.filter((_, i) => i !== index);
                      setFormData({ ...formData, recordingLinks: newLinks });
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {formData.recordingLinks.length === 0 && (
                <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-400 text-sm">
                  No recording links added yet.
                </div>
              )}
            </div>
          </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={loading}>
              {isEditing ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
