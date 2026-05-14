import { useState, useEffect } from "react";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/Button";
import Input from "../components/Input";
import { cn } from "../utils/cn";

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/complaints", {
        params: { status: statusFilter },
      });
      setComplaints(response.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        adminResponse: responseMessage,
      });
      setIsModalOpen(false);
      fetchComplaints();
    } catch (error) {
      console.error("Error updating complaint:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setResponseMessage(complaint.adminResponse || "");
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-700";
      case "UNDER_REVIEW":
        return "bg-amber-100 text-amber-700";
      case "RESOLVED":
        return "bg-green-100 text-green-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <MessageSquare size={14} />;
      case "UNDER_REVIEW":
        return <Clock size={14} />;
      case "RESOLVED":
        return <CheckCircle2 size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-heading text-neutral-900 tracking-tight">
            Complaints Management
          </h1>
          <p className="text-neutral-500 text-sm md:text-base mt-1 font-medium">
            Review and resolve issues reported by fellows.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-neutral-100 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="flex-1 relative group">
          <Input
            placeholder="Filter by subject or fellow..."
            icon={<Search size={18} className="text-neutral-400 group-focus-within:text-blue-600 transition-colors" />}
            className="h-11 md:h-12 rounded-xl md:rounded-2xl bg-neutral-50 border-transparent focus:bg-white transition-all font-medium"
          />
        </div>
        <div className="flex gap-4">
          <select
            className="flex-1 md:flex-none bg-neutral-50 border border-neutral-100 rounded-xl md:rounded-2xl px-4 md:px-6 h-11 md:h-12 text-sm font-black font-heading focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-2xl border border-neutral-100 animate-pulse"
            ></div>
          ))
        ) : complaints.length === 0 ? (
          <div className="bg-white border border-neutral-100 rounded-3xl md:rounded-[3rem] p-10 md:p-24 text-center shadow-sm">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-blue-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <MessageSquare size={32} className="text-blue-600 md:w-12 md:h-12" />
            </div>
            <h3 className="text-lg md:text-3xl font-black font-heading text-neutral-900 tracking-tight">
              No complaints found
            </h3>
            <p className="text-neutral-500 mt-3 md:mt-4 max-w-sm mx-auto font-medium text-sm md:text-lg leading-relaxed">
              When fellows submit issues, they will appear here for administrative review.
            </p>
          </div>
        ) : (
          complaints.map((complaint: any) => (
            <div
              key={complaint._id}
              onClick={() => openModal(complaint)}
              className="bg-white border border-neutral-100 rounded-2xl md:rounded-[2rem] p-5 md:p-8 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1 space-y-4 md:space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border",
                      getStatusColor(complaint.status).includes('blue') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      getStatusColor(complaint.status).includes('amber') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-green-50 text-green-700 border-green-100'
                    )}
                  >
                    {getStatusIcon(complaint.status)}
                    {complaint.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                    {new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg md:text-xl font-heading font-black text-neutral-900 group-hover:text-blue-600 transition-colors tracking-tight">
                    {complaint.subject}
                  </h3>
                  <p className="text-sm md:text-base text-neutral-500 line-clamp-2 mt-2 font-medium leading-relaxed">
                    {complaint.message}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-[10px] text-white font-black uppercase shadow-sm">
                      {complaint.ambassadorId?.firstName?.[0]}
                      {complaint.ambassadorId?.lastName?.[0]}
                    </div>
                    <span className="font-heading font-black text-neutral-700 uppercase tracking-widest text-[10px] md:text-xs">
                      {complaint.ambassadorId?.firstName}{" "}
                      {complaint.ambassadorId?.lastName}
                    </span>
                  </div>
                  {complaint.adminResponse && (
                    <span className="text-blue-600 font-heading font-black flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                      <CheckCircle2 size={14} /> Responded
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-neutral-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all shrink-0 self-end md:self-center">
                <span className="text-[10px] font-heading font-black uppercase tracking-widest hidden md:inline">
                  Operational Control
                </span>
                <ChevronRight size={24} className="md:w-6 md:h-6" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Handle Complaint Modal */}
      <AnimatePresence>
        {isModalOpen && selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      Handle Complaint
                    </h2>
                    <p className="text-xs text-neutral-500 font-medium">
                      Resolving fellow issue
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Fellow Info */}
                <div className="bg-neutral-50 rounded-2xl p-4 flex items-center justify-between border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {selectedComplaint.ambassadorId?.firstName?.[0]}
                      {selectedComplaint.ambassadorId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">
                        {selectedComplaint.ambassadorId?.firstName}{" "}
                        {selectedComplaint.ambassadorId?.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {selectedComplaint.ambassadorId?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-heading font-bold text-neutral-400 uppercase tracking-widest">
                      Subject
                    </label>
                    <p className="text-base font-bold text-neutral-900">
                      {selectedComplaint.subject}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-heading font-bold text-neutral-400 uppercase tracking-widest">
                      Message
                    </label>
                    <div className="bg-neutral-50 rounded-2xl p-4 text-sm text-neutral-700 border border-neutral-100">
                      {selectedComplaint.message}
                    </div>
                  </div>
                </div>

                {/* Response Form */}
                <form
                  onSubmit={handleUpdateStatus}
                  className="space-y-6 border-t border-neutral-100 pt-6"
                >
                  <div className="space-y-3">
                    <label className="text-[10px] font-heading font-bold text-neutral-400 uppercase tracking-widest">
                      Update Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["SUBMITTED", "UNDER_REVIEW", "RESOLVED"] as const).map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setNewStatus(status)}
                            className={cn(
                              "py-3 px-2 rounded-xl text-[10px] font-heading font-bold transition-all border",
                              newStatus === status
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "bg-white border-neutral-100 text-neutral-500 hover:border-neutral-200"
                            )}
                          >
                            {status.replace("_", " ")}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-heading font-bold text-neutral-400 uppercase tracking-widest">
                      Admin Response
                    </label>
                    <textarea
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[120px]"
                      placeholder="Type your response or resolution details here..."
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                    />
                    <p className="text-[10px] text-neutral-400">
                      This response will be visible to the fellow.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12"
                      isLoading={isSubmitting}
                      disabled={
                        newStatus === selectedComplaint.status &&
                        responseMessage ===
                        (selectedComplaint.adminResponse || "")
                      }
                    >
                      Update Complaint
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintsPage;
