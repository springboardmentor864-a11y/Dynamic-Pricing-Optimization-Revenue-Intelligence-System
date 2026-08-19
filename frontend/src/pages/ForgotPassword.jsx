import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending OTP recovery email...");
    try {
      const res = await api.post("/forgot-password", { email });
      if (res.data && res.data.status === "success") {
        toast.success("OTP code sent successfully!", { id: toastId });
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to initiate password reset.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying OTP code...");
    try {
      const res = await api.post("/verify-otp", { email, otp });
      if (res.data && res.data.status === "success") {
        toast.success("OTP verified successfully! Set your new password.", { id: toastId });
        // Proceed to ResetPassword with email and otp
        navigate("/reset-password", { state: { email, otp } });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Invalid or expired OTP code.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 border border-slate-100 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-blue-600 mb-2">Recover Password</h1>
          <p className="text-slate-500 text-sm">
            {step === 1
              ? "Enter your email to receive a secure recovery OTP."
              : "Enter the 6-digit OTP code sent to your email inbox."}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="admin@pricepilot.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold p-4 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition duration-300 disabled:bg-blue-400"
            >
              {loading ? "Sending..." : "Request Recovery OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-center tracking-widest font-mono text-xl"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-semibold p-4 rounded-xl hover:bg-blue-700 shadow-lg transition duration-300 disabled:bg-blue-400"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-700 font-semibold"
              >
                Back
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm">
          <button onClick={() => navigate("/login")} className="text-blue-600 font-semibold hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
