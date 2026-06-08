import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpenText,
  FileUp,
  Bot,
  Sparkles,
  MessageSquare,
  FileText,
  Calendar,
  Trophy,
  CircleUserRound,
  Settings as SettingsIcon,
  ArrowLeft,
  UserCircle,
  Shield,
  BellRing,
  Palette,
  AlertTriangle,
  Save,
  CheckCircle2,
  Upload,
  Smartphone,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { HeaderProfile } from "../../components/HeaderProfile";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/notes", label: "Notes", icon: BookOpenText },
  { to: "/app/upload", label: "Upload", icon: FileUp },
  { to: "/app/ai", label: "AI Assistant", icon: Bot },
  { to: "/app/practice", label: "Practice", icon: Sparkles },
  { to: "/app/discussions", label: "Discussions", icon: MessageSquare },
  { to: "/app/papers", label: "Previous Papers", icon: FileText },
  { to: "/app/planner", label: "Planner", icon: Calendar },
  { to: "/app/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/app/profile", label: "Profile", icon: CircleUserRound },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

const SETTINGS_TABS = [
  { id: "account", label: "Account Settings", icon: UserCircle },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "ai", label: "AI Preferences", icon: Bot },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, isDanger: true },
];

export function SettingsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("account");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    branch: "",
    semester: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem("campusIQ_settings_toggles");
    if (saved) return JSON.parse(saved);
    return {
      googleLogin: true,
      newNotesAlerts: true,
      discussionReplies: true,
      publicProfile: true,
      showRank: false,
      showXp: true,
      animations: true,
      compactMode: false,
    };
  });

  const [aiSummary, setAiSummary] = useState(
    () => localStorage.getItem("campusIQ_ai_summary") || "Medium",
  );
  const [aiDifficulty, setAiDifficulty] = useState(
    () => localStorage.getItem("campusIQ_ai_difficulty") || "Medium",
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("campusIQ_theme") || "Dark Mode",
  );

  useEffect(() => {
    localStorage.setItem("campusIQ_settings_toggles", JSON.stringify(toggles));
  }, [toggles]);

  useEffect(() => {
    localStorage.setItem("campusIQ_ai_summary", aiSummary);
  }, [aiSummary]);

  useEffect(() => {
    localStorage.setItem("campusIQ_ai_difficulty", aiDifficulty);
  }, [aiDifficulty]);

  useEffect(() => {
    localStorage.setItem("campusIQ_theme", theme);
    if (theme === "Light Mode") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [theme]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      api
        .get("/profile")
        .then((res) => {
          if (res.data.ok) {
            setFormData((prev) => ({
              ...prev,
              name: res.data.user?.name || "",
              email: res.data.user?.email || "",
              bio: res.data.profile?.bio || "",
              branch: res.data.profile?.branchName || "",
              semester: res.data.profile?.semesterName || "",
            }));
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSaveAccount = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.put("/profile", {
        name: formData.name,
        bio: formData.bio,
        branch: formData.branch,
        semester: formData.semester,
      });
      if (res.data.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await api.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.ok) {
        window.location.reload(); // Refresh to show new avatar globally
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
      const msg = err.response?.data?.error?.message || err.message || "Failed to upload avatar";
      alert("Failed to upload avatar: " + msg);
    }
  };

  const handleChangePassword = async () => {
    try {
      const res = await api.post("/profile/change-password");
      if (res.data.ok)
        alert("A password reset link has been sent to your email!");
    } catch (e) {
      alert("Failed to process request");
    }
  };

  const handleDeactivate = async () => {
    if (
      confirm(
        "Are you sure you want to deactivate your account? You will be logged out.",
      )
    ) {
      try {
        await api.post("/profile/deactivate");
        logout();
      } catch (e) {
        alert("Failed to deactivate");
      }
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "WARNING: This will permanently delete your account, notes, and XP. This cannot be undone. Are you absolutely sure?",
      )
    ) {
      try {
        await api.delete("/profile");
        logout();
      } catch (e) {
        alert("Failed to delete account");
      }
    }
  };

  const toggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isLight = theme === "Light Mode";
  // Dynamic CSS Variables based on Theme
  const bgMain = isLight ? "bg-slate-50" : "bg-[#050816]";
  const bgSidebar = isLight
    ? "bg-white border-slate-200"
    : "bg-[#0a0d1d] border-white/5";
  const textMain = isLight ? "text-slate-900" : "text-slate-100";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const bgCard = isLight
    ? "bg-white border-slate-200 shadow-sm"
    : "bg-[#0c112b]/80 border-white/5 shadow-2xl";
  const bgInput = isLight
    ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500"
    : "bg-[#121633] border-white/10 text-white focus:border-indigo-500/50";
  const borderDivider = isLight ? "border-slate-200" : "border-white/5";
  const bgTabPanel = isLight
    ? "bg-white border-slate-200 shadow-sm"
    : "bg-[#0c112b] border-white/5";
  const hoverBtn = isLight
    ? "hover:bg-slate-100 text-slate-600"
    : "hover:bg-white/5 text-slate-400 hover:text-slate-200";

  const CustomToggle = ({ label, id, desc }) => (
    <div
      className={`flex items-center justify-between py-3 border-b ${borderDivider} last:border-0`}
    >
      <div>
        <h4 className={`text-sm font-semibold ${textTitle}`}>{label}</h4>
        {desc && <p className={`text-xs mt-0.5 ${textMuted}`}>{desc}</p>}
      </div>
      <button
        onClick={() => toggle(id)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggles[id] ? "bg-indigo-600" : isLight ? "bg-slate-300" : "bg-slate-700"}`}
      >
        <span
          className={`inline-block size-4 transform rounded-full bg-white transition-transform ${toggles[id] ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );

  const RadioGroup = ({ label, options, selected, onChange }) => (
    <div className="py-3">
      <h4 className={`text-sm font-semibold mb-3 ${textTitle}`}>{label}</h4>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              selected === opt
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : isLight
                  ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
            }`}
          >
            <div
              className={`size-3 rounded-full border-2 flex items-center justify-center ${selected === opt ? "border-white" : isLight ? "border-slate-300" : "border-slate-500"}`}
            >
              {selected === opt && (
                <div className="size-1.5 bg-white rounded-full" />
              )}
            </div>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className={`grid h-screen place-items-center ${bgMain}`}>
        <div className="size-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${bgMain} ${textMain} transition-colors duration-300`}
    >
      {/* Sidebar */}
      <aside
        className={`w-[240px] flex-shrink-0 border-r flex flex-col p-4 transition-colors duration-300 ${bgSidebar}`}
      >
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className={`text-lg font-bold tracking-tight ${textTitle}`}>
            CampusIQ
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {nav.map((i) => {
            const isActive = window.location.pathname === i.to;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20"
                    : hoverBtn
                }`}
              >
                <i.icon className="size-[18px]" />
                {i.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Settings Layout */}
      <main className="flex-1 flex flex-col h-screen relative">
        {/* Header */}
        <header
          className={`flex-shrink-0 flex items-center justify-between p-6 lg:p-8 border-b ${borderDivider} transition-colors duration-300`}
        >
          <div className="flex items-center gap-4">
            <Link
              to="/app"
              className={`grid size-10 place-items-center rounded-xl transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-white/5 hover:bg-white/10"}`}
            >
              <ArrowLeft className={`size-5 ${textMuted}`} />
            </Link>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${textTitle}`}>
                V1 Settings Panel
              </h1>
              <p className={`text-xs mt-0.5 ${textMuted}`}>
                Streamlined controls for your CampusIQ account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HeaderProfile />
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-12 items-start">
            {/* Settings Sidebar Tabs */}
            <div
              className={`lg:col-span-3 space-y-1.5 border p-4 rounded-3xl sticky top-0 transition-colors duration-300 ${bgTabPanel}`}
            >
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold ${
                    activeTab === tab.id
                      ? tab.isDanger
                        ? "bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 shadow-sm"
                        : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : tab.isDanger
                        ? "text-rose-500/70 hover:bg-rose-500/5 hover:text-rose-500"
                        : hoverBtn
                  }`}
                >
                  <tab.icon
                    className={`size-4 ${activeTab !== tab.id && tab.isDanger ? "text-rose-500/70" : ""}`}
                  />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div
              className={`lg:col-span-9 border rounded-3xl p-8 min-h-[500px] mb-20 transition-colors duration-300 ${bgCard}`}
            >
              {/* 1. ACCOUNT SETTINGS */}
              {activeTab === "account" && (
                <div className="space-y-8 animate-in fade-in">
                  <div className={`border-b pb-4 ${borderDivider}`}>
                    <h2
                      className={`text-xl font-bold flex items-center gap-2 ${textTitle}`}
                    >
                      <UserCircle className="text-indigo-500" /> Account
                      Settings
                    </h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Manage your identity and academic details.
                    </p>
                  </div>

                  <div className="flex items-center gap-6 pb-4">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="size-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                        <div
                          className={`size-full rounded-full flex items-center justify-center overflow-hidden ${isLight ? "bg-white" : "bg-[#0a0d1d]"}`}
                        >
                          {user?.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt="Avatar"
                              className="size-full object-cover"
                            />
                          ) : (
                            <span
                              className={`text-2xl font-black ${textTitle}`}
                            >
                              {user?.name?.slice(0, 2).toUpperCase() || "IQ"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="size-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`border font-semibold text-xs px-4 py-2 rounded-xl transition-all ${isLight ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-700" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}
                      >
                        Change Avatar
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className={`text-xs font-bold uppercase ${textMuted}`}
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${bgInput}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-xs font-bold uppercase flex items-center gap-2 ${textMuted}`}
                      >
                        College Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed opacity-70 transition-colors ${bgInput}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-xs font-bold uppercase ${textMuted}`}
                      >
                        Branch / Major
                      </label>
                      <input
                        type="text"
                        value={formData.branch}
                        onChange={(e) =>
                          setFormData({ ...formData, branch: e.target.value })
                        }
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${bgInput}`}
                        placeholder="e.g. CSE"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`text-xs font-bold uppercase ${textMuted}`}
                      >
                        Semester
                      </label>
                      <select
                        value={formData.semester}
                        onChange={(e) =>
                          setFormData({ ...formData, semester: e.target.value })
                        }
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${bgInput}`}
                      >
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s.toString()}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-bold uppercase ${textMuted}`}
                    >
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none h-24 transition-colors ${bgInput}`}
                      placeholder="A short bio about yourself..."
                    />
                  </div>

                  <div
                    className={`pt-4 border-t flex items-center gap-4 ${borderDivider}`}
                  >
                    <button
                      onClick={handleSaveAccount}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Update Profile
                    </button>
                    {saveSuccess && (
                      <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold flex items-center gap-1">
                        <CheckCircle2 className="size-4" /> Updated!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 2. SECURITY */}
              {activeTab === "security" && (
                <div className="space-y-8 animate-in fade-in">
                  <div className={`border-b pb-4 ${borderDivider}`}>
                    <h2
                      className={`text-xl font-bold flex items-center gap-2 ${textTitle}`}
                    >
                      <Shield className="text-indigo-500" /> Security
                    </h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Keep your account and devices safe.
                    </p>
                  </div>

                  <div
                    className={`space-y-1 p-6 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#121633] border-white/5"}`}
                  >
                    <div
                      className={`flex items-center justify-between py-3 border-b ${borderDivider}`}
                    >
                      <div>
                        <h4 className={`text-sm font-semibold ${textTitle}`}>
                          Password
                        </h4>
                        <p className={`text-xs mt-0.5 ${textMuted}`}>
                          Last changed 3 months ago
                        </p>
                      </div>
                      <button
                        onClick={handleChangePassword}
                        className={`border font-semibold text-xs px-4 py-2 rounded-lg transition-all ${isLight ? "bg-white border-slate-200 hover:bg-slate-100 text-slate-700" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}
                      >
                        Change Password
                      </button>
                    </div>
                    <CustomToggle
                      label="Google Account Connected"
                      id="googleLogin"
                      desc="Used for fast, secure OAuth logins."
                    />
                  </div>

                  <div
                    className={`space-y-4 p-6 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#121633] border-white/5"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}
                      >
                        <Smartphone className={`size-4 ${textMuted}`} /> Active
                        Sessions
                      </h3>
                      <button className="text-xs font-bold text-rose-500 hover:text-rose-400">
                        Logout All Devices
                      </button>
                    </div>

                    <div
                      className={`flex items-center gap-4 p-4 rounded-xl border ${isLight ? "bg-white border-indigo-200 shadow-sm" : "bg-white/5 border-indigo-500/30"}`}
                    >
                      <div className="p-3 bg-indigo-500/10 rounded-lg">
                        <Smartphone className="size-5 text-indigo-500" />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}
                        >
                          Windows 11 PC{" "}
                          <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">
                            Current
                          </span>
                        </h4>
                        <p className={`text-xs mt-0.5 ${textMuted}`}>
                          Chrome Browser • Active now
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="space-y-8 animate-in fade-in">
                  <div className={`border-b pb-4 ${borderDivider}`}>
                    <h2
                      className={`text-xl font-bold flex items-center gap-2 ${textTitle}`}
                    >
                      <BellRing className="text-indigo-500" /> Notifications
                    </h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Useful alerts to help you stay on top of your studies.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <CustomToggle
                      label="New Notes Alerts"
                      id="newNotesAlerts"
                      desc="Be informed when materials for your branch are uploaded."
                    />
                    <CustomToggle
                      label="Discussion Replies"
                      id="discussionReplies"
                      desc="When someone replies to your question in forums."
                    />
                  </div>
                </div>
              )}

              {/* 4. AI PREFERENCES */}
              {activeTab === "ai" && (
                <div className="space-y-8 animate-in fade-in">
                  <div className={`border-b pb-4 ${borderDivider}`}>
                    <h2
                      className={`text-xl font-bold flex items-center gap-2 ${textTitle}`}
                    >
                      <Bot className="text-indigo-500" /> AI Preferences
                    </h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Directly control how the AI tutor assists your learning.
                    </p>
                  </div>

                  <RadioGroup
                    label="AI Summary Length"
                    options={["Short", "Medium", "Detailed"]}
                    selected={aiSummary}
                    onChange={setAiSummary}
                  />

                  <RadioGroup
                    label="Practice Quiz Difficulty"
                    options={["Easy", "Medium", "Hard"]}
                    selected={aiDifficulty}
                    onChange={setAiDifficulty}
                  />
                </div>
              )}

              {/* 6. APPEARANCE */}
              {activeTab === "appearance" && (
                <div className="space-y-8 animate-in fade-in">
                  <div className={`border-b pb-4 ${borderDivider}`}>
                    <h2
                      className={`text-xl font-bold flex items-center gap-2 ${textTitle}`}
                    >
                      <Palette className="text-indigo-500" /> Appearance
                    </h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>
                      Customize the user interface for your comfort.
                    </p>
                  </div>

                  <RadioGroup
                    label="Theme Mode"
                    options={["Dark Mode", "Light Mode"]}
                    selected={theme}
                    onChange={setTheme}
                  />

                  <div className={`space-y-1 pt-6 border-t ${borderDivider}`}>
                    <CustomToggle
                      label="Animations ON/OFF"
                      id="animations"
                      desc="Toggle visual flair and particle effects."
                    />
                    <CustomToggle
                      label="Compact Mode ON/OFF"
                      id="compactMode"
                      desc="Reduce spacing to fit more items on the screen."
                    />
                  </div>
                </div>
              )}

              {/* 7. DANGER ZONE */}
              {activeTab === "danger" && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="border-b border-rose-500/20 pb-4">
                    <h2 className="text-xl font-bold text-rose-600 dark:text-rose-500 flex items-center gap-2">
                      <AlertTriangle className="text-rose-500" /> Danger Zone
                    </h2>
                    <p className="text-xs text-rose-500/70 mt-1">
                      Irreversible account actions.
                    </p>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between pb-6 border-b border-rose-500/10">
                      <div>
                        <h4 className={`text-sm font-bold ${textTitle}`}>
                          Deactivate Account
                        </h4>
                        <p className={`text-xs mt-1 max-w-md ${textMuted}`}>
                          Temporarily disable your profile. You can reactivate
                          by logging back in.
                        </p>
                      </div>
                      <button
                        onClick={handleDeactivate}
                        className={`border font-bold text-xs px-5 py-2.5 rounded-xl transition-all ${isLight ? "bg-white border-rose-200 text-rose-600 hover:bg-rose-50" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}
                      >
                        Deactivate
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                          Delete Account Permanently
                        </h4>
                        <p className="text-xs text-rose-500/80 dark:text-rose-400/60 mt-1 max-w-md">
                          Wipes all your notes, data, and achievements forever.
                          Cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={handleDelete}
                        className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
