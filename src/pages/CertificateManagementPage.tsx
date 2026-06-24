import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Search,
  Upload,
  Eye,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  RefreshCcw,
  GraduationCap,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import axiosInstance from "../api/axiosInstance";
import Input from "../components/Input";
import Button from "../components/Button";
import { toast } from "../store/useToastStore";

interface FellowProfile {
  phone?: string;
  avatar?: string;
  institution?: string;
  courseOfStudy?: string;
  hasPaidCertificate?: boolean;
  certificatePaymentDate?: string;
  certificateUrl?: string;
}

interface FellowRecord {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountStatus: string;
  profile?: FellowProfile;
  createdAt: string;
}

const CertificateManagementPage = () => {
  const { user } = useAuthStore();
  const [fellows, setFellows] = useState<FellowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "uploaded">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalFellows: 0,
    pendingUpload: 0,
    uploaded: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFellow, setSelectedFellow] = useState<FellowRecord | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFellow, setPreviewFellow] = useState<FellowRecord | null>(null);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

  // Verify access privileges dynamically
  // Super admins (CEO / Tech Lead) + Attendance Team Lead can access this page
  const titleLower = (user?.title || "").toLowerCase().trim();
  const isSuperAdmin =
    titleLower === "tech lead" ||
    titleLower === "ceo" ||
    titleLower === "chief executive officer";
  const isAttendanceTeamLead = titleLower === "attendance team lead";
  const hasCertificateAccess = isSuperAdmin || isAttendanceTeamLead;

  const fetchStats = async () => {
    try {
      const [allRes, pendingRes, uploadedRes] = await Promise.all([
        axiosInstance.get("/admin/ambassadors", {
          params: { limit: 1 },
        }),
        axiosInstance.get("/admin/ambassadors", {
          params: { hasPaidCertificate: "true", certificateStatus: "pending", limit: 1 },
        }),
        axiosInstance.get("/admin/ambassadors", {
          params: { certificateStatus: "uploaded", limit: 1 },
        }),
      ]);

      setStats({
        totalFellows: allRes.data.meta?.total || 0,
        pendingUpload: pendingRes.data.meta?.total || 0,
        uploaded: uploadedRes.data.meta?.total || 0,
      });
    } catch (err) {
      console.error("Failed to fetch certificate stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFellows = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (activeTab === "pending") {
        params.hasPaidCertificate = "true";
        params.certificateStatus = "pending";
        params.sortBy = "profile.certificatePaymentDate";
        params.sortOrder = "asc";
      } else if (activeTab === "uploaded") {
        params.certificateStatus = "uploaded";
      }

      const response = await axiosInstance.get("/admin/ambassadors", { params });
      setFellows(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalCount(response.data.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch fellows:", err);
      toast.error("Failed to load fellows checklist.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page, tab, or search changes
  useEffect(() => {
    if (!hasCertificateAccess) return;
    fetchFellows();
  }, [page, activeTab, hasCertificateAccess]);

  // Handle search with debounce/trigger
  useEffect(() => {
    if (!hasCertificateAccess) return;
    setPage(1);
    const delayDebounceFn = setTimeout(() => {
      fetchFellows();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, hasCertificateAccess]);

  // Load stats initially
  useEffect(() => {
    if (!hasCertificateAccess) return;
    fetchStats();
  }, [hasCertificateAccess]);

  // Guard routing — only super admins and attendance team lead allowed
  if (!hasCertificateAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Handle Tab Switch
  const handleTabChange = (tab: "all" | "pending" | "uploaded") => {
    setActiveTab(tab);
    setPage(1);
  };

  // Upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PDF and Images (PNG/JPG) are allowed.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenUploadModal = (fellow: FellowRecord) => {
    setSelectedFellow(fellow);
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFellow(null);
    handleCancelUpload();
  };

  const handleConfirmUpload = async () => {
    if (!selectedFellow || !selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    try {
      await axiosInstance.post(
        `/admin/ambassadors/${selectedFellow._id}/certificate`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(`Certificate for ${selectedFellow.firstName} uploaded successfully!`);
      handleCloseUploadModal();
      fetchFellows();
      fetchStats();
    } catch (error: any) {
      console.error("Certificate upload failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to upload certificate"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenPreview = (fellow: FellowRecord) => {
    setPreviewFellow(fellow);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-neutral-900 flex items-center gap-3">
            <Award className="text-blue-600" size={32} /> Certificate Upload Management
          </h1>
          <p className="text-neutral-500 mt-1">
            Manage and upload official certificates for fellows who have completed their program payment.
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchFellows();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 bg-white hover:bg-neutral-50 active:scale-95 transition-all self-start md:self-auto"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* Analytics/Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              Total Fellows
            </p>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">
              {loadingStats ? "..." : stats.totalFellows}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              Paid (Pending Upload)
            </p>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">
              {loadingStats ? "..." : stats.pendingUpload}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              Total Uploaded
            </p>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">
              {loadingStats ? "..." : stats.uploaded}
            </h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Table Controls / Tabs */}
        <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/20">
          {/* Tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => handleTabChange("all")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              All Fellows ({stats.totalFellows})
            </button>
            <button
              onClick={() => handleTabChange("pending")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "pending"
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              Paid & Pending ({stats.pendingUpload})
            </button>
            <button
              onClick={() => handleTabChange("uploaded")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "uploaded"
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              Uploaded ({stats.uploaded})
            </button>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Search fellow by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
        </div>

        {/* Loading state / Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={36} />
            <p className="text-neutral-500 text-sm font-medium">Fetching fellows list...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-xs font-black uppercase tracking-wider text-neutral-400 bg-neutral-50/50">
                  <th className="py-4 px-6">Fellow</th>
                  <th className="py-4 px-6">Institution / Course</th>
                  <th className="py-4 px-6">Payment Status</th>
                  <th className="py-4 px-6">Certificate</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {fellows.map((fellow) => {
                  const hasCert = !!fellow.profile?.certificateUrl;
                  const hasPaid = !!fellow.profile?.hasPaidCertificate;
                  return (
                    <tr
                      key={fellow._id}
                      className="text-sm hover:bg-neutral-50/30 transition-colors"
                    >
                      {/* Name and Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-100 text-neutral-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {fellow.firstName?.[0]}
                            {fellow.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 leading-tight">
                              {fellow.firstName} {fellow.lastName}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {fellow.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Institution / Course */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5 max-w-[200px] truncate">
                          <p className="font-medium text-neutral-800 text-xs flex items-center gap-1.5">
                            <GraduationCap size={13} className="text-neutral-400" />
                            {fellow.profile?.institution || "Not specified"}
                          </p>
                          <p className="text-[11px] text-neutral-500 pl-4">
                            {fellow.profile?.courseOfStudy || "Not specified"}
                          </p>
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-6">
                        {hasPaid ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 w-fit">
                              <CheckCircle2 size={12} /> Paid
                            </span>
                            {fellow.profile?.certificatePaymentDate && (
                              <span className="text-[10px] text-neutral-400 pl-1 mt-0.5 font-medium">
                                {new Date(fellow.profile.certificatePaymentDate).toLocaleDateString("en-US", {
                                  dateStyle: "medium",
                                })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-500 w-fit">
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            hasCert ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {hasCert ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {hasCert ? "Uploaded" : "Pending"}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {hasCert ? (
                            <>
                              <button
                                onClick={() => handleOpenPreview(fellow)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-bold text-neutral-600 bg-white hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                onClick={() => handleOpenUploadModal(fellow)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/70 text-xs font-bold text-blue-600 active:scale-95 transition-all cursor-pointer"
                              >
                                <Upload size={13} /> Update
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenUploadModal(fellow)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm shadow-blue-200 active:scale-95 transition-all cursor-pointer"
                            >
                              <Upload size={13} /> Upload Certificate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {fellows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-400">
                      <Award size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-semibold text-neutral-500">No fellows found</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        No fellows matching the tab/search criteria were found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-6 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/20">
            <span className="text-xs text-neutral-500">
              Showing Page {page} of {totalPages} ({totalCount} total results)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 border border-neutral-200 text-xs font-bold rounded-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 border border-neutral-200 text-xs font-bold rounded-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload/Update Modal */}
      <AnimatePresence>
        {isUploadModalOpen && selectedFellow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button
                onClick={handleCloseUploadModal}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-colors"
                disabled={isUploading}
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-heading font-black text-neutral-900 mb-1">
                {selectedFellow.profile?.certificateUrl ? "Update Certificate" : "Upload Certificate"}
              </h2>
              <p className="text-sm text-neutral-500">
                For fellow: <span className="font-bold text-neutral-800">{selectedFellow.firstName} {selectedFellow.lastName}</span> ({selectedFellow.email})
              </p>

              {/* Drag and Drop Zone */}
              {!previewUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-6 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/30"
                      : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                    <Upload size={22} />
                  </div>
                  <p className="text-sm font-bold text-neutral-800 mb-1">
                    Drag and drop your file here, or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:underline font-bold cursor-pointer bg-transparent border-0 outline-none"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-neutral-400">
                    Supports PDF, PNG, JPG, or JPEG (Max 10MB)
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                </div>
              ) : (
                /* Preview State */
                <div className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                      <FileText size={18} className="text-blue-600" />
                      <span className="text-xs font-semibold text-neutral-700 truncate">
                        {selectedFile?.name}
                      </span>
                    </div>
                    <button
                      onClick={handleCancelUpload}
                      disabled={isUploading}
                      className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="w-full aspect-[4/3] bg-neutral-100 rounded-2xl border border-neutral-200 overflow-hidden relative">
                    {selectedFile?.type === "application/pdf" ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title="Certificate PDF Preview"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        className="w-full h-full object-contain"
                        alt="Certificate Preview"
                      />
                    )}
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={handleCloseUploadModal}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      isLoading={isUploading}
                      onClick={handleConfirmUpload}
                    >
                      Confirm & Upload
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Certificate Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && previewFellow && previewFellow.profile?.certificateUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl relative flex flex-col h-[85vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setPreviewFellow(null);
                }}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="mb-4">
                <h2 className="text-xl font-heading font-black text-neutral-900 leading-tight">
                  Certificate Preview
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Fellow: <span className="font-semibold">{previewFellow.firstName} {previewFellow.lastName}</span> ({previewFellow.email})
                </p>
              </div>

              {/* Certificate Container */}
              <div className="flex-1 w-full bg-neutral-100 rounded-2xl border border-neutral-200 overflow-hidden relative mb-4">
                {previewFellow.profile.certificateUrl.toLowerCase().endsWith(".pdf") || 
                 previewFellow.profile.certificateUrl.includes("/pdf") ? (
                  <iframe
                    src={`${previewFellow.profile.certificateUrl}#toolbar=1`}
                    className="w-full h-full border-0"
                    title="Uploaded Certificate PDF"
                  />
                ) : (
                  <img
                    src={previewFellow.profile.certificateUrl}
                    className="w-full h-full object-contain"
                    alt="Uploaded Certificate"
                  />
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 justify-end items-center">
                <a
                  href={previewFellow.profile.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-bold text-xs rounded-xl transition-colors"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    handleOpenUploadModal(previewFellow);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Update File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificateManagementPage;
