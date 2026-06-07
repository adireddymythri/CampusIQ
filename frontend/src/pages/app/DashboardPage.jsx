import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpenText,
  Bot,
  Calendar,
  ChevronRight,
  CircleUserRound,
  Eye,
  FileText,
  FileUp,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

import { api, apiErrorMessage } from "../../lib/api";
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

export function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user && !user.isEmailVerified) {
      navigate("/verify-email");
      return;
    }

    if (user) {
      const fetchData = async () => {
        try {
          const [statsRes, summaryRes] = await Promise.all([
            api.get("/dashboard/stats"),
            api.get("/dashboard/summary"),
          ]);

          if (statsRes.data.ok) setStats(statsRes.data.stats);
          if (summaryRes.data.ok) {
            setRecentNotes(summaryRes.data.recentNotes);
            setTrending(summaryRes.data.trendingNotes);
            setRecommended(summaryRes.data.recommendedNotes);
          }
        } catch (e) {
          console.error("Failed to fetch dashboard data:", apiErrorMessage(e));
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/notes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (authLoading || (loading && !stats)) {
    return (
      <div className="grid h-screen place-items-center bg-[#050816] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400 animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const currentPath = window.location.pathname;

  return (
    <div className="flex h-screen overflow-hidden bg-[#050816] text-slate-100">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 border-r border-white/5 bg-[#0a0d1d] flex flex-col p-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="text-lg font-bold tracking-tight">CampusIQ</div>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {nav.map((i) => {
            const isActive = currentPath === i.to;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <i.icon className="size-[18px]" />
                {i.label}
              </Link>
            );
          })}
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/2 -right-24 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearch} className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full rounded-2xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500/30 focus:bg-white/[0.08]"
                placeholder="Search for notes, subjects, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl border border-white/5 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                <Bell className="size-5" />
              </button>
              <HeaderProfile />
            </div>
          </header>

          <div className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back, {user?.name?.split(" ")[0] || "Scholar"} 👋
            </h1>
            <p className="mt-2 text-slate-400">
              Your personalized learning hub is ready.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Notes Viewed",
                value: stats?.notesViewed || "0",
                sub: "Total interactions",
                icon: BookOpenText,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
              },
              {
                title: "Points Earned",
                value: stats?.pointsEarned?.toLocaleString() || "0",
                sub: "XP gained from activities",
                icon: Sparkles,
                color: "text-orange-400",
                bg: "bg-orange-500/10",
                border: "border-orange-500/20",
              },
              {
                title: "Notes Uploaded",
                value: stats?.notesUploaded || "0",
                sub: "Contributions to community",
                icon: FileUp,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
              },
              {
                title: "Rank",
                value: stats?.rank || "-",
                sub: "Global student ranking",
                icon: Trophy,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`group relative overflow-hidden rounded-2xl border ${card.border} bg-[#0f142b] p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {card.title}
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-white">
                      {card.value}
                    </h3>
                  </div>
                  <div
                    className={`grid size-12 place-items-center rounded-xl ${card.bg} ${card.color}`}
                  >
                    <card.icon className="size-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <span>{card.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {/* Recent Notes */}
            <section className="xl:col-span-2 rounded-2xl border border-white/5 bg-[#0f142b] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Recent Activity
                </h2>
                <Link
                  to="/app/notes"
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  View all
                </Link>
              </div>
              <div className="mt-6 space-y-3">
                {recentNotes.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
                    <p className="text-sm text-slate-500">
                      No recent notes found.
                    </p>
                    <Link
                      to="/app/upload"
                      className="mt-2 inline-block text-xs text-indigo-400 hover:underline"
                    >
                      Upload your first note
                    </Link>
                  </div>
                )}
                {recentNotes.map((n) => (
                  <Link
                    key={n._id}
                    to={`/app/notes/${n._id}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-indigo-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <BookOpenText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-200">
                          {n.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {n.subjectId?.name || "General"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1 text-amber-400/90">
                          <Star className="size-3 fill-amber-400" />{" "}
                          {n.rating?.avg?.toFixed(1) || "0.0"}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Eye className="size-3" /> {n.stats?.views || "0"}
                        </span>
                      </div>
                      <ChevronRight className="size-4 text-slate-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Trending This Week */}
            <section className="rounded-2xl border border-white/5 bg-[#0f142b] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Trending</h2>
                <div className="flex gap-1">
                  <div className="size-1 rounded-full bg-indigo-500" />
                  <div className="size-1 rounded-full bg-indigo-500/30" />
                  <div className="size-1 rounded-full bg-indigo-500/30" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {trending.length === 0 && (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    Nothing trending yet.
                  </p>
                )}
                {trending.map((n) => (
                  <Link
                    key={n._id}
                    to={`/app/notes/${n._id}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid size-10 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
                        <BookOpenText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-200">
                          {n.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          by {n.ownerId?.name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Recommended for You */}
          <section className="mt-8 rounded-2xl border border-white/5 bg-[#0f142b] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Recommended for You
              </h2>
              <Sparkles className="size-4 text-indigo-400" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommended.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-xl">
                  <p className="text-sm text-slate-500">
                    No recommendations available yet.
                  </p>
                </div>
              )}
              {recommended.map((n) => (
                <Link
                  key={n._id}
                  to={`/app/notes/${n._id}`}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-indigo-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <BookOpenText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {n.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {n.subjectId?.name || "Study Material"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400/90">
                    <Star className="size-3 fill-amber-400" />{" "}
                    {n.rating?.avg?.toFixed(1) || "0.0"}
                    <ChevronRight className="ml-1 size-4 text-slate-600 group-hover:text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
