import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Camera,
  Save,
  Key,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Profile() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(() => {
    const defaultProfile = {
      name: "Tharun",
      email: "admin@pricepilot.ai",
      phone: "+91 9876543210",
      company: "PricePilot AI",
      address: "Hyderabad, Telangana",
      role: "Administrator",
      profile_image: ""
    };

    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        return {
          name: userObj.name || defaultProfile.name,
          email: userObj.email || defaultProfile.email,
          role: userObj.role || defaultProfile.role,
          phone: userObj.phone || defaultProfile.phone,
          company: userObj.company || defaultProfile.company,
          address: userObj.address || defaultProfile.address,
          profile_image: userObj.profile_image || ""
        };
      } catch (e) {
        console.error(e);
        return defaultProfile;
      }
    }
    return defaultProfile;
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Perform Canvas Compression (max 400x400 at 0.75 quality)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return;
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now()
            });

            const formData = new FormData();
            formData.append("file", compressedFile);

            const toastId = toast.loading("Uploading profile image...");
            try {
              const res = await api.post("/profile/upload-image", formData, {
                headers: { "Content-Type": "multipart/form-data" }
              });

              if (res.data && res.data.status === "success") {
                const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
                storage.setItem("user", JSON.stringify(res.data.user));
                
                setProfile((prev) => ({
                  ...prev,
                  profile_image: res.data.profile_image
                }));

                window.dispatchEvent(new Event("storage"));
                toast.success("Profile image updated successfully!", { id: toastId });
              }
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.detail || "Failed to upload image.", { id: toastId });
            }
          },
          "image/jpeg",
          0.75
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Saving changes to server...");
    try {
      const res = await api.put("/profile", {
        name: profile.name,
        company: profile.company,
        phone: profile.phone,
        profile_image: profile.profile_image
      });
      if (res.data && res.data.status === "success") {
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(res.data.user));
        
        window.dispatchEvent(new Event("storage"));
        toast.success("Profile updated successfully on the server!", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save profile changes.", { id: toastId });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    setPasswordLoading(true);
    const toastId = toast.loading("Updating password...");
    try {
      const res = await api.post("/change-password", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      if (res.data && res.data.status === "success") {
        toast.success("Password changed successfully! Logging out...", { id: toastId });
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

  const renderAvatar = () => {
    if (profile.profile_image) {
      const backendUrl = api.defaults.baseURL.replace("/api", "");
      const imgUrl = profile.profile_image.startsWith("http")
        ? profile.profile_image
        : `${backendUrl}${profile.profile_image}`;
      return (
        <img
          src={imgUrl}
          alt="Profile"
          className="w-40 h-40 rounded-full border-4 border-blue-500 shadow-md object-cover"
        />
      );
    }
    return (
      <div className="w-40 h-40 rounded-full border-4 border-blue-500 shadow-md bg-slate-100 flex items-center justify-center text-slate-400">
        <User size={80} />
      </div>
    );
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-500 text-lg mt-2">Manage your account information and credentials.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Card - Avatar */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col items-center">
          <div className="relative">
            {renderAvatar()}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition shadow cursor-pointer animate-pulse"
            >
              <Camera size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-6">{profile.name}</h2>
          <p className="text-slate-500 font-semibold mt-1">{profile.role}</p>
        </div>

        {/* Right Panel - Inputs Form */}
        <div className="xl:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <User className="text-blue-600" size={22} />
              <h2 className="text-2xl font-bold text-slate-800">Account details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Full Name</label>
                <div className="flex items-center border border-slate-200 rounded-xl px-4 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
                  <User className="text-slate-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full p-4 outline-none text-slate-800 font-medium bg-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Email Address</label>
                <div className="flex items-center border border-slate-200 rounded-xl px-4 bg-slate-100 transition">
                  <Mail className="text-slate-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="w-full p-4 outline-none text-slate-400 font-medium bg-transparent cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Phone Number</label>
                <div className="flex items-center border border-slate-200 rounded-xl px-4 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
                  <Phone className="text-slate-400" size={18} />
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full p-4 outline-none text-slate-800 font-medium bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Company Name</label>
                <div className="flex items-center border border-slate-200 rounded-xl px-4 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
                  <Building className="text-slate-400" size={18} />
                  <input
                    type="text"
                    name="company"
                    value={profile.company}
                    onChange={handleChange}
                    className="w-full p-4 outline-none text-slate-800 font-medium bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Physical Address</label>
              <div className="flex items-center border border-slate-200 rounded-xl px-4 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
                <MapPin className="text-slate-400" size={18} />
                <input
                  type="text"
                  name="address"
                  value={profile.address || ""}
                  onChange={handleChange}
                  className="w-full p-4 outline-none text-slate-800 font-medium bg-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-blue-200 transition cursor-pointer"
            >
              <Save size={18} />
              Save Changes
            </button>
          </form>

          {/* Change Password Card */}
          <form onSubmit={handlePasswordChange} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <Key className="text-red-500" size={22} />
              <h2 className="text-2xl font-bold text-slate-800">Change Password</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-red-200 transition cursor-pointer disabled:bg-red-400"
            >
              <Key size={18} />
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}