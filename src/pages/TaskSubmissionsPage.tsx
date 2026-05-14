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
  const [selectedGrades, setSelectedGrades] = useState<{ [key: string]: number }>({});
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"UNVERIFIED" | "VERIFIED" | "REDO" | "REJECTED">("UNVERIFIED");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [taskRes, submissionsRes] = await Promise.all([
          axiosInstance.get(`/tasks/${id}`),
          axiosInstance.get(`/tasks/submissions?taskId=${id}`),
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
    if ((status === "REDO" || status === "REJECTED") && !remarks[submissionId]) {
      toast.warning(`Please provide a reason for the ${status.toLowerCase()} request.`);
      return;
    }
    if (status === "COMPLETED" && !selectedGrades[submissionId]) {
      toast.warning("Please select a grade (1-5) before verifying.");
      return;
    }
    try {
      setVerifyingId(submissionId);
      const res = await axiosInstance.patch(
        `/tasks/submissions/${submissionId}/verify`,
        {
          status,
          feedback: remarks[submissionId] || "",
          grade: status === "COMPLETED" ? selectedGrades[submissionId] : undefined,
        }
      );

      setSubmissions((prev) =>
        prev.map((s) => (s._id === submissionId ? res.data : s))
      );

      setRemarks((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });

      if (status === "COMPLETED") {
        setShowAcceptModal(true);
        setTimeout(() => setShowAcceptModal(false), 2000);
      }
    } catch (err) {
      console.error("Verification failed:", err);
      toast.error("Failed to update status");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === "UNVERIFIED") return s.status === "SUBMITTED";
    if (activeTab === "VERIFIED") return s.status === "COMPLETED";
    if (activeTab === "REDO") return s.status === "REDO";
    if (activeTab === "REJECTED") return s.status === "REJECTED";
    return false;
  });

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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => navigate("/tasks")}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors font-medium border-none bg-transparent cursor-pointer w-fit"
        >
          <ArrowLeft size={20} /> Back to Tasks
        </button>
        <div className="text-left md:text-right">
          <h1 className="text-2xl font-bold font-heading text-neutral-900">
            {task.title}
          </h1>
          <p className="text-xs text-neutral-500 font-heading font-medium">
            Manage submissions for this one-time task
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-100 bg-white p-1 rounded-2xl shadow-sm w-fit">
        {[
          { id: "UNVERIFIED", label: "Unverified", count: submissions.filter(s => s.status === 'SUBMITTED').length },
          { id: "VERIFIED", label: "Verified", count: submissions.filter(s => s.status === 'COMPLETED').length },
          { id: "REDO", label: "Redo Requested", count: submissions.filter(s => s.status === 'REDO').length },
          { id: "REJECTED", label: "Rejected", count: submissions.filter(s => s.status === 'REJECTED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold font-heading transition-all flex items-center gap-2",
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px]",
              activeTab === tab.id ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Summary Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider text-[10px]">
              Task Instructions
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
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="font-bold font-heading mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-400" /> Verification Info
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Assign a grade between 1 and 5. The selected grade will be added as points to the fellow's profile upon verification.
              </p>
            </div>
        </div>

        {/* Submissions List Column */}
        <div className="lg:col-span-2 space-y-6">
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-4xl border border-dashed border-neutral-200 p-16 text-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ListChecks className="text-neutral-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">No submissions found</h3>
              <p className="text-sm text-neutral-500 mt-1">There are no tasks in the {activeTab.toLowerCase()} category.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub: any) => (
              <div
                key={sub._id}
                className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {sub.ambassadorId?.firstName?.[0]}
                        {sub.ambassadorId?.lastName?.[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">
                          {sub.ambassadorId?.firstName}{" "}
                          {sub.ambassadorId?.lastName}
                        </h4>
                        <p className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                          <Clock size={12} />{" "}
                          {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {sub.reviewedBy && (
                      <div className="text-right">
                        <span className="text-[9px] text-neutral-400 font-bold uppercase block">Last Reviewed By</span>
                        <span className="text-[11px] text-neutral-600 font-bold">
                          {sub.reviewedBy.title || "Administrator"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Responses */}
                  <div className="space-y-4 mb-6">
                    {(task.whatToDo || task.steps)?.map((guide: any, idx: number) => {
                      const response = sub.responses?.find((r: any) => r.whatToDoId === guide._id);
                      return (
                        <div key={guide._id || idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                          <p className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">{idx + 1}. {guide.title}</p>
                          <p className="text-sm text-neutral-800 font-medium">{response?.text || "No text provided"}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Attachments & Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {sub.links?.length > 0 && sub.links[0] !== "" && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Links</label>
                        {sub.links.filter(Boolean).map((link: string, lIdx: number) => (
                          <a key={lIdx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline font-bold">
                            <ExternalLink size={12} /> {link.length > 30 ? link.substring(0, 30) + '...' : link}
                          </a>
                        ))}
                      </div>
                    )}
                    {sub.proofFiles?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Attachments</label>
                        {sub.proofFiles.filter(Boolean).map((file: string, fIdx: number) => (
                          <a key={fIdx} href={file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-neutral-600 hover:text-blue-600 font-bold">
                            <Paperclip size={12} /> {file?.split("/").pop()?.substring(0, 20)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-neutral-50 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Assign Grade (Points)
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setSelectedGrades({ ...selectedGrades, [sub._id]: g })}
                              className={cn(
                                "w-10 h-10 rounded-xl font-bold transition-all border",
                                (selectedGrades[sub._id] || sub.grade) === g
                                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-110"
                                  : "bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300"
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          {activeTab === 'REDO' || activeTab === 'REJECTED' ? 'Update Feedback' : 'Admin Feedback / Redo Reason'}
                        </label>
                        <textarea
                          className="w-full text-sm p-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-20"
                          placeholder="Why is a redo needed? or General remarks..."
                          value={remarks[sub._id] || sub.adminFeedback || ""}
                          onChange={(e) => setRemarks({ ...remarks, [sub._id]: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 border-none h-11"
                        onClick={() => handleVerify(sub._id, "COMPLETED")}
                        disabled={verifyingId === sub._id || sub.status === "COMPLETED"}
                        isLoading={verifyingId === sub._id}
                        leftIcon={<CheckCircle2 size={18} />}
                      >
                        {sub.status === "REJECTED" ? "Reverse & Award Points" : "Verify & Award Points"}
                      </Button>

                      {sub.status !== 'REDO' && (
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
                      )}

                      {sub.status !== 'REJECTED' && (
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAcceptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
              <CheckCircle2 size={64} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Verified!</h2>
              <p className="text-neutral-600">Fellow has been notified and points awarded.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskSubmissionsPage;
