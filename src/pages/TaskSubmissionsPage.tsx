import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Paperclip,
  Clock,
  ListChecks,
  AlertCircle,
  RefreshCcw,
  Calendar as CalendarIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/Button";
import { cn } from "../utils/cn";
import { toast } from "../store/useToastStore";

const TaskSubmissionsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [redoDueDates, setRedoDueDates] = useState<{ [key: string]: string }>(
    {}
  );
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [taskRes, submissionsRes] = await Promise.all([
          axiosInstance.get(`/tasks/${id}`),
          axiosInstance.get(`/tasks/submissions?taskId=${id}`), // Need to verify if this endpoint exists or should be handled
        ]);
        setTask(taskRes.data);
        setSubmissions(submissionsRes.data);
      } catch (err) {
        console.error("Error fetching submission data:", err);
        setError("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleVerify = async (
    submissionId: string,
    status: "COMPLETED" | "REJECTED" | "REDO"
  ) => {
    if (status === "REDO" && !redoDueDates[submissionId]) {
      toast.warning("Please specify a new due date for the redo.");
      return;
    }
    try {
      setVerifyingId(submissionId);
      const res = await axiosInstance.patch(
        `/tasks/submissions/${submissionId}/verify`,
        {
          status,
          feedback: remarks[submissionId] || "",
          newDueDate: redoDueDates[submissionId],
        }
      );

      // Update local state immediately (in place) to show "Approved"
      setSubmissions((prev) =>
        prev.map((s) => (s._id === submissionId ? res.data : s))
      );

      // Clear remark
      setRemarks((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });

      // Show modal if status is COMPLETED
      if (status === "COMPLETED") {
        setShowAcceptModal(true);
        setTimeout(() => setShowAcceptModal(false), 2000);
      }

      // Reorder after a delay so user sees the updated state first
      setTimeout(() => {
        setSubmissions((prev) => {
          // We need to re-sort based on the *current* state of prev
          // which should already have the updated item from the first setSubmissions
          const pending = prev.filter(
            (s) => s.status === "SUBMITTED" || s.status === "REDO"
          );
          const completed = prev.filter(
            (s) => s.status === "COMPLETED" || s.status === "REJECTED"
          );
          return [...pending, ...completed];
        });
      }, 2000); // 2 seconds delay
    } catch (err) {
      console.error("Verification failed:", err);
      toast.error("Failed to update status");
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading)
    return (
      <div className="p-8 animate-pulse text-center">
        Loading submissions...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
          <p className="text-red-700 font-semibold mb-2">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  if (!task)
    return <div className="p-8 text-center text-red-500">Task not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/tasks")}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors font-medium border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft size={20} /> Back to Tasks
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold font-heading text-neutral-900">
            {task.title}
          </h1>
          <p className="text-xs text-neutral-500 font-heading font-medium">
            Reviewing {submissions.length} submissions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Summary Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider text-[10px]">
              Task Requirements
            </h3>
            <div className="space-y-4">
              {(task.whatToDo || task.steps)?.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-800">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-neutral-500 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-bold font-heading mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-blue-400" /> Review Policy
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed space-y-2">
              Please verify that each response accurately addresses the
              requirement instructions. If proof files or links are required,
              ensure they are accessible and valid.
            </p>
          </div>
        </div>

        {/* Submissions List Column */}
        <div className="lg:col-span-2 space-y-6">
          {submissions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dotted border-neutral-300 p-12 text-center text-neutral-500">
              No submissions yet for this task.
            </div>
          ) : (
            submissions.map((sub: any) => (
              <div
                key={sub._id}
                className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden border-l-4 border-l-neutral-200 hover:border-l-blue-500 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-900 font-bold">
                        {sub.ambassadorId?.firstName?.[0]}
                        {sub.ambassadorId?.lastName?.[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">
                          {sub.ambassadorId?.firstName}{" "}
                          {sub.ambassadorId?.lastName}
                        </h4>
                        <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock size={12} />{" "}
                          {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          sub.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : sub.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : sub.status === "REDO"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {sub.status === "SUBMITTED"
                          ? "PENDING REVIEW"
                          : sub.status === "REDO"
                            ? "REDO REQUESTED"
                            : sub.status}
                      </span>
                      {sub.reviewedBy && (
                        <span className="text-[9px] text-neutral-400 font-medium italic">
                          Reviewed by {sub.reviewedBy.firstName}{" "}
                          {sub.reviewedBy.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interleaved Responses */}
                  <div className="space-y-4 mb-6">
                    <h5 className="text-[10px] font-bold font-heading text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                      <ListChecks size={14} /> Submission Responses
                    </h5>
                    <div className="space-y-4">
                      {(task.whatToDo || task.steps)?.map(
                        (guide: any, idx: number) => {
                          const response = sub.responses?.find(
                            (r: any) => r.whatToDoId === guide._id
                          );
                          return (
                            <div
                              key={guide._id || idx}
                              className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-neutral-400">
                                  ITEM {idx + 1}: {guide.title}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                                {response?.text || (
                                  <span className="text-red-400 italic font-normal">
                                    No response provided for this item.
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* General Remarks / Links / Files */}
                  {(sub.content ||
                    sub.links?.length > 0 ||
                    sub.proofFiles?.length > 0) && (
                      <div className="space-y-4 pt-6 border-t border-neutral-50">
                        {sub.content && (
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">
                              General Remarks
                            </label>
                            <p className="text-sm text-neutral-600 bg-neutral-50/50 p-4 rounded-2xl italic">
                              "{sub.content}"
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sub.links &&
                            sub.links.length > 0 &&
                            sub.links[0] !== "" && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                  Links
                                </label>
                                {sub.links
                                  .filter(Boolean)
                                  .map((link: string, lIdx: number) => (
                                    <a
                                      key={lIdx}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                                    >
                                      <ExternalLink size={12} /> {link}
                                    </a>
                                  ))}
                              </div>
                            )}
                          {sub.proofFiles && sub.proofFiles.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                Attachments
                              </label>
                              {sub.proofFiles
                                .filter(Boolean)
                                .map((file: string, fIdx: number) => (
                                  <a
                                    key={fIdx}
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-neutral-600 hover:text-blue-600"
                                  >
                                    <Paperclip size={12} />{" "}
                                    {file?.split("/").pop() || "Attachment"}
                                  </a>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons - Show for SUBMITTED, COMPLETED (for redo/remarks), or REDO (to re-evaluate) */}
                  {(sub.status === "SUBMITTED" ||
                    sub.status === "COMPLETED" ||
                    sub.status === "REDO") && (
                      <div className="mt-8 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            Admin Remarks (Optional)
                          </label>
                          <textarea
                            className="w-full text-sm p-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-24"
                            placeholder="Provide feedback for the fellow..."
                            value={remarks[sub._id] || ""}
                            onChange={(e) =>
                              setRemarks({
                                ...remarks,
                                [sub._id]: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 border-none h-11"
                            onClick={() => handleVerify(sub._id, "COMPLETED")}
                            disabled={
                              verifyingId === sub._id ||
                              sub.status === "COMPLETED"
                            }
                            isLoading={verifyingId === sub._id}
                            leftIcon={<CheckCircle2 size={18} />}
                          >
                            {sub.status === "COMPLETED" ? "Approved" : "Approve"}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-amber-200 text-amber-600 hover:bg-amber-50 h-11"
                            onClick={() => handleVerify(sub._id, "REDO")}
                            disabled={verifyingId === sub._id}
                            isLoading={verifyingId === sub._id}
                            leftIcon={<RefreshCcw size={18} />}
                          >
                            Request Redo
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-11"
                            onClick={() => handleVerify(sub._id, "REJECTED")}
                            disabled={verifyingId === sub._id}
                            isLoading={verifyingId === sub._id}
                            leftIcon={<XCircle size={18} />}
                          >
                            Reject
                          </Button>
                        </div>

                        {/* Redo Due Date Picker */}
                        <div className="pt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                            <CalendarIcon size={14} /> New Due Date (Required for
                            Redo)
                          </div>
                          <input
                            type="datetime-local"
                            className="w-full text-sm p-3 rounded-xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={redoDueDates[sub._id] || ""}
                            onChange={(e) =>
                              setRedoDueDates({
                                ...redoDueDates,
                                [sub._id]: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Acceptance Modal */}
      <AnimatePresence>
        {showAcceptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle2
                  size={64}
                  className="mx-auto mb-4 text-green-500"
                />
              </motion.div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                Accepted!
              </h2>
              <p className="text-neutral-600">
                The task submission has been approved successfully.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskSubmissionsPage;
