import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  User,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download,
  Plus,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import axiosInstance from "../api/axiosInstance";
import Input from "../components/Input";

interface PaymentRecord {
  _id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  receiptUrl?: string;
  ambassadorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

const PaymentsPage = () => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fellows, setFellows] = useState<any[]>([]);
  const [fetchingFellows, setFetchingFellows] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualPayment, setManualPayment] = useState({
    ambassadorId: "",
    amount: "45000",
    paymentMethod: "Bank Transfer",
  });

  const [dropdownSearch, setDropdownSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredFellows = fellows.filter((fellow) => {
    const fullName = `${fellow.firstName || ""} ${fellow.lastName || ""}`.toLowerCase();
    const email = (fellow.email || "").toLowerCase();
    const search = dropdownSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleOpenManualModal = async () => {
    setIsModalOpen(true);
    if (fellows.length === 0) {
      setFetchingFellows(true);
      try {
        const res = await axiosInstance.get("/admin/ambassadors", {
          params: { limit: 10000 },
        });
        setFellows(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch fellows", err);
      } finally {
        setFetchingFellows(false);
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayment.ambassadorId) return alert("Please select a fellow");
    
    setSubmittingManual(true);
    try {
      await axiosInstance.post("/payments/manual", manualPayment);
      setIsModalOpen(false);
      setIsDropdownOpen(false);
      setDropdownSearch("");
      setManualPayment({ ambassadorId: "", amount: "45000", paymentMethod: "Bank Transfer" });
      
      // Refresh payments
      const response = await axiosInstance.get("/payments/records");
      setPayments(response.data);
    } catch (err: any) {
      console.error("Failed to record manual payment", err);
      alert(err.response?.data?.message || "Error recording manual payment.");
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleRegenerateReceipt = async (reference: string) => {
    setRegenerating((prev) => ({ ...prev, [reference]: true }));
    try {
      const res = await axiosInstance.post(`/payments/regenerate-receipt/${reference}`);
      // Update the local payment record with the new receipt URL
      setPayments((prev) =>
        prev.map((p) =>
          p.reference === reference ? { ...p, receiptUrl: res.data.receiptUrl } : p
        )
      );
    } catch (err) {
      console.error("Failed to regenerate receipt:", err);
      alert("Failed to regenerate receipt. Check console for details.");
    } finally {
      setRegenerating((prev) => ({ ...prev, [reference]: false }));
    }
  };

  // Verify Super Admin privileges dynamically
  const titleLower = (user?.title || "").toLowerCase().trim();
  const isSuperAdmin =
    titleLower === "tech lead" ||
    titleLower === "ceo" ||
    titleLower === "chief executive officer";

  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchPayments = async () => {
      try {
        const response = await axiosInstance.get("/payments/records");
        setPayments(response.data);
      } catch (error) {
        console.error("Failed to fetch payment records", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [isSuperAdmin]);

  // Guard routing
  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Calculate analytics
  const successfulPayments = payments.filter((p) => p.status?.toLowerCase() === "success");
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0) / 100;
  const totalTransactions = payments.length;
  const successRate =
    totalTransactions > 0
      ? Math.round((successfulPayments.length / totalTransactions) * 100)
      : 100;

  // Search & Filter
  const filteredPayments = payments
    .filter((p) => {
      const name = p.ambassadorId
        ? `${p.ambassadorId.firstName} ${p.ambassadorId.lastName}`
        : "Unknown Fellow";
      const email = p.ambassadorId?.email || "";
      const ref = p.reference || "";
      const search = searchTerm.toLowerCase();
      return (
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        ref.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-neutral-900 flex items-center gap-3">
          <CreditCard className="text-blue-600" size={32} /> Payments Ledger
        </h1>
        <p className="text-neutral-500 mt-1">
          Monitor certificate program transactions, aggregate revenues, and transaction states.
        </p>

      {/* Manual Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setIsDropdownOpen(false);
                setDropdownSearch("");
              }}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-heading font-black text-neutral-900 mb-1">
              Record Manual Payment
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Manually log a payment for a fellow who paid off-platform.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                  Select Fellow
                </label>
                {fetchingFellows ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
                    <Loader2 size={16} className="animate-spin" /> Loading fellows...
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all bg-white flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className={manualPayment.ambassadorId ? "text-neutral-900 font-medium" : "text-neutral-400"}>
                        {manualPayment.ambassadorId
                          ? (() => {
                              const selected = fellows.find(f => f._id === manualPayment.ambassadorId);
                              return selected
                                ? `${selected.firstName} ${selected.lastName} (${selected.email})`
                                : "Select a fellow...";
                            })()
                          : "Select a fellow..."}
                      </span>
                      <span className="ml-2 border-l pl-2 border-neutral-200 text-neutral-400 text-xs">
                        {isDropdownOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-[60] left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60"
                        >
                          <div className="p-2 border-b border-neutral-100 bg-neutral-50/50 sticky top-0">
                            <input
                              type="text"
                              placeholder="Type to search fellow..."
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-colors"
                              value={dropdownSearch}
                              onChange={(e) => setDropdownSearch(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto divide-y divide-neutral-50 flex-1">
                            {filteredFellows.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-neutral-400 text-center italic">
                                No matching fellows found
                              </div>
                            ) : (
                              filteredFellows.map((fellow) => (
                                <button
                                  key={fellow._id}
                                  type="button"
                                  onClick={() => {
                                    setManualPayment({ ...manualPayment, ambassadorId: fellow._id });
                                    setIsDropdownOpen(false);
                                    setDropdownSearch("");
                                  }}
                                  className={`w-full px-4 py-2 text-left text-xs hover:bg-neutral-50 transition-colors flex flex-col gap-0.5 cursor-pointer ${
                                    manualPayment.ambassadorId === fellow._id ? "bg-blue-50/50 text-blue-700 font-semibold" : "text-neutral-700"
                                  }`}
                                >
                                  <span>
                                    {fellow.firstName} {fellow.lastName}
                                  </span>
                                  <span className="text-neutral-400 text-[10px]">
                                    {fellow.email}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                  Amount (₦)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 45000"
                  value={manualPayment.amount}
                  onChange={(e) => setManualPayment({ ...manualPayment, amount: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                  Payment Method
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all bg-white"
                  value={manualPayment.paymentMethod}
                  onChange={(e) => setManualPayment({ ...manualPayment, paymentMethod: e.target.value })}
                  required
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Scholarship">Scholarship / Waiver</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingManual || !manualPayment.ambassadorId}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                >
                  {submittingManual ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Recording & Generating Receipt...
                    </>
                  ) : (
                    "Record & Generate Receipt"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-neutral-500 font-medium">Loading transactions...</p>
        </div>
      ) : (
        <>
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Total Revenue
                </p>
                <h3 className="text-2xl font-black text-neutral-900 mt-1">
                  {formatCurrency(totalRevenue)}
                </h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Total Transactions
                </p>
                <h3 className="text-2xl font-black text-neutral-900 mt-1">
                  {totalTransactions}
                </h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                <Percent size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Success Rate
                </p>
                <h3 className="text-2xl font-black text-neutral-900 mt-1">
                  {successRate}%
                </h3>
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/20">
              <div className="w-full md:w-96">
                <Input
                  placeholder="Search by fellow name, email, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={20} />}
                />
              </div>
              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                <button
                  onClick={toggleSort}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all"
                >
                  <ArrowUpDown size={16} /> Sort ({sortOrder === "asc" ? "Oldest" : "Newest"})
                </button>
                <button
                  onClick={handleOpenManualModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200"
                >
                  <Plus size={16} /> Record Payment
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-xs font-black uppercase tracking-wider text-neutral-400 bg-neutral-50/50">
                    <th className="py-4 px-6">Fellow</th>
                    <th className="py-4 px-6">Reference ID</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="text-sm hover:bg-neutral-50/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        {payment.ambassadorId ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-100 text-neutral-600 rounded-xl flex items-center justify-center font-bold text-sm uppercase">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900">
                                {payment.ambassadorId.firstName} {payment.ambassadorId.lastName}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {payment.ambassadorId.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-100 text-neutral-600 rounded-xl flex items-center justify-center font-bold text-sm uppercase">
                              <User size={16} />
                            </div>
                            <p className="font-medium text-neutral-400">Unknown Fellow</p>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-neutral-600">
                        {payment.reference}
                      </td>
                      <td className="py-4 px-6 font-bold text-neutral-900">
                        {formatCurrency(payment.amount / 100, payment.currency)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            payment.status?.toLowerCase() === "success"
                              ? "bg-green-50 text-green-700"
                              : payment.status?.toLowerCase() === "pending"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {payment.status?.toLowerCase() === "success" ? (
                            <CheckCircle2 size={12} />
                          ) : payment.status?.toLowerCase() === "pending" ? (
                            <Clock size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          <span className="capitalize">{payment.status?.toLowerCase()}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-neutral-500 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          {new Date(payment.createdAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {payment.receiptUrl ? (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer text-xs"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </a>
                        ) : payment.status?.toLowerCase() === "success" ? (
                          <button
                            onClick={() => handleRegenerateReceipt(payment.reference)}
                            disabled={regenerating[payment.reference]}
                            className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-800 font-bold transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {regenerating[payment.reference] ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Download size={13} />
                            )}
                            <span>{regenerating[payment.reference] ? "Generating…" : "Regenerate"}</span>
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-xs font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400">
                        <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-semibold text-neutral-500">No transactions found</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          No matches were found for "{searchTerm}".
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
