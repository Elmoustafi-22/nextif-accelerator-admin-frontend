import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Download,
  X,
  UserPlus2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/Button";
import Input from "../components/Input";
import { cn } from "../utils/cn";
import { motion } from "framer-motion";
import { toast } from "../store/useToastStore";

import FellowDetailsModal from "../components/FellowDetailsModal";

const FellowsListPage = () => {
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAmbassador, setSelectedAmbassador] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [formError, setFormError] = useState("");
  const [newAmbassador, setNewAmbassador] = useState({
    firstName: "",
    lastName: "",
    email: "",
    institution: "",
    courseOfStudy: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    facebook: "",
  });

  const fetchAmbassadors = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/admin/ambassadors", {
        params: { search, status: statusFilter, page },
      });
      setAmbassadors(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Error fetching ambassadors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadors();
  }, [search, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await axiosInstance.patch(`/admin/ambassadors/${id}/status`, {
        status: newStatus,
      });
      fetchAmbassadors();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleForceReset = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to force a password reset for this ambassador?"
      )
    ) {
      try {
        await axiosInstance.post(`/admin/ambassadors/${id}/force-reset`);
        toast.success("Password reset triggered successfully.");
        fetchAmbassadors();
      } catch (error) {
        console.error("Error resetting password:", error);
      }
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      await axiosInstance.post("/admin/ambassadors", newAmbassador);
      setIsModalOpen(false);
      setNewAmbassador({
        firstName: "",
        lastName: "",
        email: "",
        institution: "",
        courseOfStudy: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        facebook: "",
      });
      fetchAmbassadors();
    } catch (error: any) {
      setFormError(error.response?.data?.message || "Failed to add ambassador");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await axiosInstance.get("/admin/ambassadors/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `fellows_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Fellow list exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export fellow list");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/admin/ambassadors/${id}`);
      setIsDetailsModalOpen(false);
      fetchAmbassadors();
    } catch (error) {
      console.error("Error deleting ambassador:", error);
    }
  };

  const handleRowClick = (ambassador: any) => {
    setSelectedAmbassador(ambassador);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-heading text-neutral-900 tracking-tight">
            Fellow Management
          </h1>
          <p className="text-neutral-500 text-sm md:text-base font-medium">
            View, onboard, and manage all fellows.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none gap-2 h-10 md:h-11 rounded-xl md:rounded-2xl text-xs md:text-sm font-black font-heading"
            onClick={handleExport}
            isLoading={isExporting}
          >
            <Download size={16} /> Export
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none gap-2 h-10 md:h-11 rounded-xl md:rounded-2xl text-xs md:text-sm font-black font-heading"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} /> New Fellow
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-neutral-100 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="flex-1 relative group">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            <option value="ACTIVE">Active</option>
            <option value="PRELOADED">Preloaded</option>
            <option value="PASSWORD_PENDING">Password Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="px-6 py-5 text-[10px] font-heading font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Fellow Information
                </th>
                <th className="px-6 py-5 text-[10px] font-heading font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Account Status
                </th>
                <th className="px-6 py-5 text-[10px] font-heading font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Registration
                </th>
                <th className="px-6 py-5 text-[10px] font-heading font-black text-neutral-400 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 bg-neutral-100 rounded w-32" />
                          <div className="h-3 bg-neutral-100 rounded w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-neutral-100 rounded-full w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-100 rounded w-24" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 w-8 bg-neutral-100 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                ambassadors.map((ambassador: any) => (
                  <tr
                    key={ambassador._id}
                    className="hover:bg-neutral-50/50 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(ambassador)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm group-hover:scale-110 transition-transform">
                          {ambassador.firstName?.[0]}
                          {ambassador.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-heading font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                            {ambassador.firstName} {ambassador.lastName}
                          </p>
                          <p className="text-xs text-neutral-400 font-medium">
                            {ambassador.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          ambassador.accountStatus === "ACTIVE"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : ambassador.accountStatus === "SUSPENDED"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : ambassador.accountStatus === "PASSWORD_PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                        )}
                      >
                        {ambassador.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 font-medium">
                      {new Date(ambassador.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <div className="w-8 h-8 rounded-lg bg-neutral-50 text-neutral-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Card Layout */}
        <div className="md:hidden divide-y divide-neutral-50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-neutral-100 rounded w-2/3" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-neutral-100 rounded-full w-24" />
                  <div className="h-4 bg-neutral-100 rounded w-20" />
                </div>
              </div>
            ))
          ) : (
            ambassadors.map((ambassador: any) => (
              <div
                key={ambassador._id}
                className="p-5 active:bg-neutral-50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(ambassador)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm uppercase shadow-sm shrink-0">
                    {ambassador.firstName?.[0]}
                    {ambassador.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-neutral-900 truncate">
                      {ambassador.firstName} {ambassador.lastName}
                    </p>
                    <p className="text-xs text-neutral-400 font-medium truncate">
                      {ambassador.email}
                    </p>
                  </div>
                  <ChevronRight size={18} className="ml-auto text-neutral-300" />
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      ambassador.accountStatus === "ACTIVE"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : ambassador.accountStatus === "SUSPENDED"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : ambassador.accountStatus === "PASSWORD_PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                    )}
                  >
                    {ambassador.accountStatus}
                  </span>
                  <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                    Joined {new Date(ambassador.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-4 md:px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] md:text-xs text-neutral-400 font-black uppercase tracking-widest">
              Showing <span className="text-neutral-900">{ambassadors.length}</span> of <span className="text-neutral-900">{meta.total}</span> fellows
            </p>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 md:h-9 w-8 md:w-9 p-0 rounded-lg md:rounded-xl"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                  .map((p, index, array) => (
                    <React.Fragment key={p}>
                      {index > 0 && array[index - 1] !== p - 1 && (
                        <span className="text-neutral-300 px-1">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={cn(
                          "w-8 md:w-9 h-8 md:h-9 rounded-lg md:rounded-xl text-xs font-black transition-all",
                          page === p
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "text-neutral-500 hover:bg-white hover:shadow-sm"
                        )}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 md:h-9 w-8 md:w-9 p-0 rounded-lg md:rounded-xl"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <FellowDetailsModal
        fellow={selectedAmbassador}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onStatusUpdate={handleStatusUpdate}
        onForceReset={handleForceReset}
        onDelete={handleDelete}
      />

      {/* Add Fellow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <UserPlus2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">
                    Add Fellow
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    Create a new ambassador account
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

            <form onSubmit={handleAddNew} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  required
                  value={newAmbassador.firstName}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      firstName: e.target.value,
                    })
                  }
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  required
                  value={newAmbassador.lastName}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                placeholder="john.doe@example.com"
                required
                value={newAmbassador.email}
                onChange={(e) =>
                  setNewAmbassador({ ...newAmbassador, email: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Institution"
                  placeholder="NextIF Institution"
                  value={newAmbassador.institution}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      institution: e.target.value,
                    })
                  }
                />
                <Input
                  label="Course of Study"
                  placeholder="Computer Science"
                  value={newAmbassador.courseOfStudy}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      courseOfStudy: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Instagram"
                  placeholder="@username"
                  value={newAmbassador.instagram}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      instagram: e.target.value,
                    })
                  }
                />
                <Input
                  label="Twitter (X)"
                  placeholder="@username"
                  value={newAmbassador.twitter}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      twitter: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="LinkedIn"
                  placeholder="Profile URL"
                  value={newAmbassador.linkedin}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      linkedin: e.target.value,
                    })
                  }
                />
                <Input
                  label="Facebook"
                  placeholder="facebook.com/username"
                  value={newAmbassador.facebook}
                  onChange={(e) =>
                    setNewAmbassador({
                      ...newAmbassador,
                      facebook: e.target.value,
                    })
                  }
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <ShieldAlert size={14} />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Create Account
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FellowsListPage;
