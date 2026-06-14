import { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  Send,
  History,
  CheckCircle2,
  Users,
  X,
  PlusCircle,
  Clock,
  ChevronRight,
  Bold,
  Italic,
  List,
  Code,
  Link as LinkIcon,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/Button";
import Input from "../components/Input";
import { cn } from "../utils/cn";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", body: "", link: "", targetGroup: "all" });
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Announcement Rich-formatting states
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get("/notifications/admin/history");
      const raw = response.data;
      const seen = new Set();
      const unique = raw.filter((item: any) => {
        const key = `${item.title}-${item.createdAt}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setAnnouncements(unique);
    } catch (error) {
      console.error("Error fetching announcement history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const res = await axiosInstance.post("/notifications/announcement", formData);
      setRecipientCount(res.data?.recipientCount ?? null);
      setSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormData({ title: "", body: "", link: "", targetGroup: "all" });
        setEditorMode("write");
        setSuccess(false);
        setRecipientCount(null);
        fetchHistory();
      }, 2000);
    } catch (error) {
      console.error("Error sending announcement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to insert markdown format at cursor position
  const insertFormat = (formatType: "bold" | "italic" | "link" | "list" | "code") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.body;
    const selectedText = text.substring(start, end);

    let replacement = "";
    let newCursorPos = start;

    switch (formatType) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 9);
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 11);
        break;
      case "link":
        replacement = `[${selectedText || "Link Text"}](https://example.com)`;
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 9);
        break;
      case "list":
        replacement = `\n- ${selectedText || "list item"}`;
        newCursorPos = start + 3 + (selectedText ? selectedText.length : 9);
        break;
      case "code":
        replacement = `\`${selectedText || "code snippet"}\``;
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 12);
        break;
    }

    const newBody = text.substring(0, start) + replacement + text.substring(end);
    setFormData({ ...formData, body: newBody });

    // Focus back on textarea and set selection range
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Client-side markdown renderer helper for live preview
  const formatBodyPreview = (text: string) => {
    if (!text) return "<p class='text-neutral-400 italic'>Nothing to preview yet...</p>";

    // Escape HTML to prevent custom HTML injections in preview
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italics
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");

    // Code
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-neutral-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-xs'>$1</code>");

    // Highlighted link style class
    const linkClass = "text-blue-600 font-bold underline bg-blue-50 px-1 py-0.5 rounded transition-colors hover:bg-blue-100";

    // Auto-link standalone URLs
    formatted = formatted.replace(/(?<!href=["'])(https?:\/\/[^\s<()]+)/g, `<a href='$1' class='${linkClass}' target='_blank' rel='noreferrer'>$1</a>`);

    // Markdown link
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, `<a href='$2' class='${linkClass}' target='_blank' rel='noreferrer'>$1</a>`);

    // Lists
    const lines = formatted.split("\n");
    let inList = false;
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemContent = trimmed.substring(2);
        let prefix = "";
        if (!inList) {
          inList = true;
          prefix = "<ul class='list-disc pl-5 my-2 space-y-1 text-neutral-600'>";
        }
        return `${prefix}<li>${itemContent}</li>`;
      } else {
        let suffix = "";
        if (inList) {
          inList = false;
          suffix = "</ul>";
        }
        return suffix + line;
      }
    });
    if (inList) {
      processedLines.push("</ul>");
    }

    formatted = processedLines.join("\n");
    formatted = formatted.replace(/\n/g, "<br />");
    return formatted;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Broadcast Announcements
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Send targeted alerts to all fellows or only those who haven't paid their certificate fee.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 h-11 px-6 shadow-xl shadow-blue-600/20"
        >
          <PlusCircle size={18} />
          New Announcement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Megaphone size={160} />
            </div>
            <div className="relative z-10">
              <p className="text-blue-100 text-sm font-heading font-bold uppercase tracking-wider">
                Total Broadcasts
              </p>
              <h2 className="text-5xl font-heading font-black mt-2">
                {announcements.length}
              </h2>
              <div className="mt-8 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                <Users size={14} className="text-blue-200" />
                <span className="text-[10px] font-heading font-black uppercase tracking-widest text-blue-50">
                  Global Reach
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-neutral-900 border-b border-neutral-50 pb-4">
              Guidelines
            </h3>
            <ul className="space-y-3">
              {[
                "Keep announcements concise and clear.",
                "Use for global events or platform updates.",
                "Avoid over-notifying users.",
                "Check for typos before broadcasting.",
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-500">
                  <div className="w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={12} className="text-blue-600" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* History List */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-4xl border border-neutral-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-neutral-50 flex items-center gap-3">
              <History size={20} className="text-neutral-400" />
              <h2 className="text-lg font-bold text-neutral-900">
                Broadcast History
              </h2>
            </div>

            <div className="flex-1">
              {loading ? (
                <div className="p-12 text-center animate-pulse">
                  Loading history...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Megaphone size={40} className="text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    No history yet
                  </h3>
                  <p className="text-neutral-500 mt-2">
                    Global announcements will be archived here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-50">
                  {announcements.map((item: any) => (
                    <div
                      key={item._id}
                      className="p-8 hover:bg-neutral-50/30 transition-all flex items-start gap-6 group"
                    >
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Megaphone size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-heading font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase py-1 px-3 bg-neutral-50 rounded-full">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl">
                          {item.body}
                        </p>
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          {item.link && (
                            <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                              <Send size={12} /> Link: {item.link}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-neutral-300 group-hover:text-blue-600 transition-colors self-center">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Announcement Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-neutral-100 my-auto"
            >
              <div className="p-6 sm:p-8 border-b border-neutral-50 flex justify-between items-center bg-neutral-50/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors duration-300",
                    formData.targetGroup === "unpaid"
                      ? "bg-amber-500 shadow-amber-500/30"
                      : "bg-blue-600 shadow-blue-600/30"
                  )}>
                    {formData.targetGroup === "unpaid" ? <CreditCard size={20} className="sm:w-6 sm:h-6" /> : <Megaphone size={20} className="sm:w-6 sm:h-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                      New Broadcast
                    </h2>
                    <p className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                      {formData.targetGroup === "unpaid" ? "Certificate Fee Reminder" : "Global Announcement"}
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

              <form onSubmit={handleSend} className="p-6 sm:p-8 space-y-4 sm:space-y-6">

                {/* Target Audience Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-heading font-bold text-neutral-900">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetGroup: "all" })}
                      className={cn(
                        "flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left",
                        formData.targetGroup === "all"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-neutral-100 bg-white text-neutral-500 hover:border-neutral-300"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                        formData.targetGroup === "all" ? "bg-blue-100" : "bg-neutral-100"
                      )}>
                        <Users size={16} className="sm:w-4.5 sm:h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">All Fellows</p>
                        <p className="text-[9px] sm:text-[11px] text-neutral-400 mt-0.5">Everyone on the platform</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetGroup: "unpaid" })}
                      className={cn(
                        "flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left",
                        formData.targetGroup === "unpaid"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-neutral-100 bg-white text-neutral-500 hover:border-neutral-300"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                        formData.targetGroup === "unpaid" ? "bg-amber-100" : "bg-neutral-100"
                      )}>
                        <CreditCard size={16} className="sm:w-4.5 sm:h-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Certificate Unpaid</p>
                        <p className="text-[9px] sm:text-[11px] text-neutral-400 mt-0.5">Haven't paid certificate fee</p>
                      </div>
                    </button>
                  </div>

                  {formData.targetGroup === "unpaid" && (
                    <div className="flex items-start gap-2 text-[10px] sm:text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>This will <strong>only</strong> reach fellows who have <strong>not yet paid their certificate fee</strong>. Fellows who have already paid will not receive this.</span>
                    </div>
                  )}
                </div>

                <Input
                  label="Announcement Title"
                  placeholder={formData.targetGroup === "unpaid" ? "e.g. Action Required: Pay Your Certificate Fee" : "e.g. Upcoming Meeting Reminder"}
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-12 sm:h-14 font-medium text-sm sm:text-base"
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-heading font-bold text-neutral-900 flex items-center gap-2">
                      Announcement Body
                      <span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-400 font-heading font-bold uppercase tracking-tighter italic hidden xs:inline">
                        Required
                      </span>
                    </label>

                    {/* Tab Switcher */}
                    <div className="flex bg-neutral-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEditorMode("write")}
                        className={cn(
                          "px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg transition-all",
                          editorMode === "write"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900"
                        )}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("preview")}
                        className={cn(
                          "px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg transition-all",
                          editorMode === "preview"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900"
                        )}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {editorMode === "write" ? (
                    <div className="space-y-2">
                      {/* Formatting Bar */}
                      <div className="flex items-center gap-0.5 sm:gap-1 bg-neutral-50 border border-neutral-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => insertFormat("bold")}
                          title="Bold (**bold**)"
                          className="p-2 hover:bg-neutral-200/60 rounded-lg sm:rounded-xl text-neutral-600 transition-colors flex items-center justify-center shrink-0"
                        >
                          <Bold size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat("italic")}
                          title="Italic (*italic*)"
                          className="p-2 hover:bg-neutral-200/60 rounded-lg sm:rounded-xl text-neutral-600 transition-colors flex items-center justify-center shrink-0"
                        >
                          <Italic size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat("link")}
                          title="Link ([text](url))"
                          className="p-2 hover:bg-neutral-200/60 rounded-lg sm:rounded-xl text-neutral-600 transition-colors flex items-center justify-center shrink-0"
                        >
                          <LinkIcon size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat("list")}
                          title="Bullet List (- item)"
                          className="p-2 hover:bg-neutral-200/60 rounded-lg sm:rounded-xl text-neutral-600 transition-colors flex items-center justify-center shrink-0"
                        >
                          <List size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat("code")}
                          title="Inline Code (`code`)"
                          className="p-2 hover:bg-neutral-200/60 rounded-lg sm:rounded-xl text-neutral-600 transition-colors flex items-center justify-center shrink-0"
                        >
                          <Code size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      <textarea
                        ref={textareaRef}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[120px] sm:min-h-[150px] font-medium placeholder:text-neutral-300 leading-relaxed"
                        placeholder="Provide details about the meeting or update... Use formatting buttons above for rich styling."
                        required
                        value={formData.body}
                        onChange={(e) =>
                          setFormData({ ...formData, body: e.target.value })
                        }
                      />
                    </div>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatBodyPreview(formData.body) }}
                      className="w-full bg-neutral-50/50 border border-neutral-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-sm min-h-[120px] sm:min-h-[200px] leading-relaxed text-neutral-700 overflow-y-auto max-h-[250px] sm:max-h-[300px]"
                    />
                  )}
                </div>

                <Input
                  label="Action Link (Optional)"
                  placeholder="e.g. https://zoom.us/j/..."
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  className="h-12 sm:h-14 font-medium text-sm sm:text-base"
                  icon={<Send size={16} className="text-neutral-400" />}
                />

                <div className={cn(
                  "flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1",
                  formData.targetGroup === "unpaid" ? "text-amber-500" : "text-neutral-400"
                )}>
                  <Clock size={12} />
                  {formData.targetGroup === "unpaid"
                    ? "Email & In-App · Certificate unpaid only"
                    : "Email & In-App · All fellows"}
                </div>

                {success && recipientCount !== null && (
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>Successfully sent to <strong>{recipientCount}</strong> {recipientCount === 1 ? "fellow" : "fellows"}.</span>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className={cn(
                      "flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-500",
                      success
                        ? "bg-green-500 hover:bg-green-600 shadow-green-500/20 shadow-xl"
                        : formData.targetGroup === "unpaid"
                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 shadow-xl"
                        : "shadow-blue-600/20 shadow-xl"
                    )}
                    isLoading={isSubmitting}
                    disabled={success}
                    rightIcon={
                      success ? <CheckCircle2 size={18} className="sm:w-5 sm:h-5" /> : <Send size={18} className="sm:w-5 sm:h-5" />
                    }
                  >
                    {success ? "Broadcasted!" : formData.targetGroup === "unpaid" ? "Send Reminder" : "Send Broadcast"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsPage;
