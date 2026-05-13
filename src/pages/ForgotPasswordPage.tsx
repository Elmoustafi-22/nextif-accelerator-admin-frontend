import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";
import axiosInstance from "../api/axiosInstance";
import { useAuthStore } from "../store/useAuthStore";

type Step = "REQUEST_EMAIL" | "VERIFY_OTP" | "RESET_PASSWORD" | "SUCCESS";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<Step>("REQUEST_EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleRequestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await axiosInstance.post("/auth/password-reset-request", { email, role: "ADMIN" });
      setStep("VERIFY_OTP");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axiosInstance.post("/auth/verify-otp", { email, otp, role: "ADMIN" });
      setResetToken(response.data.resetToken);
      setStep("RESET_PASSWORD");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await axiosInstance.post("/auth/password-reset", { token: resetToken, password, role: "ADMIN" });
      setAuth(response.data.user, response.data.token);
      setStep("SUCCESS");
      setTimeout(() => navigate("/"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md relative"
      >
        <div className="bg-white rounded-4xl shadow-xl shadow-blue-500/5 p-8 border border-neutral-100">
          <button 
            onClick={() => step === "REQUEST_EMAIL" ? navigate("/login") : setStep("REQUEST_EMAIL")}
            className="absolute top-4 left-4 p-2 hover:bg-neutral-50 rounded-full transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-blue-600" />
          </button>

          <AnimatePresence mode="wait">
            {step === "REQUEST_EMAIL" && (
              <motion.div key="request" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                    <Mail className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold text-neutral-900">Forgot Password</h1>
                  <p className="text-neutral-500 mt-1">Enter your email to reset your password</p>
                </div>
                <form onSubmit={handleRequestEmail} className="space-y-4">
                  <Input label="Email Address" type="email" placeholder="name@nextif.com" required value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4 text-neutral-400" />} />
                  {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
                  <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>Send Code</Button>
                </form>
              </motion.div>
            )}

            {step === "VERIFY_OTP" && (
              <motion.div key="verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                    <ShieldCheck className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold text-neutral-900">Verify Identity</h1>
                  <p className="text-neutral-500 mt-1">Enter code sent to <b>{email}</b></p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Input label="Verification Code" type="text" placeholder="123456" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                  {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
                  <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>Verify Code</Button>
                </form>
              </motion.div>
            )}

            {step === "RESET_PASSWORD" && (
              <motion.div key="reset" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                    <Lock className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold text-neutral-900">New Password</h1>
                  <p className="text-neutral-500 mt-1">Set a secure password for your admin account</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <Input label="New Password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock className="w-4 h-4 text-neutral-400" />} />
                  <Input label="Confirm Password" type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock className="w-4 h-4 text-neutral-400" />} />
                  {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
                  <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight size={18} />}>Reset Password</Button>
                </form>
              </motion.div>
            )}

            {step === "SUCCESS" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-green-600 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-neutral-900">Password Updated</h1>
                <p className="text-neutral-500 mt-2">Your security settings have been updated. Redirecting to dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
