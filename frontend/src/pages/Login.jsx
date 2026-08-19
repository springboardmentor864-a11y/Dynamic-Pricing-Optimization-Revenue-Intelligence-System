import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { addActivityLog } from "../utils/activityLogger";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Logging in...");
    try {
      const res = await api.post("/login", { email, password });
      if (res.data && res.data.status === "success") {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", res.data.token);
        storage.setItem("refresh_token", res.data.refresh_token);
        storage.setItem("user", JSON.stringify(res.data.user));

        // Clear opposite storage to avoid duplicate sessions
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        otherStorage.removeItem("token");
        otherStorage.removeItem("refresh_token");
        otherStorage.removeItem("user");

        addActivityLog("User Login", `Logged in as ${res.data.user.name} (${res.data.user.role}).`, "login");
        toast.success("Welcome to PricePilot AI!", { id: toastId });
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Login failed. Check your credentials.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 border border-slate-100">
        <h1 className="text-3xl font-black text-center text-blue-600 mb-2">
          PricePilot AI
        </h1>
        <p className="text-slate-500 text-center text-sm mb-8">
          Dynamic Pricing Optimization Platform
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 p-3 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-slate-600 font-semibold px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold p-4 rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition duration-300 mt-2 disabled:bg-blue-400"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?
          <button onClick={() => navigate("/register")} className="text-blue-600 font-semibold ml-2 hover:underline">
            Register Here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;