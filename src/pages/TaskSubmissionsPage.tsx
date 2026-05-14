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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <button
          onClick={() => navigate("/tasks")}
          className="group flex items-center gap-3 text-neutral-500 hover:text-neutral-900 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest border-none bg-transparent cursor-pointer self-start"
        >
          <div className="p-2 bg-white rounded-xl border border-neutral-100 group-hover:border-neutral-200 shadow-sm transition-all">
            <ArrowLeft size={18} />
          </div>
          Back to Tasks
        </button>
        <div className="text-left lg:text-right">
          <h1 className="text-xl md:text-3xl font-black font-heading text-neutral-900 tracking-tight">
            {task.title}
          </h1>
          <p className="text-[10px] md:text-xs text-neutral-400 font-black uppercase tracking-widest mt-1">
            Managing operational submissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-neutral-100 shadow-sm w-fit min-w-full sm:min-w-0">
          {[
            { id: "UNVERIFIED", label: "Pending", count: submissions.filter(s => s.status === 'SUBMITTED').length },
            { id: "VERIFIED", label: "Verified", count: submissions.filter(s => s.status === 'COMPLETED').length },
            { id: "REDO", label: "Redo", count: submissions.filter(s => s.status === 'REDO').length },
            { id: "REJECTED", label: "Rejected", count: submissions.filter(s => s.status === 'REJECTED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-sm font-black font-heading transition-all flex items-center gap-2 shrink-0 uppercase tracking-widest",
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
              )}
            >
              {tab.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px]",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Task Summary Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-neutral-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-[10px] md:text-xs font-black font-heading text-neutral-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
              Operational Protocol
            </h3>
            <div className="space-y-6">
              {(task.whatToDo || task.steps)?.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 shadow-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-black text-neutral-800 leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] md:text-xs text-neutral-400 leading-relaxed font-medium mt-1 opacity-80">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl md:rounded-[2rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-sm md:text-base font-black font-heading mb-4 flex items-center gap-3 relative z-10">
                <AlertCircle size={20} className="text-blue-400" /> Scoring Guide
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-medium relative z-10">
                Assign a grade between 1 and 5. The selected value will be awarded as operational points to the fellow profile upon successful verification.
              </p>
            </div>
        </div>

        {/* Submissions List Column */}
        <div className="lg:col-span-2 space-y-6">
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl md:rounded-[3rem] border border-dashed border-neutral-200 p-10 md:p-24 text-center">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-neutral-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                <ListChecks className="text-neutral-300 md:w-12 md:h-12" size={32} />
              </div>
              <h3 className="text-lg md:text-2xl font-black font-heading text-neutral-900 tracking-tight">No submissions detected</h3>
              <p className="text-sm md:text-lg text-neutral-500 mt-2 font-medium max-w-sm mx-auto leading-relaxed">
                There are no mission records in the {activeTab.toLowerCase()} category at this time.
              </p>
            </div>
          ) : (
            filteredSubmissions.map((sub: any) => (
              <div
                key={sub._id}
                className="bg-white rounded-2xl md:rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group"
              >
                <div className="p-6 md:p-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 md:mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm md:text-lg shadow-sm">
                        {sub.ambassadorId?.firstName?.[0]}
                        {sub.ambassadorId?.lastName?.[0]}
                      </div>
                      <div>
                        <h4 className="font-black font-heading text-neutral-900 text-base md:text-xl">
                          {sub.ambassadorId?.firstName}{" "}
                          {sub.ambassadorId?.lastName}
                        </h4>
                        <p className="text-[10px] md:text-xs text-neutral-400 flex items-center gap-1.5 font-black uppercase tracking-widest mt-1">
                          <Clock size={14} className="text-neutral-300" />{" "}
                          {new Date(sub.submittedAt).toLocaleDateString()} @ {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {sub.reviewedBy && (
                      <div className="text-left sm:text-right bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100">
                        <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest block mb-0.5">Verified By</span>
                        <span className="text-[11px] text-blue-600 font-black uppercase tracking-wider">
                          {sub.reviewedBy.title || "Elite Admin"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                    {(task.whatToDo || task.steps)?.map((guide: any, idx: number) => {
                      const response = sub.responses?.find((r: any) => r.whatToDoId === guide._id);
                      return (
                        <div key={guide._id || idx} className="p-5 md:p-6 bg-neutral-50 rounded-2xl md:rounded-[2rem] border border-neutral-100/50 shadow-inner group/resp transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{idx + 1}. {guide.title}</p>
                          </div>
                          <p className="text-sm md:text-base text-neutral-800 font-medium leading-relaxed italic">{response?.text || "No operational report provided."}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {sub.links?.length > 0 && sub.links[0] !== "" && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Mission Intelligence (Links)</label>
                        <div className="space-y-2">
                          {sub.links.filter(Boolean).map((link: string, lIdx: number) => (
                            <a key={lIdx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl text-xs text-blue-600 hover:bg-blue-50 transition-all font-black uppercase tracking-wider border border-blue-100/50">
                              <ExternalLink size={14} /> {link.length > 25 ? link.substring(0, 25) + '...' : link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {sub.proofFiles?.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Operational Assets (Files)</label>
                        <div className="space-y-2">
                          {sub.proofFiles.filter(Boolean).map((file: string, fIdx: number) => (
                            <a key={fIdx} href={file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl text-xs text-neutral-600 hover:text-blue-600 hover:bg-white transition-all font-black uppercase tracking-wider border border-neutral-100/50 shadow-sm">
                              <Paperclip size={14} /> {file?.split("/").pop()?.substring(0, 20)}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 md:pt-10 border-t border-neutral-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">
                          Mission Performance (1-5)
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {[1, 2, 3, 4, 5].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setSelectedGrades({ ...selectedGrades, [sub._id]: g })}
                              className={cn(
                                "w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl font-black transition-all border-2",
                                (selectedGrades[sub._id] || sub.grade) === g
                                  ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20 scale-110"
                                  : "bg-white border-neutral-100 text-neutral-400 hover:border-blue-600/30 hover:text-blue-600"
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">
                          Elite Feedback / Debrief
                        </label>
                        <textarea
                          className="w-full text-sm md:text-base font-medium p-4 md:p-5 rounded-xl md:rounded-2xl bg-neutral-50 border border-neutral-100 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all resize-none h-24 md:h-28 placeholder:text-neutral-300"
                          placeholder="Provide detailed mission feedback..."
                          value={remarks[sub._id] || sub.adminFeedback || ""}
                          onChange={(e) => setRemarks({ ...remarks, [sub._id]: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 border-none h-12 md:h-14 rounded-xl md:rounded-2xl font-black font-heading shadow-xl shadow-green-600/20"
                        onClick={() => handleVerify(sub._id, "COMPLETED")}
                        disabled={verifyingId === sub._id || sub.status === "COMPLETED"}
                        isLoading={verifyingId === sub._id}
                        leftIcon={<CheckCircle2 size={20} />}
                      >
                        {sub.status === "REJECTED" ? "Reverse & Award Points" : "Verify Mission"}
                      </Button>

                      <div className="flex gap-3 flex-1">
                        {sub.status !== 'REDO' && (
                          <Button
                            variant="outline"
                            className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 h-12 md:h-14 rounded-xl md:rounded-2xl font-black font-heading"
                            onClick={() => handleVerify(sub._id, "REDO")}
                            disabled={verifyingId === sub._id}
                            isLoading={verifyingId === sub._id}
                            leftIcon={<RefreshCcw size={18} />}
                          >
                            Redo
                          </Button>
                        )}

                        {sub.status !== 'REJECTED' && (
                          <Button
                            variant="outline"
                            className="flex-1 border-red-100 text-red-600 hover:bg-red-50 h-12 md:h-14 rounded-xl md:rounded-2xl font-black font-heading"
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
