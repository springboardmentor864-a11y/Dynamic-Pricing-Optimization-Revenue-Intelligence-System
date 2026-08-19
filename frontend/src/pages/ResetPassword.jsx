import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      toast.error("Access denied. Please verify your OTP code first.");
      navigate("/forgot-password");
    }
  }, [email, otp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating password...");
    try {
      const res = await api.post("/reset-password", {
        email,
        otp,
        new_password: newPassword,
      });

      if (res.data && res.data.status === "success") {
        toast.success("Password reset successfully! Please log in.", { id: toastId });
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to reset password. Please start over.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 border border-slate-100 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-blue-600 mb-2">Reset Password</h1>
          <p className="text-slate-500 text-sm">
            Configure your new password credentials for <span className="font-semibold text-slate-700">{email}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold p-4 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition duration-300 disabled:bg-blue-400 mt-2"
          >
            {loading ? "Resetting Password..." : "Submit Reset"}
          </button>
        </form>

        <div className="text-center text-sm">
          <button onClick={() => navigate("/forgot-password")} className="text-blue-600 font-semibold hover:underline">
            Back to Request OTP
          </button>
        </div>
      </div>
    </div>
  );
}
