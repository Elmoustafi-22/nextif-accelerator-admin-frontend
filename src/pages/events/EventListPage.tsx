import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import Button from "../../components/Button";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  type: string;
  status: string;
}

const EventListPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events");
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This will also delete all attendance records."
      )
    )
      return;
    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter((e) => e._id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Events</h1>
          <p className="text-neutral-500">
            Manage comprehensive event schedules and attendance.
          </p>
        </div>
        <Link to="/events/create">
          <Button>
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-500">
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <CalendarIcon className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <h3 className="text-lg font-medium text-neutral-900">
            No events found
          </h3>
          <p className="text-neutral-500 max-w-sm mx-auto mt-1">
            Start by creating your first event to track attendance and
            engagement.
          </p>
          <div className="mt-6">
            <Link to="/events/create">
              <Button variant="secondary">Create Event</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
            >
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      event.status === "UPCOMING"
                        ? "bg-blue-100 text-blue-700"
                        : event.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {event.status}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                    {event.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {event.title}
                </h3>
                <div className="flex items-center text-sm text-neutral-500 mt-2 space-x-4">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1.5" />
                    {format(new Date(event.date), "PPP p")}
                  </div>
                  {event.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1.5" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link to={`/events/${event._id}/attendance`}>
                  <Button variant="secondary" size="sm">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Attendance
                  </Button>
                </Link>
                <Link to={`/events/edit/${event._id}`}>
                  <Button variant="outline" size="sm">
                    <PencilSquareIcon className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(event._id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventListPage;
