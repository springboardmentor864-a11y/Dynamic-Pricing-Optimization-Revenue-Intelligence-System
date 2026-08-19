import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState("Pricing Manager");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !company || !password || !passwordConfirm) {
      toast.error("Please fill in all fields.");
      return;
    }

    // Client-side validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Invalid email format.");
      return;
    }

    const phoneClean = phone.replace(/[\s-]/g, "");
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(phoneClean)) {
      toast.error("Invalid mobile number format. Must be 7-15 digits.");
      return;
    }

    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      toast.error("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Registering account...");
    try {
      const res = await api.post("/register", {
        name,
        email,
        phone,
        company,
        password,
        password_confirm: passwordConfirm,
        role,
      });
      if (res.data && res.data.status === "success") {
        toast.success("Account registered successfully! Please log in.", { id: toastId });
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Registration failed.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 border border-slate-100">
        <h1 className="text-3xl font-black text-center text-blue-600 mb-2">
          Create Account
        </h1>
        <p className="text-slate-500 text-center text-sm mb-6">
          Join PricePilot AI Revenue Platform
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Tharun Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="tharun@pricepilot.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Mobile Number</label>
            <input
              type="tel"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Company Name</label>
            <input
              type="text"
              placeholder="PricePilot AI"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 pr-9 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 pr-9 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"
                >
                  {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Platform Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm"
            >
              <option value="Pricing Manager">Pricing Manager</option>
              <option value="Administrator">Administrator</option>
              <option value="Business Analyst">Business Analyst</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold p-3.5 rounded-xl hover:bg-green-700 shadow-lg hover:shadow-green-200 transition duration-300 disabled:bg-green-400 mt-2 text-sm"
          >
            {loading ? "Registering..." : "Register Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?
          <button onClick={() => navigate("/login")} className="text-blue-600 font-semibold ml-2 hover:underline">
            Login Here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;