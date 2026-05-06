import { useState, useEffect } from "react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* ... header content ... */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Ambassador Management
          </h1>
          <p className="text-neutral-500 text-sm">
            View, onboard, and manage all ambassadors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} /> Export
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} /> New Ambassador
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex flex-col lg:flex-row gap-4">
        {/* ... filters content ... */}
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={18} className="text-neutral-400" />}
            className="h-11"
          />
        </div>
        <div className="flex gap-4">
          <select
            className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-heading font-bold text-neutral-400 uppercase tracking-wider">
                  Ambassador
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-heading font-bold text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-heading font-bold text-neutral-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-heading font-bold text-neutral-400 uppercase tracking-wider text-right">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-100 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-100 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-100 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-neutral-100 rounded w-10 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : ambassadors.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-neutral-500"
                  >
                    No ambassadors found matching your criteria.
                  </td>
                </tr>
              ) : (
                ambassadors.map((ambassador: any) => (
                  <tr
                    key={ambassador._id}
                    className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(ambassador)}
                  >
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                          {ambassador.firstName?.[0]}
                          {ambassador.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-neutral-900">
                            {ambassador.firstName} {ambassador.lastName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {ambassador.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          ambassador.accountStatus === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : ambassador.accountStatus === "SUSPENDED"
                              ? "bg-red-100 text-red-700"
                              : ambassador.accountStatus === "PASSWORD_PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {ambassador.accountStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-neutral-500">
                      {new Date(ambassador.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                      <button className="text-neutral-400 hover:text-blue-600 transition-colors">
                        <UserPlus size={18} className="rotate-45" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
            <p className="text-xs text-neutral-500 font-medium">
              Showing <span className="text-neutral-900">{meta.total}</span>{" "}
              ambassadors
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                        page === p
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "text-neutral-500 hover:bg-neutral-100"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
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

      {/* Add Ambassador Modal */}
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
                    Add Ambassador
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
