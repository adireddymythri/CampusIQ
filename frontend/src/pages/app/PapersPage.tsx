import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookOpenText,
  
  Eye,
  Search,
  Star,
  ArrowLeft,
  
  
  Bookmark,
  Sparkles,
  ArrowUpDown,
  LayoutDashboard,
  FileUp,
  Bot,
  MessageSquare,
  FileText,
  Calendar,
  Trophy,
  CircleUserRound,
  Settings,
  LogOut,
  Bell,
  Sliders,
} from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { HeaderProfile } from '../../components/HeaderProfile'

interface NoteItem {
  _id: string
  title: string
  description?: string
  branchId?: { _id: string; name: string; code: string }
  semesterId?: { _id: string; number: number }
  subjectId?: { _id: string; name: string }
  unit?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  stats?: { views: number; downloads: number; bookmarks: number }
  rating?: { avg: number; count: number }
  ownerId?: { name: string }
}

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/notes', label: 'Notes', icon: BookOpenText },
  { to: '/app/upload', label: 'Upload', icon: FileUp },
  { to: '/app/ai', label: 'AI Assistant', icon: Bot },
  { to: '/app/practice', label: 'Practice', icon: Sparkles },
  { to: '/app/discussions', label: 'Discussions', icon: MessageSquare },
  { to: '/app/papers', label: 'Previous Papers', icon: FileText },
  { to: '/app/planner', label: 'Planner', icon: Calendar },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/app/profile', label: 'Profile', icon: CircleUserRound },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const DEFAULT_BRANCHES = [
  { _id: 'all', name: 'All Branches', code: 'All' },
  { _id: 'CSE', name: 'Computer Science', code: 'CSE' },
  { _id: 'ECE', name: 'Electronics & Comm.', code: 'ECE' },
  { _id: 'MECH', name: 'Mechanical Eng.', code: 'MECH' },
  { _id: 'CIVIL', name: 'Civil Eng.', code: 'CIVIL' }
]

const DEFAULT_SEMESTERS = [
  { _id: 'all', number: 0, name: 'All Semesters' },
  { _id: 'Sem 1', number: 1, name: 'Semester 1' },
  { _id: 'Sem 2', number: 2, name: 'Semester 2' },
  { _id: 'Sem 3', number: 3, name: 'Semester 3' },
  { _id: 'Sem 4', number: 4, name: 'Semester 4' }
]

const DEFAULT_SUBJECTS = [
  { _id: 'all', name: 'All Subjects' },
  { _id: 'DS', name: 'Data Structures' },
  { _id: 'OS', name: 'Operating Systems' },
  { _id: 'DBMS', name: 'Database Systems' },
  { _id: 'CN', name: 'Computer Networks' },
  { _id: 'DM', name: 'Discrete Mathematics' },
  { _id: 'SE', name: 'Software Engineering' }
]

const getCardTheme = (index: number) => {
  const themes = [
    {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500/20'
    },
    {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      iconBg: 'bg-sky-500/20'
    },
    {
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/20',
      iconBg: 'bg-violet-500/20'
    },
    {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      iconBg: 'bg-indigo-500/20'
    },
    {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20'
    },
    {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/20'
    }
  ]
  return themes[index % themes.length]
}

const getDifficultyBadge = (difficulty?: string, index?: number) => {
  const diff = difficulty || (index !== undefined ? ['easy', 'medium', 'hard'][index % 3] : 'medium')
  switch (diff.toLowerCase()) {
    case 'easy':
      return {
        label: 'Easy',
        style: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      }
    case 'hard':
      return {
        label: 'Hard',
        style: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      }
    case 'medium':
    default:
      return {
        label: 'Medium',
        style: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }
  }
}

const formatViews = (views: number) => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`
  }
  return views.toString()
}

export function PapersPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters from API or fallback
  const [branches, setBranches] = useState<{ _id: string; name: string; code: string }[]>([])
  const [semesters, setSemesters] = useState<{ _id: string; number: number }[]>([])
  const [subjects, setSubjects] = useState<{ _id: string; name: string }[]>([])
  const [units, setUnits] = useState<string[]>([])

  // Filter & Search state
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedRating, setSelectedRating] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Fetch filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const { data } = await api.get('/notes/filters')
        if (data.ok) {
          setBranches(data.branches)
          setSemesters(data.semesters)
          setSubjects(data.subjects)
          setUnits(data.units)
        }
      } catch (e) {
        console.error('Failed to fetch filters:', e)
      }
    }
    fetchFilters()
  }, [])

  // Fetch notes with active filters
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (selectedBranch !== 'all') params.append('branch', selectedBranch)
        if (selectedSemester !== 'all') params.append('semester', selectedSemester)
        if (selectedSubject !== 'all') params.append('subject', selectedSubject)
        if (selectedUnit !== 'all') params.append('unit', selectedUnit)
        if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty)
        if (selectedRating !== 'all') params.append('rating', selectedRating)

        const { data } = await api.get<{ ok: boolean; items: NoteItem[] }>(`/notes?documentType=paper&${params.toString()}`)
        if (data.ok) {
          let items = data.items

          // Sort local copies of note records based on selected option
          if (sortBy === 'views') {
            items = [...items].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
          } else if (sortBy === 'rating') {
            items = [...items].sort((a, b) => (b.rating?.avg || 0) - (a.rating?.avg || 0))
          }

          setNotes(items)
        }
      } catch (e) {
        console.error('Failed to fetch notes:', apiErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [search, selectedBranch, selectedSemester, selectedSubject, selectedUnit, selectedDifficulty, selectedRating, sortBy])

  const handleClearAll = () => {
    setSearch('')
    setSelectedBranch('all')
    setSelectedSemester('all')
    setSelectedSubject('all')
    setSelectedUnit('all')
    setSelectedDifficulty('all')
    setSelectedRating('all')
    setSortBy('latest')
  }

  // Pre-process display filters (DB + placeholders fallback)
  const displayBranches = branches.length > 0
    ? [{ _id: 'all', name: 'All Branches', code: 'All' }, ...branches]
    : DEFAULT_BRANCHES

  const displaySemesters = semesters.length > 0
    ? [{ _id: 'all', number: 0, name: 'All Semesters' }, ...semesters.map(s => ({ _id: s._id, number: s.number, name: `Semester ${s.number}` }))]
    : DEFAULT_SEMESTERS

  const displaySubjects = subjects.length > 0
    ? [{ _id: 'all', name: 'All Subjects' }, ...subjects]
    : DEFAULT_SUBJECTS

  const displayUnits = ['all', 'Unit-1', 'Unit-2', 'Unit-3', 'Unit-4', 'Unit-5', 'Full Syllabus']

  const currentPath = window.location.pathname

  if (authLoading) {
    return (
      <div className="grid h-screen place-items-center bg-[#050816] text-white">
        <div className="size-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050816] text-slate-100">
      {/* Sidebar Layout */}
      <aside className="w-[240px] flex-shrink-0 border-r border-white/5 bg-[#0a0d1d] flex flex-col p-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="text-lg font-bold tracking-tight">CampusIQ</div>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {nav.map((i) => {
            const isActive = currentPath === i.to
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <i.icon className="size-[18px]" />
                {i.label}
              </Link>
            )
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

      {/* Main Content Layout */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/2 -right-24 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          {/* Top Header Section */}
          <header className="flex items-center justify-between pb-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <Link to="/app" className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                <ArrowLeft className="size-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Browse Previous Papers</h1>
                <p className="text-xs text-slate-400 mt-0.5">Filter and access high-quality previous question papers</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl border border-white/5 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                <Bell className="size-5" />
              </button>
              <HeaderProfile />
            </div>
          </header>

          {/* Master Search & Sort Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search papers by subject, topic or keyword..."
                className="w-full rounded-2xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500/30 focus:bg-white/[0.08]"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><ArrowUpDown className="size-3.5" /> Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-[#0b112f] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="latest">Latest</option>
                <option value="views">Most Views</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Core Layout: Sidebar Filters + Main Grid */}
          <div className="mt-8 flex flex-col lg:flex-row gap-6">
            
            {/* Left Filter Sidebar */}
            <aside className="w-full lg:w-[260px] flex-shrink-0 bg-[#0c112b] border border-white/5 rounded-3xl p-5 h-fit backdrop-blur shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sliders className="size-4 text-indigo-400" />
                  <span>Filters</span>
                </div>
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-4">
                {/* Branch Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    className="w-full bg-[#131937] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer"
                  >
                    {displayBranches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Semester Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={e => setSelectedSemester(e.target.value)}
                    className="w-full bg-[#131937] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer"
                  >
                    {displaySemesters.map(s => (
                      <option key={s._id} value={s._id}>{s.name || `Semester ${s.number}`}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full bg-[#131937] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer"
                  >
                    {displaySubjects.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unit</label>
                  <select
                    value={selectedUnit}
                    onChange={e => setSelectedUnit(e.target.value)}
                    className="w-full bg-[#131937] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer capitalize"
                  >
                    {displayUnits.map(u => (
                      <option key={u} value={u}>{u === 'all' ? 'All Units' : u}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="w-full bg-[#131937] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer capitalize"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Interactive Star Ratings */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rating</label>
                  <div className="flex items-center gap-2 p-2.5 bg-[#131937] rounded-xl border border-white/10">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelectedRating(selectedRating === star.toString() ? 'all' : star.toString())}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`size-4 ${
                              selectedRating !== 'all' && Number(selectedRating) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600 hover:text-slate-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {selectedRating !== 'all' && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        & above
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Note Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 bg-[#0c112b]/40 rounded-3xl border border-white/5">
                  <div className="size-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                  <p className="text-sm text-slate-400">Loading papers...</p>
                </div>
              ) : (
                <>
                  {notes.length === 0 ? (
                    <div className="text-center py-24 bg-[#0c112b]/40 rounded-3xl border border-white/5">
                      <div className="inline-grid size-16 place-items-center rounded-2xl bg-white/5 text-slate-500 mb-4">
                        <BookOpenText className="size-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">No papers found</h3>
                      <p className="text-slate-500 mt-1 text-sm max-w-xs mx-auto">Try broadening your search or adjusting the sidebar filters.</p>
                      <button
                        onClick={handleClearAll}
                        className="mt-6 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-all font-semibold text-xs px-4 py-2.5 rounded-xl border border-indigo-500/20"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {notes.map((note, index) => {
                        const theme = getCardTheme(index)
                        const difficultyInfo = getDifficultyBadge(note.difficulty, index)

                        return (
                          <Link
                            key={note._id}
                            to={`/app/notes/${note._id}`}
                            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f142b] p-5 shadow-xl transition-all duration-300 hover:translate-y-[-3px] hover:shadow-2xl hover:shadow-black/40 hover:border-indigo-500/20"
                          >
                            {/* Card Top: Colored Icon + View Info */}
                            <div className="flex items-start justify-between">
                              <div className={`grid size-11 place-items-center rounded-xl ${theme.bg} ${theme.text} transition-colors group-hover:scale-105 duration-300`}>
                                <BookOpenText className="size-5.5" />
                              </div>
                              <button
                                type="button"
                                className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                                onClick={(e) => {
                                  e.preventDefault()
                                  // bookmark logic here
                                }}
                              >
                                <Bookmark className="size-4" />
                              </button>
                            </div>

                            {/* Card Content */}
                            <div className="mt-5">
                              <h3 className="font-semibold text-white truncate text-base group-hover:text-indigo-400 transition-colors">
                                {note.title}
                              </h3>
                              <p className="text-xs text-slate-400 font-medium truncate mt-1">
                                {note.unit || `Unit ${1 + (index % 5)} - General Overview`}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                {note.branchId?.code || 'CSE'} - {note.semesterId ? `Sem ${note.semesterId.number}` : `Sem ${1 + (index % 4)}`}
                              </p>
                              <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                                {note.description || 'No description available for this study module.'}
                              </p>
                            </div>

                            {/* Card Footer: Rating & Views + Difficulty badge */}
                            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-semibold text-white">
                                  {note.rating?.avg?.toFixed(1) || (4.5 + (index % 5) * 0.1).toFixed(1)}
                                </span>
                                <span className="text-slate-500 ml-1.5 flex items-center gap-0.5">
                                  <Eye className="size-3" />
                                  {note.stats?.views !== undefined ? formatViews(note.stats.views) : '950'}
                                </span>
                              </div>

                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${difficultyInfo.style}`}>
                                {difficultyInfo.label}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
