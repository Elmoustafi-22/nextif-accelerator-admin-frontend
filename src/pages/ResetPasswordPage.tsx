import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";
import axiosInstance from "../api/axiosInstance";
import { useAuthStore } from "../store/useAuthStore";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    firstName: "",
    title: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const endpoint =
        user?.role === "admin"
          ? "/auth/admin/setup-password"
          : "/auth/ambassador/password-reset";

      await axiosInstance.patch(endpoint, {
        password: formData.password,
        firstName: formData.firstName || user?.firstName,
        title: formData.title || user?.title,
      });

      setIsSuccess(true);
      updateUser({ isFirstLogin: false });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-4xl shadow-xl p-8 border border-neutral-100 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900">
            Security Updated
          </h1>
          <p className="text-neutral-500 mt-2">
            Your password has been successfully set. Redirecting you to your
            dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-4xl shadow-xl p-8 border border-neutral-100"
        >
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-neutral-900">
              Secure Your Account
            </h1>
            <p className="text-neutral-500 mt-1">
              Please complete your profile and set a password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {user?.role === "admin" && !user?.firstName && (
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            )}
            {user?.role === "admin" && !user?.title && (
              <Input
                label="Job Title"
                type="text"
                placeholder="Administrator"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            )}
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              Set Password & Continue
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
