import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import Button from "../../components/Button";
import { format } from "date-fns";
import { cn } from "../../utils/cn";
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
  endDate?: string;
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-heading text-neutral-900 tracking-tight">
            Events Management
          </h1>
          <p className="text-neutral-500 text-sm md:text-base mt-1 font-medium">
            Manage comprehensive event schedules and attendance.
          </p>
        </div>
        <Link to="/events/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-11 md:h-12 rounded-xl md:rounded-2xl font-black font-heading text-xs md:text-sm uppercase tracking-widest gap-2">
            <PlusIcon className="w-5 h-5" />
            Create Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-500">
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-3xl md:rounded-[3rem] p-10 md:p-24 text-center shadow-sm">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-blue-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
            <CalendarIcon className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
          </div>
          <h2 className="text-xl md:text-3xl font-black font-heading text-neutral-900 tracking-tight">
            No events found
          </h2>
          <p className="text-neutral-500 mt-3 md:mt-4 max-w-sm mx-auto font-medium text-sm md:text-lg leading-relaxed">
            Start by creating your first event to track attendance and
            engagement within the accelerator.
          </p>
          <div className="mt-8 md:mt-10">
            <Link to="/events/create">
              <Button variant="secondary" className="h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl font-black font-heading">Create Event</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1 space-y-3 md:space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "px-3 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm",
                      event.status === "UPCOMING"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : event.status === "COMPLETED"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    )}
                  >
                    {event.status}
                  </span>
                  <span className="text-[10px] md:text-xs text-neutral-400 font-black uppercase tracking-widest bg-neutral-50 px-3 py-1 rounded-lg border border-neutral-100">
                    {event.type}
                  </span>
                </div>
                <h3 className="text-lg md:text-2xl font-black font-heading text-neutral-900 tracking-tight">
                  {event.title}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center text-xs md:text-sm text-neutral-500 gap-3 md:gap-6 font-medium">
                  <div className="flex items-center gap-2 bg-neutral-50/50 px-3 py-1.5 rounded-xl border border-neutral-100/50">
                    <CalendarIcon className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-600 font-black uppercase tracking-tight text-[10px] md:text-xs">
                      {format(new Date(event.date), "MMM d, yyyy")} @ {format(new Date(event.date), "HH:mm")}
                      {event.endDate && ` — ${format(new Date(event.endDate), "HH:mm")}`}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 bg-neutral-50/50 px-3 py-1.5 rounded-xl border border-neutral-100/50">
                      <MapPinIcon className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-600 font-black uppercase tracking-tight text-[10px] md:text-xs">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-center">
                <Link to={`/events/${event._id}/attendance`} className="flex-1 sm:flex-none">
                  <Button variant="secondary" size="sm" className="w-full h-10 md:h-12 rounded-xl md:rounded-2xl font-black font-heading text-[10px] md:text-xs uppercase tracking-widest gap-2">
                    <UserGroupIcon className="w-4 h-4" />
                    Attendance
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Link to={`/events/edit/${event._id}`}>
                    <Button variant="outline" size="sm" className="h-10 md:h-12 w-10 md:w-12 p-0 rounded-xl md:rounded-2xl border-neutral-100 hover:bg-neutral-50 shadow-sm">
                      <PencilSquareIcon className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    className="h-10 md:h-12 w-10 md:w-12 p-0 rounded-xl md:rounded-2xl shadow-sm"
                    onClick={() => handleDelete(event._id)}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventListPage;
