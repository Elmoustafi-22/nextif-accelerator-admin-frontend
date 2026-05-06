import { useState } from "react";
import {
  X,
  Send,
  User,
  Mail,
  CheckCircle2,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import Input from "./Input";
import { cn } from "../utils/cn";
import axiosInstance from "../api/axiosInstance";

interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  avatar?: string;
  role: string;
  accountStatus: string;
  createdAt: string;
}

interface AdminDetailsModalProps {
  admin: Admin;
  isOpen: boolean;
  onClose: () => void;
}

const AdminDetailsModal = ({
  admin,
  isOpen,
  onClose,
}: AdminDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<"details" | "message">("details");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!admin) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await axiosInstance.post("/admin/internal-messages", {
        recipientId: admin._id,
        title: messageSubject,
        body: messageBody,
      });
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setMessageSubject("");
        setMessageBody("");
        setActiveTab("details");
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl uppercase shadow-sm overflow-hidden">
                  {admin.avatar ? (
                    <img
                      src={admin.avatar}
                      alt={admin.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {admin.firstName?.[0]}
                      {admin.lastName?.[0]}
                    </>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {admin.firstName} {admin.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        admin.accountStatus === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {admin.role}
                    </span>
                    <span className="text-xs text-neutral-500">
                      • {admin.title || "Administrator"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-100 px-6 bg-white">
              <button
                onClick={() => setActiveTab("details")}
                className={cn(
                  "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                )}
              >
                Profile Details
              </button>
              <button
                onClick={() => setActiveTab("message")}
                className={cn(
                  "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                  activeTab === "message"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                )}
              >
                Send Message
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === "details" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                      <div className="flex items-center gap-2 text-neutral-400 mb-2">
                        <Briefcase size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Position / Title
                        </span>
                      </div>
                      <p className="font-semibold text-neutral-900">
                        {admin.title || "Not specified"}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                      <div className="flex items-center gap-2 text-neutral-400 mb-2">
                        <User size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Role
                        </span>
                      </div>
                      <p className="font-semibold text-neutral-900">
                        {admin.role}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50 col-span-1 md:col-span-2">
                      <div className="flex items-center gap-2 text-neutral-400 mb-2">
                        <Mail size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Email Address
                        </span>
                      </div>
                      <p className="font-semibold text-neutral-900">
                        {admin.email}
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                      <div className="flex items-center gap-2 text-neutral-400 mb-2">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Account Status
                        </span>
                      </div>
                      <p className="font-semibold text-neutral-900">
                        {admin.accountStatus}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  {sendSuccess ? (
                    <div className="p-8 text-center bg-green-50 rounded-2xl border border-green-100 text-green-800">
                      <CheckCircle2
                        size={32}
                        className="mx-auto mb-2 text-green-500"
                      />
                      <h3 className="font-bold">Message Sent!</h3>
                      <p className="text-sm mt-1">
                        Your message has been delivered to {admin.firstName}'s
                        inbox.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Input
                        label="Subject"
                        placeholder="Project update..."
                        required
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                      />
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-neutral-700">
                          Message
                        </label>
                        <textarea
                          className="w-full min-h-[150px] px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                          placeholder={`Write a message to ${admin.firstName}...`}
                          required
                          value={messageBody}
                          onChange={(e) => setMessageBody(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          isLoading={isSending}
                          className="pl-6 pr-6"
                        >
                          <Send size={16} className="mr-2" /> Send Message
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdminDetailsModal;
