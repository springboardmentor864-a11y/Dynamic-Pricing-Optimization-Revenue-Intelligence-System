import { useState } from "react";
import { useData } from "../context/DataContext";
import {
  User,
  Bell,
  Shield,
  Moon,
  Globe,
  Save,
  Key,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { darkMode, setDarkMode } = useData();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => {
    const defaultProfile = {
      name: "Tharun",
      email: "admin@pricepilot.ai",
      company: "PricePilot AI",
      phone: "+91 9876543210",
      role: "Administrator",
      profile_image: "https://i.pravatar.cc/150?img=12"
    };

    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        return {
          name: userObj.name || defaultProfile.name,
          email: userObj.email || defaultProfile.email,
          company: userObj.company || defaultProfile.company,
          phone: userObj.phone || defaultProfile.phone,
          role: userObj.role || defaultProfile.role,
          profile_image: userObj.profile_image || defaultProfile.profile_image
        };
      } catch (err) {
        console.error(err);
        return defaultProfile;
      }
    }
    return defaultProfile;
  });

  const [notifications, setNotifications] = useState(() => {
    const defaultNotifs = {
      email: true,
      alerts: true,
      weekly: false,
    };

    const savedNotifications = localStorage.getItem("notifications");
    if (savedNotifications) {
      try {
        return JSON.parse(savedNotifications);
      } catch (err) {
        console.error(err);
        return defaultNotifs;
      }
    }
    return defaultNotifs;
  });



  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationToggle = (field) => {
    setNotifications((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Saving settings to server...");
    try {
      // Save Profile on server
      const res = await api.put("/profile", {
        name: profile.name,
        company: profile.company,
        phone: profile.phone,
        profile_image: profile.profile_image
      });

      if (res.data && res.data.status === "success") {
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(res.data.user));
        storage.setItem("notifications", JSON.stringify(notifications));
        
        // Dispatch storage event to sync other components
        window.dispatchEvent(new Event("storage"));
        toast.success("Settings saved successfully!", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save settings.", { id: toastId });
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setPasswordLoading(true);
    const toastId = toast.loading("Changing password...");
    try {
      const res = await api.post("/change-password", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      if (res.data && res.data.status === "success") {
        toast.success("Password changed successfully! Logging out...", { id: toastId });
        
        // Clear all storage and logout
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
        
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to change password. Make sure current password is correct.", { id: toastId });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 text-lg mt-2">Manage your account preferences and notification settings.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <form onSubmit={handleSave} className="xl:col-span-2 space-y-8">
          {/* Profile Information */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2 font-semibold">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2 font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  disabled
                  className="w-full border border-slate-200 rounded-xl p-4 bg-slate-100 text-slate-400 outline-none cursor-not-allowed transition"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2 font-semibold">Company</label>
                <input
                  type="text"
                  name="company"
                  value={profile.company}
                  onChange={handleProfileChange}
                  className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2 font-semibold">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="text-orange-500" />
              <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
            </div>
            <div className="space-y-5">
              <label className="flex justify-between items-center cursor-pointer">
                <span className="text-slate-700 font-semibold">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => handleNotificationToggle("email")}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex justify-between items-center cursor-pointer">
                <span className="text-slate-700 font-semibold">Price Alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.alerts}
                  onChange={() => handleNotificationToggle("alerts")}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex justify-between items-center cursor-pointer">
                <span className="text-slate-700 font-semibold">Weekly Reports</span>
                <input
                  type="checkbox"
                  checked={notifications.weekly}
                  onChange={() => handleNotificationToggle("weekly")}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-blue-200 transition cursor-pointer"
          >
            <Save size={20} />
            Save Settings
          </button>
        </form>

        {/* Right Panel */}
        <div className="space-y-8">
          {/* Appearance Settings */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Moon className="text-purple-600" />
              <h2 className="text-xl font-bold text-slate-800">Appearance</h2>
            </div>
            <select
              value={darkMode ? "dark" : "light"}
              onChange={(e) => setDarkMode(e.target.value === "dark")}
              className="w-full border border-slate-200 rounded-xl p-4 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="light">Light Theme</option>
              <option value="dark">Dark Theme</option>
            </select>
          </div>



          {/* Security */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="text-red-600" />
              <h2 className="text-xl font-bold text-slate-800">Security</h2>
            </div>

            {!showPasswordForm ? (
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="w-full py-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition cursor-pointer"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm transition cursor-pointer flex justify-center items-center gap-1"
                  >
                    <Key size={14} />
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-sm transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}