import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  Briefcase,
  Camera,
} from "lucide-react";
import { useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import Button from "../components/Button";
import Input from "../components/Input";
import axiosInstance from "../api/axiosInstance";

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    title: user?.title || "",
    avatar: user?.avatar || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        title: user.title || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, avatar: data.secure_url }));

        // Auto-save the avatar to the backend
        await axiosInstance.patch("/admin/me", { avatar: data.secure_url });
        updateUser({ avatar: data.secure_url });

        setSuccess("Avatar updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await axiosInstance.patch("/admin/me", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        avatar: formData.avatar,
      });

      // Update local store
      updateUser({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        title: response.data.title,
        avatar: response.data.avatar,
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    setSuccess("");
    setError("");

    try {
      await axiosInstance.patch("/admin/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">
          Account Settings
        </h1>
        <p className="text-neutral-500 mt-1">
          Manage your administrative profile and security preferences.
        </p>
      </div>

      {(success || error) && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
            success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {success || error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm text-center">
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-24 h-24 bg-neutral-900 text-white rounded-3xl flex items-center justify-center text-3xl font-bold overflow-hidden shadow-xl shadow-neutral-900/10">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-2xl border-4 border-white shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Camera size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <h2 className="text-xl font-heading font-bold text-neutral-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-blue-600 text-xs font-heading font-black uppercase tracking-widest mt-1">
              {user?.title || "Administrator"}
            </p>
            <div className="mt-6 pt-6 border-t border-neutral-50">
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1">
                Email Address
              </p>
              <p className="text-sm font-medium text-neutral-600">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-3xl p-8 text-white shadow-xl shadow-neutral-900/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-blue-400" size={20} />
              <h3 className="font-bold">Security Status</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Your account is protected by industry-standard encryption. We
              recommend changing your password regularly.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-3 py-2 rounded-xl">
              <CheckCircle2 size={12} /> Secure Account
            </div>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Form */}
          <form
            onSubmit={handleProfileSubmit}
            className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <User size={20} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Personal Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                icon={<User size={16} className="text-neutral-400" />}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                icon={<User size={16} className="text-neutral-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Position / Title"
                placeholder="Platform Manager"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                icon={<Briefcase size={16} className="text-neutral-400" />}
              />
              <Input
                label="Email Address"
                value={formData.email}
                disabled
                icon={<Mail size={16} className="text-neutral-400" />}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-2xl"
                isLoading={loading}
                rightIcon={<Save size={18} />}
              >
                Save Changes
              </Button>
            </div>
          </form>

          {/* Password Form */}
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Security & Password
              </h3>
            </div>

            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              icon={<Lock size={16} className="text-neutral-400" />}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                icon={<Lock size={16} className="text-neutral-400" />}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                icon={<Lock size={16} className="text-neutral-400" />}
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="outline"
                className="w-full h-12 rounded-2xl border-neutral-200 hover:bg-neutral-50"
                isLoading={passwordLoading}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
