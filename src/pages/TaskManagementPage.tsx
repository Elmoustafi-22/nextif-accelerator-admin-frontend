import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  LayoutGrid,
  List,
  Users,
  X,
  AlertCircle,
  Trash2,
  Video,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import Button from "../components/Button";
import Input from "../components/Input";
import { cn } from "../utils/cn";
import { toast } from "../store/useToastStore";

const TaskManagementPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ambassadors, setAmbassadors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    taskId: string | null;
  }>({
    isOpen: false,
    taskId: null,
  });

  const [formData, setFormData] = useState({
    title: "",
    explanation: "",
    type: "ADHOC",
    verificationType: "ADMIN",
    dueDate: "",
    assignedTo: [] as string[],
    rewardPoints: 0,
    isBonus: false,
    requirements: ["TEXT"] as string[],
    whatToDo: [] as { title: string; description: string }[],
    materials: [] as {
      title: string;
      url: string;
      type: "VIDEO" | "PDF" | "LINK";
    }[],
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmbassadors = async () => {
    try {
      const response = await axiosInstance.get("/admin/ambassadors", {
        params: { status: "ACTIVE" }, // Only assign to active fellows
      });
      setAmbassadors(response.data.data || []);
    } catch (error) {
      console.error("Error fetching fellows:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAmbassadors();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (formData.assignedTo.length === 0) {
      setError("Please assign at least one fellow");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingTaskId) {
        await axiosInstance.patch(`/tasks/${editingTaskId}`, formData);
      } else {
        await axiosInstance.post("/tasks", formData);
      }
      setIsModalOpen(false);
      setEditingTaskId(null);
      setFormData({
        title: "",
        explanation: "",
        type: "ADHOC",
        verificationType: "ADMIN",
        dueDate: "",
        assignedTo: [],
        rewardPoints: 0,
        isBonus: false,
        requirements: ["TEXT"],
        whatToDo: [],
        materials: [],
      });
      fetchTasks();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        `Failed to ${editingTaskId ? "update" : "create"} task`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task._id);
    setFormData({
      title: task.title,
      explanation: task.explanation,
      type: task.type,
      verificationType: task.verificationType,
      dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      assignedTo: task.assignedTo || [],
      rewardPoints: task.rewardPoints,
      isBonus: task.isBonus || false,
      requirements: task.requirements || ["TEXT"],
      whatToDo: task.whatToDo || [],
      materials: task.materials || [],
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    setDeleteModal({ isOpen: true, taskId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.taskId) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.delete(`/tasks/${deleteModal.taskId}`);
      setDeleteModal({ isOpen: false, taskId: null });
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmbassador = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(id)
        ? prev.assignedTo.filter((aid) => aid !== id)
        : [...prev.assignedTo, id],
    }));
  };

  const addItemToDo = () => {
    setFormData((prev) => ({
      ...prev,
      whatToDo: [...prev.whatToDo, { title: "", description: "" }],
    }));
  };

  const removeItemToDo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      whatToDo: prev.whatToDo.filter((_, i) => i !== index),
    }));
  };

  const updateItemToDo = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const newItems = [...formData.whatToDo];
    newItems[index][field] = value;
    setFormData({ ...formData, whatToDo: newItems });
  };

  const applyFormatting = (format: "bold" | "italic" | "heading") => {
    const textarea = document.getElementById(
      "task-explanation"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.explanation;
    const selectedText = text.substring(start, end);

    let replacement = "";
    switch (format) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        break;
      case "heading":
        replacement = `\n### ${selectedText || "Subheading"}\n`;
        break;
    }

    const newText =
      text.substring(0, start) + replacement + text.substring(end);
    setFormData({ ...formData, explanation: newText });

    // Focus back and set selection (approximate)
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const addMaterial = (type: "VIDEO" | "PDF" | "LINK") => {
    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { title: "", url: "", type }],
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const updateMaterial = (
    index: number,
    field: "title" | "url",
    value: string
  ) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    setFormData({ ...formData, materials: newMaterials });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900">
            Task Management
          </h1>
          <p className="text-neutral-500 text-sm mt-1 font-heading">
            Create, assign, and track fellow tasks.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 h-11 px-6"
          onClick={() => {
            setEditingTaskId(null);
            setFormData({
              title: "",
              explanation: "",
              type: "ADHOC",
              verificationType: "ADMIN",
              dueDate: "",
              assignedTo: [],
              rewardPoints: 0,
              isBonus: false,
              requirements: ["TEXT"],
              whatToDo: [],
              materials: [],
            });
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} /> Create New Task
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:max-w-md">
          <Input
            placeholder="Search tasks..."
            icon={<Search size={18} className="text-neutral-400" />}
            className="h-11"
          />
        </div>
        <div className="flex items-center bg-white p-1 rounded-xl border border-neutral-100">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === "grid"
                ? "bg-neutral-100 text-blue-600 shadow-sm"
                : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === "list"
                ? "bg-neutral-100 text-blue-600 shadow-sm"
                : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-white rounded-3xl border border-neutral-100 animate-pulse"
            ></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-4xl p-16 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">
            No tasks created yet
          </h2>
          <p className="text-neutral-500 mt-2 max-w-sm mx-auto">
            Get started by creating your first task and assigning it to
            fellows.
          </p>
          <Button
            className="mt-8"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
          >
            Create Task
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "gap-6",
            view === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col"
          )}
        >
          {tasks.map((task: any) => (
            <div
              key={task._id}
              className={cn(
                "bg-white rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group overflow-hidden",
                view === "list" && "flex items-center p-4 gap-6"
              )}
            >
              <div
                className={cn(
                  "p-6",
                  view === "list" && "p-0 flex-1 flex items-center gap-6"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mb-4",
                    task.verificationType === "AUTO"
                      ? "bg-green-50 text-green-600"
                      : "bg-blue-50 text-blue-600",
                    view === "list" && "mb-0"
                  )}
                >
                  {task.verificationType === "AUTO" ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Clock size={24} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold font-heading text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                      {task.title}
                    </h3>
                    {view === "grid" && (
                      <div className="flex items-center gap-1 -mr-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-neutral-400 hover:text-blue-600"
                          onClick={() => handleEditTask(task)}
                        >
                          <FileText size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-neutral-400 hover:text-red-600"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
                    {task.explanation || task.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-heading font-medium">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Calendar size={14} />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Users size={14} />
                      {task.assignedTo?.length || 0} Assigned
                    </div>
                    {task.createdBy && (
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <Users size={14} />
                        BY {task.createdBy.firstName} {task.createdBy.lastName}
                      </div>
                    )}
                  </div>
                </div>

                {view === "list" && (
                  <div className="flex items-center gap-4 pl-6 border-l border-neutral-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteTask(task._id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {view === "grid" && (
                <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold font-heading uppercase tracking-widest text-neutral-400">
                    {task.type}
                  </span>
                  <button
                    onClick={() => navigate(`/tasks/${task._id}/submissions`)}
                    className="text-blue-600 font-bold font-heading text-xs flex items-center gap-1 group/btn"
                  >
                    View Details{" "}
                    <ChevronRight
                      size={14}
                      className="group-hover/btn:translate-x-0.5 transition-transform"
                    />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-heading text-neutral-900">
                      {editingTaskId ? "Edit Task" : "Create New Task"}
                    </h2>
                    <p className="text-xs text-neutral-500 font-heading font-medium">
                      {editingTaskId
                        ? "Update task details"
                        : "Define a task for fellows"}
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

              <form
                onSubmit={handleCreateTask}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                <div className="space-y-4">
                  <Input
                    label="Task Title"
                    placeholder="e.g. Weekly Instagram Post"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold font-heading text-neutral-400 uppercase tracking-wider">
                        Explanation
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => applyFormatting("bold")}
                          className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting("italic")}
                          className="px-2 py-1 text-[10px] italic font-serif bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting("heading")}
                          className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                          title="Subheading"
                        >
                          H
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="task-explanation"
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[120px]"
                      placeholder="Detailed explanation with markdown support..."
                      required
                      value={formData.explanation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          explanation: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Due Date"
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      icon={<Calendar size={16} className="text-neutral-400" />}
                    />

                    <Input
                      label="Reward Points"
                      type="number"
                      placeholder="e.g. 50"
                      required
                      min="0"
                      value={formData.rewardPoints}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rewardPoints: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            isBonus: !prev.isBonus,
                          }))
                        }
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                          formData.isBonus
                            ? "bg-purple-600 border-purple-600 shadow-lg shadow-purple-100"
                            : "border-neutral-300"
                        )}
                      >
                        {formData.isBonus && (
                          <CheckCircle2 size={14} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-neutral-700">
                        Bonus Task
                      </span>
                    </label>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      Bonus tasks contribute to progress beyond 100%.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Submission Requirements
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["TEXT", "FILE", "LINK"].map((req) => (
                        <button
                          key={req}
                          type="button"
                          onClick={() => {
                            const newReqs = formData.requirements.includes(req)
                              ? formData.requirements.filter((r) => r !== req)
                              : [...formData.requirements, req];
                            setFormData({ ...formData, requirements: newReqs });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold font-heading border transition-all",
                            formData.requirements.includes(req)
                              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                              : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300"
                          )}
                        >
                          {req}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* What to do Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        What to do (Guide Items)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px]"
                        onClick={addItemToDo}
                      >
                        <Plus size={14} className="mr-1" /> Add Item
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.whatToDo.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3 relative group text-left"
                        >
                          <button
                            type="button"
                            onClick={() => removeItemToDo(index)}
                            className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">
                              Item Title
                            </label>
                            <input
                              className="w-full bg-white border border-neutral-100 rounded-xl px-3 py-2 text-xs font-bold font-heading focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="e.g. Upload your Instagram post link"
                              value={item.title}
                              onChange={(e) =>
                                updateItemToDo(index, "title", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">
                              Instructions for this item
                            </label>
                            <textarea
                              className="w-full bg-white border border-neutral-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[60px]"
                              placeholder="Describe what need to be done for this item specifically..."
                              value={item.description}
                              onChange={(e) =>
                                updateItemToDo(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <p className="text-[9px] text-blue-500 font-medium">
                            * Fellows will provide a separate response for
                            each item.
                          </p>
                        </div>
                      ))}
                      {formData.whatToDo.length === 0 && (
                        <p className="text-center text-[10px] text-neutral-400 py-2 italic">
                          No items added. Add items to create a structured
                          submission flow.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Learning Materials */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Learning Materials
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => addMaterial("VIDEO")}
                        >
                          <Video size={14} className="mr-1" /> Video
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => addMaterial("PDF")}
                        >
                          <FileText size={14} className="mr-1" /> PDF
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => addMaterial("LINK")}
                        >
                          <LinkIcon size={14} className="mr-1" /> Link
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.materials.map((mat, index) => (
                        <div
                          key={index}
                          className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 relative group"
                        >
                          <button
                            type="button"
                            onClick={() => removeMaterial(index)}
                            className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="flex items-center gap-2 mb-1">
                            {mat.type === "VIDEO" ? (
                              <Video size={14} className="text-blue-500" />
                            ) : mat.type === "PDF" ? (
                              <FileText size={14} className="text-red-500" />
                            ) : (
                              <LinkIcon size={14} className="text-green-500" />
                            )}
                            <span className="text-[10px] font-bold text-neutral-400 uppercase">
                              {mat.type}
                            </span>
                          </div>
                          <input
                            className="w-full bg-white border border-neutral-100 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Resource Title"
                            value={mat.title}
                            onChange={(e) =>
                              updateMaterial(index, "title", e.target.value)
                            }
                          />
                          <input
                            className="w-full bg-white border border-neutral-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="URL (https://...)"
                            value={mat.url}
                            onChange={(e) =>
                              updateMaterial(index, "url", e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                    {formData.materials.length === 0 && (
                      <p className="text-center text-[10px] text-neutral-400 py-2 italic">
                        No materials added.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Assign Fellows
                    </label>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                      {formData.assignedTo.length} Selected
                    </span>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2">
                    {ambassadors.length === 0 ? (
                      <p className="text-center text-xs text-neutral-500 py-4">
                        No active fellows found
                      </p>
                    ) : (
                      ambassadors.map((amb: any) => (
                        <div
                          key={amb._id}
                          onClick={() => toggleAmbassador(amb._id)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all",
                            formData.assignedTo.includes(amb._id)
                              ? "bg-blue-50 border-blue-100"
                              : "bg-white border-transparent hover:border-neutral-200"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded flex items-center justify-center border transition-all",
                              formData.assignedTo.includes(amb._id)
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-neutral-300"
                            )}
                          >
                            {formData.assignedTo.includes(amb._id) && (
                              <CheckCircle2 size={12} />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-neutral-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                              {amb.firstName?.[0]}
                              {amb.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-neutral-900">
                                {amb.firstName} {amb.lastName}
                              </p>
                              <p className="text-[10px] text-neutral-400">
                                {amb.university}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-2 h-12"
                    isLoading={isSubmitting}
                  >
                    {editingTaskId ? "Update Task" : "Create and Assign Task"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">
                Delete Task?
              </h2>
              <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
                Are you sure you want to delete this task? This action cannot be
                undone and will remove all associated submission data.
              </p>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() =>
                    setDeleteModal({ isOpen: false, taskId: null })
                  }
                  disabled={isSubmitting}
                >
                  No, Keep it
                </Button>
                <Button
                  className="flex-1 h-12 bg-red-600 hover:bg-red-700 border-none shadow-red-100"
                  onClick={confirmDelete}
                  isLoading={isSubmitting}
                >
                  Yes, Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagementPage;
