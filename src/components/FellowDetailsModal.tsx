import { useState } from "react";
import {
  X,
  ShieldAlert,
  CheckCircle2,
  RefreshCcw,
  Trash2,
  Send,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import Input from "./Input";
import { cn } from "../utils/cn";
import axiosInstance from "../api/axiosInstance";
import { toast } from "../store/useToastStore";

interface FellowDetailsModalProps {
  fellow: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onForceReset: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const FellowDetailsModal = ({
  fellow,
  isOpen,
  onClose,
  onStatusUpdate,
  onForceReset,
  onDelete,
}: FellowDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<"details" | "message">("details");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    institution: "",
    courseOfStudy: "",
    phone: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    facebook: "",
  });

  if (!fellow) return null;

  const handleEditClick = () => {
    setEditForm({
      firstName: fellow.firstName || "",
      lastName: fellow.lastName || "",
      email: fellow.email || "",
      institution: fellow.profile?.institution || "",
      courseOfStudy: fellow.profile?.courseOfStudy || "",
      phone: fellow.profile?.phone || "",
      instagram: fellow.profile?.instagram || "",
      twitter: fellow.profile?.twitter || "",
      linkedin: fellow.profile?.linkedin || "",
      facebook: fellow.profile?.facebook || "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await axiosInstance.patch(`/admin/ambassadors/${fellow._id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        institution: editForm.institution,
        courseOfStudy: editForm.courseOfStudy,
        phone: editForm.phone,
        instagram: editForm.instagram,
        twitter: editForm.twitter,
        linkedin: editForm.linkedin,
        facebook: editForm.facebook,
      });
      setIsEditing(false);
      // We rely on the parent to refetch or we could just update the local state if passed as prop
      // But usually in this app pattern, we refetch the list.
      // Calling onClose to force refresh on parent or we can just hope parent refreshes
      toast.success("Fellows updated successfully!");
      // window.location.reload(); // Removing reload to let toast be seen before refresh if any
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error("Error updating fellow:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update fellow";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await axiosInstance.post("/admin/messages", {
        ambassadorId: fellow._id,
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

  const handleDeleteClick = () => {
    if (
      confirm(
        `Are you sure you want to PERMANENTLY DELETE ${fellow.firstName} ${fellow.lastName}? This action cannot be undone.`
      )
    ) {
      onDelete(fellow._id);
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
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl uppercase shadow-sm">
                  {fellow.firstName?.[0]}
                  {fellow.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-neutral-900">
                      {fellow.firstName} {fellow.lastName}
                    </h2>
                    {!isEditing && activeTab === "details" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditClick}
                        className="h-8 px-3 text-xs bg-neutral-100 hover:bg-neutral-200"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        fellow.accountStatus === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : fellow.accountStatus === "SUSPENDED"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {fellow.accountStatus}
                    </span>
                    <span className="text-xs text-neutral-500">
                      • {fellow.email}
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
                onClick={() => {
                  setActiveTab("details");
                  setIsEditing(false);
                }}
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
                onClick={() => {
                  setActiveTab("message");
                  setIsEditing(false);
                }}
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
                <div className="space-y-8">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              firstName: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Last Name"
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Input
                        label="Email Address"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Institution"
                          value={editForm.institution}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              institution: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Course of Study"
                          value={editForm.courseOfStudy}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              courseOfStudy: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Phone Number"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Instagram"
                          value={editForm.instagram}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              instagram: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Twitter"
                          value={editForm.twitter}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              twitter: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="LinkedIn"
                          value={editForm.linkedin}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              linkedin: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Facebook"
                          value={editForm.facebook}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              facebook: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1"
                          isLoading={isSaving}
                          onClick={handleSaveEdit}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                          <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <Building2 size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Institution
                            </span>
                          </div>
                          <p className="font-semibold text-neutral-900">
                            {fellow.profile?.institution || "Not specified"}
                          </p>
                        </div>
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                          <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <User size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Course of Study
                            </span>
                          </div>
                          <p className="font-semibold text-neutral-900">
                            {fellow.profile?.courseOfStudy ||
                              "Not specified"}
                          </p>
                        </div>
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                          <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <Phone size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Phone
                            </span>
                          </div>
                          <p className="font-semibold text-neutral-900">
                            {fellow.profile?.phone || "Not specified"}
                          </p>
                        </div>
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                          <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <Mail size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Email
                            </span>
                          </div>
                          <p className="font-semibold text-neutral-900 break-all">
                            {fellow.email}
                          </p>
                        </div>
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                          <div className="flex items-center gap-2 text-neutral-400 mb-2">
                            <Calendar size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Joined Date
                            </span>
                          </div>
                          <p className="font-semibold text-neutral-900">
                            {new Date(
                              fellow.createdAt
                            ).toLocaleDateString()}
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
                            {fellow.role}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
                          Social Media
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100/50">
                            <Instagram size={18} className="text-neutral-400" />
                            <div>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                                Instagram
                              </p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {fellow.profile?.instagram || "Not linked"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100/50">
                            <Twitter size={18} className="text-neutral-400" />
                            <div>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                                Twitter
                              </p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {fellow.profile?.twitter || "Not linked"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100/50">
                            <Linkedin size={18} className="text-neutral-400" />
                            <div>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                                LinkedIn
                              </p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {fellow.profile?.linkedin || "Not linked"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100/50">
                            <Facebook size={18} className="text-neutral-400" />
                            <div>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                                Facebook
                              </p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {fellow.profile?.facebook || "Not linked"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
                          Account Actions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {fellow.accountStatus === "ACTIVE" ? (
                            <Button
                              variant="outline"
                              className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 justify-start"
                              onClick={() =>
                                onStatusUpdate(fellow._id, "SUSPENDED")
                              }
                            >
                              <ShieldAlert size={16} className="mr-2" /> Suspend
                              Account
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-200 justify-start"
                              onClick={() =>
                                onStatusUpdate(fellow._id, "ACTIVE")
                              }
                            >
                              <CheckCircle2 size={16} className="mr-2" />{" "}
                              Activate Account
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            className="bg-white hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 justify-start"
                            onClick={() => onForceReset(fellow._id)}
                          >
                            <RefreshCcw size={16} className="mr-2" /> Force
                            Password Reset
                          </Button>

                          <Button
                            variant="outline"
                            className="bg-white text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 justify-start col-span-1 sm:col-span-2 mt-2"
                            onClick={handleDeleteClick}
                          >
                            <Trash2 size={16} className="mr-2" /> Delete
                            Fellow Permanently
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
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
                        Your message has been delivered to the fellow's
                        inbox.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Input
                        label="Subject"
                        placeholder="Regarding your recent task..."
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
                          placeholder="Write your message here..."
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

export default FellowDetailsModal;
