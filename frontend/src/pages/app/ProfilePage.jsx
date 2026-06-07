import { useEffect, useState } from "react";
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
  Settings,
  LogOut,
  Bell,
  ArrowLeft,
  Award,
  BookOpen,
  Target,
  Clock,
  PenLine,
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
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function ProfilePage() {
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/login");
    }
  }, [authUser, authLoading, navigate]);

  useEffect(() => {
    if (authUser) {
      api
        .get("/profile")
        .then((res) => {
          if (res.data.ok) {
            setData(res.data);
            setBioInput(res.data.profile?.bio || "");
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [authUser]);

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await api.put("/profile", { bio: bioInput });
      if (res.data.ok && data) {
        setData({
          ...data,
          profile: { ...data.profile, bio: res.data.profile.bio },
        });
        setIsEditingBio(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBio(false);
    }
  };

  const computeLevel = (xp) => {
    if (xp < 100)
      return { level: 1, title: "Novice Learner", min: 0, max: 100 };
    if (xp < 500) return { level: 2, title: "Apprentice", min: 100, max: 500 };
    if (xp < 1000) return { level: 3, title: "Scholar", min: 500, max: 1000 };
    if (xp < 2500) return { level: 4, title: "Academic", min: 1000, max: 2500 };
    return { level: 5, title: "Master", min: 2500, max: 5000 };
  };

  const getActivityDetails = (act) => {
    switch (act.type) {
      case "quiz_finish":
        return {
          icon: Award,
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          title: "Completed a Quiz",
          desc: `Scored ${act.meta?.score}/${act.meta?.total} and earned +${act.meta?.xpEarned} XP`,
        };
      case "quiz_start":
        return {
          icon: Target,
          color: "text-indigo-400",
          bg: "bg-indigo-400/10",
          title: "Started a Quiz",
          desc: "Initiated a new practice session.",
        };
      case "note_upload":
        return {
          icon: FileUp,
          color: "text-emerald-400",
          bg: "bg-emerald-400/10",
          title: "Uploaded a Document",
          desc: "Contributed study material to the platform.",
        };
      case "note_view":
        return {
          icon: BookOpen,
          color: "text-blue-400",
          bg: "bg-blue-400/10",
          title: "Studied a Document",
          desc: "Viewed course materials.",
        };
      default:
        return {
          icon: Sparkles,
          color: "text-slate-400",
          bg: "bg-slate-400/10",
          title: "Platform Activity",
          desc: "Engaged with CampusIQ.",
        };
    }
  };

  if (authLoading || loading || !data) {
    return (
      <div className="grid h-screen place-items-center bg-[#050816] text-white">
        <div className="size-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const lvlInfo = computeLevel(data.profile.xp);
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      ((data.profile.xp - lvlInfo.min) / (lvlInfo.max - lvlInfo.min)) * 100,
    ),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#050816] text-slate-100">
      <aside className="w-[240px] flex-shrink-0 border-r border-white/5 bg-[#0a0d1d] flex flex-col p-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="text-lg font-bold tracking-tight">CampusIQ</div>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {nav.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                window.location.pathname === i.to
                  ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <i.icon className="size-[18px]" />
              {i.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={logout}
          type="button"
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 p-6 lg:p-10 min-h-full">
          <header className="flex items-center justify-between pb-8">
            <div className="flex items-center gap-4">
              <Link
                to="/app"
                className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <ArrowLeft className="size-5" />
              </Link>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Student Profile
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button className="grid size-10 place-items-center rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200">
                <Bell className="size-5" />
              </button>
              <HeaderProfile />
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Column: Identity & Bio */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0c112b]/80 border border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur relative overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="size-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[3px] shadow-2xl shadow-indigo-500/20">
                    <div className="size-full rounded-full bg-[#0a0d1d] flex items-center justify-center overflow-hidden border-2 border-[#0a0d1d]">
                      {data.user.avatarUrl ? (
                        <img
                          src={data.user.avatarUrl}
                          alt="Avatar"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-black text-white">
                          {data.user.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white mt-5">
                    {data.user.name}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                    {data.user.role}
                  </p>

                  <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400 font-bold">About Me</span>
                      {!isEditingBio && (
                        <button
                          onClick={() => setIsEditingBio(true)}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                        >
                          <PenLine className="size-3" /> Edit
                        </button>
                      )}
                    </div>

                    {isEditingBio ? (
                      <div className="space-y-3">
                        <textarea
                          value={bioInput}
                          onChange={(e) => setBioInput(e.target.value)}
                          className="w-full bg-[#121633] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500/40 resize-none h-24"
                          placeholder="Tell everyone what you are studying..."
                          maxLength={500}
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveBio}
                            disabled={savingBio}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl transition-all"
                          >
                            {savingBio ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingBio(false);
                              setBioInput(data.profile.bio || "");
                            }}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs py-2 rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed text-left">
                        {data.profile.bio ||
                          "This student hasn't written a bio yet. They are busy studying!"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#0c112b]/80 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur space-y-4">
                <h3 className="text-sm font-bold text-white mb-4">
                  Account Details
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">
                    Email
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {data.user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">
                    Joined
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {new Date(data.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">
                    Branch
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {data.profile.branchName || "Not Set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">
                    Semester
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {data.profile.semesterName
                      ? `Semester ${data.profile.semesterName}`
                      : "Not Set"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Gamification & Activity Feed */}
            <div className="lg:col-span-8 space-y-6">
              {/* Level & XP Banner */}
              <div className="bg-gradient-to-r from-[#0c112b] to-[#12183d] border border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur relative overflow-hidden flex items-center justify-between">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />

                <div className="relative z-10 flex-1 pr-8 border-r border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="size-6 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">
                      Level {lvlInfo.level}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white">
                    {lvlInfo.title}
                  </h2>

                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                      <span>{data.profile.xp} XP</span>
                      <span>
                        {lvlInfo.max} XP to Level {lvlInfo.level + 1}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#0a0d1d] rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pl-8 flex gap-6">
                  <div className="text-center">
                    <div className="grid size-12 mx-auto place-items-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-2 border border-indigo-500/20">
                      <BookOpenText className="size-5" />
                    </div>
                    <span className="block text-2xl font-black text-white">
                      {data.stats.notesUploaded}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">
                      Notes
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="grid size-12 mx-auto place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/20">
                      <Award className="size-5" />
                    </div>
                    <span className="block text-2xl font-black text-white">
                      {data.stats.quizzesTaken}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">
                      Quizzes
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-[#0c112b]/80 border border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur relative overflow-hidden">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="size-5 text-indigo-400" />
                  Recent Activity Log
                </h3>

                {data.recentActivity.length === 0 ? (
                  <div className="text-center py-12 border border-white/5 border-dashed rounded-2xl">
                    <p className="text-sm text-slate-500 font-medium">
                      No recent activity found. Start studying!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    {data.recentActivity.map((act) => {
                      const details = getActivityDetails(act);
                      return (
                        <div
                          key={act._id}
                          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                        >
                          {/* Icon marker */}
                          <div
                            className={`flex items-center justify-center size-10 rounded-full border-4 border-[#0c112b] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md ${details.bg} ${details.color} z-10`}
                          >
                            <details.icon className="size-4" />
                          </div>

                          {/* Card */}
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#121633] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${details.color}`}
                              >
                                {details.title}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {new Date(act.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                              {details.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
