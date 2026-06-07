import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  
  Award,
  
  HelpCircle
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
}

interface QuizItem {
  _id: string
  title: string
  mode: 'practice' | 'timed'
  durationSec: number
  questionCount: number
  subjectId?: { _id: string; name: string }
  noteId?: { _id: string; title: string }
  createdAt: string
  bestScore?: { score: number; total: number } | null
}

interface QuestionOption {
  text: string
  isCorrect: boolean
}

interface QuizQuestion {
  _id: string
  prompt: string
  options: QuestionOption[]
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  topic?: string
  order: number
}

interface SubmittedResult {
  questionId: string
  prompt: string
  selectedOptionIndex: number
  correctOptionIndex: number
  isCorrect: boolean
  explanation: string
  options: QuestionOption[]
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

export function PracticePage() {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // App state
  const [view, setView] = useState<'selector' | 'taking' | 'results'>('selector')
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Selector state
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [quizMode, setQuizMode] = useState<'practice' | 'timed'>('practice')
  const [durationMins, setDurationMins] = useState(10)
  const [questionCount, setQuestionCount] = useState(5)
  const [syllabusText, setSyllabusText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Active quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null)
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({}) // maps questionId -> selectedOptionIndex
  const [markedQuestions, setMarkedQuestions] = useState<Record<string, boolean>>({}) // maps questionId -> boolean

  // Timer states
  const [timeLeftSec, setTimeLeftSec] = useState(0)
  const [elapsedTimeSec, setElapsedTimeSec] = useState(0)

  // Submission / Results state
  const [, setSubmitting] = useState(false)
  const [quizResults, setQuizResults] = useState<{
    score: number
    totalQuestions: number
    xpEarned: number
    results: SubmittedResult[]
  } | null>(null)

  // Reference to userAnswers to prevent stale closures inside timer interval
  const answersRef = useRef(userAnswers)
  useEffect(() => {
    answersRef.current = userAnswers
  }, [userAnswers])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Initial data loading
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data } = await api.get('/notes')
        if (data.ok) {
          setNotes(data.items || [])
          if (data.items && data.items.length > 0) {
            setSelectedNoteId(data.items[0]._id)
          }
        }
      } catch (e) {
        console.error('Failed to load notes:', e)
      } finally {
        setLoadingNotes(false)
      }
    }

    const fetchQuizHistory = async () => {
      try {
        const { data } = await api.get('/quizzes')
        if (data.ok) {
          setQuizzes(data.quizzes || [])
        }
      } catch (e) {
        console.error('Failed to load quizzes history:', e)
      } finally {
        setLoadingHistory(false)
      }
    }

    if (user) {
      fetchNotes()
      fetchQuizHistory()
    }
  }, [user])

  // Timer runner
  useEffect(() => {
    if (view !== 'taking' || !activeQuiz) return

    const interval = setInterval(() => {
      if (activeQuiz.mode === 'timed') {
        setTimeLeftSec((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            handleSubmitQuiz(answersRef.current)
            return 0
          }
          return prev - 1
        })
      } else {
        setElapsedTimeSec((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [view, activeQuiz])

  // Generate / start a quiz
  const handleStartQuiz = async () => {
    if (!selectedNoteId) {
      setErrorMsg('Please select a PDF study material to practice.')
      return
    }
    setErrorMsg('')
    setGenerating(true)

    try {
      const { data } = await api.post('/quizzes/generate', {
        noteId: selectedNoteId,
        mode: quizMode,
        durationSec: quizMode === 'timed' ? durationMins * 60 : 0,
        questionCount,
        syllabusText
      })

      if (data.ok) {
        setActiveQuiz(data.quiz)
        setActiveQuestions(data.questions)
        setCurrentQuestionIndex(0)
        setUserAnswers({})
        setMarkedQuestions({})

        if (quizMode === 'timed') {
          setTimeLeftSec(durationMins * 60)
        } else {
          setElapsedTimeSec(0)
        }

        setView('taking')
      }
    } catch (e) {
      setErrorMsg(apiErrorMessage(e))
    } finally {
      setGenerating(false)
    }
  }

  // Restart a previously completed quiz
  const handleRetakeQuiz = async (quizId: string) => {
    setGenerating(true)
    setErrorMsg('')
    try {
      const { data } = await api.get(`/quizzes/${quizId}`)
      if (data.ok) {
        setActiveQuiz(data.quiz)
        setActiveQuestions(data.questions)
        setCurrentQuestionIndex(0)
        setUserAnswers({})
        setMarkedQuestions({})

        if (data.quiz.mode === 'timed') {
          setTimeLeftSec(data.quiz.durationSec || 600)
        } else {
          setElapsedTimeSec(0)
        }

        setView('taking')
      }
    } catch (e) {
      setErrorMsg(apiErrorMessage(e))
    } finally {
      setGenerating(false)
    }
  }

  // Submit the active quiz
  const handleSubmitQuiz = async (answersOverride?: Record<string, number>) => {
    if (!activeQuiz) return
    setSubmitting(true)

    const finalAnswers = answersOverride || userAnswers
    const answersList = Object.entries(finalAnswers).map(([qId, index]) => ({
      questionId: qId,
      selectedOptionIndex: index,
      timeTakenMs: 0
    }))

    try {
      const { data } = await api.post(`/quizzes/${activeQuiz._id}/submit`, {
        answers: answersList
      })

      if (data.ok) {
        setQuizResults(data)
        setView('results')
        // Refresh history list
        const historyData = await api.get('/quizzes')
        if (historyData.data.ok) {
          setQuizzes(historyData.data.quizzes || [])
        }
      }
    } catch (e) {
      console.error('Submission failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Format total seconds into HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Helper count variables for sidebar stats
  const answeredCount = Object.keys(userAnswers).length
  const markedCount = Object.values(markedQuestions).filter(Boolean).length
  const notAnsweredCount = activeQuestions.length - answeredCount

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

        <div className="relative z-10 p-6 lg:p-8 min-h-full flex flex-col">
          {/* Top Header Section */}
          <header className="flex items-center justify-between pb-6 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Link to="/app" className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                <ArrowLeft className="size-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Practice Arena</h1>
                <p className="text-xs text-slate-400 mt-0.5">Test your knowledge with AI generated exams from your notes</p>
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

          <div className="flex-1 mt-6 flex flex-col">
            {/* VIEW 1: QUIZ SELECTOR & DASHBOARD */}
            {view === 'selector' && (
              <div className="space-y-8 flex-1 flex flex-col">
                {errorMsg && (
                  <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3.5 rounded-2xl text-sm">
                    <AlertCircle className="size-5 flex-shrink-0" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-12">
                  {/* Left Column: Generate Quiz Configurator */}
                  <div className="lg:col-span-7 bg-[#0c112b] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                        <Sparkles className="size-5 text-indigo-400 animate-pulse" />
                        AI Quiz Generator
                      </h2>
                      <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Select one of your uploaded PDF documents below, and our AI will immediately synthesize structured, multiple-choice testing materials.
                      </p>

                      {loadingNotes ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                          <div className="size-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
                          <span className="text-xs text-slate-400">Loading your notes...</span>
                        </div>
                      ) : notes.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 border border-white/5 rounded-2xl p-6">
                          <BookOpenText className="size-10 mx-auto text-slate-600 mb-2" />
                          <h3 className="text-sm font-semibold text-white">No PDFs Available</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto mb-4">
                            You need to upload at least one study material note before you can generate practice tests.
                          </p>
                          <Link
                            to="/app/upload"
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all"
                          >
                            <FileUp className="size-4" />
                            Upload Note Now
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Note select */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Study Document (PDF)</label>
                            <select
                              value={selectedNoteId}
                              onChange={(e) => setSelectedNoteId(e.target.value)}
                              className="w-full bg-[#131937] border border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer transition-all"
                            >
                              {notes.map((note) => (
                                <option key={note._id} value={note._id}>
                                  {note.title} {note.subjectId ? `(${note.subjectId.name})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quiz Mode Selector */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Testing Mode</label>
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                type="button"
                                onClick={() => setQuizMode('practice')}
                                className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                                  quizMode === 'practice'
                                    ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-lg'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                                }`}
                              >
                                <span className="font-semibold text-sm">Practice Mode</span>
                                <span className="text-[10px] text-slate-500 mt-1 leading-relaxed">No timers. Perfect for learning at your own pace with instant answer reveals.</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setQuizMode('timed')}
                                className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                                  quizMode === 'timed'
                                    ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-lg'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                                }`}
                              >
                                <span className="font-semibold text-sm">Timed Exam Mode</span>
                                <span className="text-[10px] text-slate-500 mt-1 leading-relaxed">Simulates exam conditions. A ticking clock forces rapid critical reasoning.</span>
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Parameters based on Mode */}
                          <div className="grid grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Number of Questions</label>
                              <select
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="w-full bg-[#131937] border border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer transition-all"
                              >
                                <option value="3">3 Questions</option>
                                <option value="5">5 Questions</option>
                                <option value="10">10 Questions</option>
                                <option value="15">15 Questions</option>
                                <option value="20">20 Questions</option>
                              </select>
                            </div>

                            {quizMode === 'timed' && (
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time Duration</label>
                                <select
                                  value={durationMins}
                                  onChange={(e) => setDurationMins(Number(e.target.value))}
                                  className="w-full bg-[#131937] border border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/40 cursor-pointer transition-all"
                                >
                                  <option value="3">3 Minutes</option>
                                  <option value="5">5 Minutes</option>
                                  <option value="10">10 Minutes</option>
                                  <option value="15">15 Minutes</option>
                                  <option value="20">20 Minutes</option>
                                  <option value="30">30 Minutes</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Syllabus Input */}
                          <div className="space-y-2 pt-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Syllabus / Extra Topics (Optional)</span>
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">NEW</span>
                            </label>
                            <textarea
                              value={syllabusText}
                              onChange={(e) => setSyllabusText(e.target.value)}
                              placeholder="Paste any syllabus topics or specific areas you want the quiz to cover alongside the document..."
                              className="w-full bg-[#131937] border border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/40 transition-all resize-none h-24 placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {notes.length > 0 && (
                      <button
                        onClick={handleStartQuiz}
                        disabled={generating}
                        className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        {generating ? (
                          <>
                            <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Synthesizing Quiz Questions...
                          </>
                        ) : (
                          <>
                            <Play className="size-4 fill-white" />
                            Generate & Start Quiz
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right Column: Gamification Metrics & Stats */}
                  <div className="lg:col-span-5 bg-[#0a0d20]/60 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <Award className="size-5 text-amber-400" />
                        Practice Analytics
                      </h2>
                      <p className="text-xs text-slate-400 mb-6">Track your performance and secure valuable XP incentives.</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#121633] border border-white/5 rounded-2xl p-4 text-center">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">XP Bonus</span>
                          <span className="text-2xl font-black text-amber-400 mt-2 block">+15 XP</span>
                          <span className="text-[9px] text-slate-500 mt-1 block">per finished quiz</span>
                        </div>

                        <div className="bg-[#121633] border border-white/5 rounded-2xl p-4 text-center">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Correct Answer Reward</span>
                          <span className="text-2xl font-black text-emerald-400 mt-2 block">+10 XP</span>
                          <span className="text-[9px] text-slate-500 mt-1 block">for every correct MCQ</span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-3 bg-[#11142e] border border-white/5 rounded-2xl p-4">
                          <div className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
                            <Clock className="size-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Adaptive AI Questions</span>
                            <span className="text-[10px] text-slate-400 leading-normal block">AI auto-tunes question complexities based on your note text and past scores.</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-[#11142e] border border-white/5 rounded-2xl p-4">
                          <div className="grid size-10 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
                            <HelpCircle className="size-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Detailed Explanations</span>
                            <span className="text-[10px] text-slate-400 leading-normal block">Receive elaborate breakdowns and answers instantly to study from.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-white/5 pt-4 text-center">
                      <span className="text-[10px] text-slate-500 leading-relaxed block">
                        All quizzes generated are registered on your profile. Retaking tests can continuously hone your retention and understanding of notes.
                      </span>
                    </div>
                  </div>
                </div>

                {/* History Section: Previous Attempts */}
                <div className="flex-1 flex flex-col mt-4">
                  <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpenText className="size-4.5 text-indigo-400" />
                    Past Quiz Catalog & Attempts
                  </h2>

                  {loadingHistory ? (
                    <div className="py-12 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3">
                      <div className="size-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
                      <span className="text-xs text-slate-400">Loading past attempts...</span>
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="text-center py-12 bg-[#0c112b]/30 border border-white/5 rounded-3xl">
                      <p className="text-sm text-slate-500 font-medium">You haven't generated any quizzes yet. Start one above!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {quizzes.map((q) => (
                        <div
                          key={q._id}
                          className="bg-[#0f142b] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-indigo-500/20 transition-all group"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                q.mode === 'timed'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {q.mode === 'timed' ? 'Timed' : 'Practice'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">{new Date(q.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-bold text-white text-sm mt-3 group-hover:text-indigo-400 transition-colors line-clamp-1">{q.title}</h3>
                            <p className="text-[11px] text-slate-400 mt-1 truncate">
                              Document: {q.noteId?.title || 'Study Material'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Questions: {q.questionCount} {q.mode === 'timed' ? `| Duration: ${q.durationSec / 60}m` : ''}
                            </p>
                            {q.bestScore && (
                              <p className="text-[10px] mt-1.5 font-bold">
                                <span className={q.bestScore.score / q.bestScore.total >= 0.7 ? "text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded" : "text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded"}>
                                  Best Score: {q.bestScore.score} / {q.bestScore.total}
                                </span>
                              </p>
                            )}
                          </div>

                          <div className="mt-5 border-t border-white/5 pt-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400">Ready to practice</span>
                            <button
                              onClick={() => handleRetakeQuiz(q._id)}
                              className="bg-white/5 border border-white/10 hover:bg-indigo-600/10 hover:text-indigo-400 hover:border-indigo-500/20 text-slate-300 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <Play className="size-3 fill-current" />
                              Start Quiz
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: INTERACTIVE QUIZ INTERFACE (AS SHOWN IN THE IMAGE) */}
            {view === 'taking' && activeQuiz && activeQuestions.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-12 flex-1 items-start">
                
                {/* Left Panel: Statistics and Countdown (Matches user screenshot) */}
                <div className="lg:col-span-4 bg-[#0a0d1d] border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden backdrop-blur">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Timer Display */}
                  <div className="bg-[#0e122b] border border-white/5 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none" />
                    
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      {activeQuiz.mode === 'timed' ? 'Time Remaining' : 'Elapsed Time'}
                    </span>
                    
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <Clock className={`size-6 ${activeQuiz.mode === 'timed' && timeLeftSec < 60 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
                      <span className={`text-3xl font-black tracking-wider leading-none font-mono ${
                        activeQuiz.mode === 'timed'
                          ? timeLeftSec < 60 ? 'text-rose-400 animate-pulse' : 'text-indigo-300'
                          : 'text-emerald-400'
                      }`}>
                        {activeQuiz.mode === 'timed' ? formatTime(timeLeftSec) : formatTime(elapsedTimeSec)}
                      </span>
                    </div>
                  </div>

                  {/* Question tracker & progress bar */}
                  <div className="mt-6 border-b border-white/5 pb-5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span>Question Progress</span>
                      <span className="text-white">Question {currentQuestionIndex + 1} / {activeQuestions.length}</span>
                    </div>
                    
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 bg-[#121633] rounded-full mt-3 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Statistics Counters */}
                  <div className="mt-5 space-y-3.5">
                    <div className="flex items-center justify-between text-xs font-bold p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2.5 text-emerald-400">
                        <div className="size-4 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <div className="size-2 rounded-sm bg-emerald-400" />
                        </div>
                        <span>Answered</span>
                      </div>
                      <span className="text-white bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">{answeredCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2.5 text-rose-400">
                        <div className="size-4 rounded border border-rose-500/30 flex items-center justify-center">
                          <div className="size-2 rounded-sm bg-rose-500/20" />
                        </div>
                        <span>Not Answered</span>
                      </div>
                      <span className="text-white bg-rose-500/10 px-2 py-0.5 rounded text-[11px]">{notAnsweredCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2.5 text-violet-400">
                        <div className="size-4 rounded bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                          <div className="size-2 rounded-sm bg-violet-400" />
                        </div>
                        <span>Marked for Review</span>
                      </div>
                      <span className="text-white bg-violet-500/20 px-2 py-0.5 rounded text-[11px]">{markedCount}</span>
                    </div>
                  </div>

                  {/* Question Index Quick-Nav Buttons */}
                  <div className="mt-6 border-t border-white/5 pt-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Quick Navigation Grid</span>
                    <div className="grid grid-cols-5 gap-2">
                      {activeQuestions.map((q, idx) => {
                        const isCurrent = idx === currentQuestionIndex
                        const isAnswered = userAnswers[q._id] !== undefined
                        const isMarked = markedQuestions[q._id] === true

                        let btnClass = 'bg-[#121633] text-slate-400 border border-white/5 hover:border-white/20'

                        if (isCurrent) {
                          btnClass = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-500/30'
                        } else if (isMarked) {
                          btnClass = 'bg-violet-500/20 border border-violet-500/40 text-violet-300 font-bold'
                        } else if (isAnswered) {
                          btnClass = 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
                        }

                        return (
                          <button
                            key={q._id}
                            type="button"
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`size-10 rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${btnClass}`}
                          >
                            {idx + 1}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* End Test Button */}
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to end this test and submit all answers?')) {
                        handleSubmitQuiz()
                      }
                    }}
                    type="button"
                    className="w-full mt-6 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    End Test & Submit
                  </button>
                </div>

                {/* Right Panel: Active Question Pane */}
                <div className="lg:col-span-8 bg-[#0c112b] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Topic tag + Mark for Review (Matches user screenshot) */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <span className="bg-[#12183d] text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                      Topic: {activeQuestions[currentQuestionIndex].topic || 'General'}
                    </span>
                    
                    <label className="flex items-center gap-2 cursor-pointer select-none group text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={markedQuestions[activeQuestions[currentQuestionIndex]._id] === true}
                        onChange={(e) => {
                          setMarkedQuestions({
                            ...markedQuestions,
                            [activeQuestions[currentQuestionIndex]._id]: e.target.checked
                          })
                        }}
                        className="rounded border-white/10 bg-[#121633] text-violet-500 focus:ring-violet-500/20 size-4 cursor-pointer focus:ring-offset-0 focus:ring-1"
                      />
                      <span>Mark for review</span>
                    </label>
                  </div>

                  {/* Active Question Prompt */}
                  <div className="mt-6 min-h-[80px]">
                    <h3 className="text-lg font-semibold text-white leading-relaxed">
                      {activeQuestions[currentQuestionIndex].prompt}
                    </h3>
                  </div>

                  {/* Options List */}
                  <div className="mt-6 space-y-4">
                    {activeQuestions[currentQuestionIndex].options.map((option, idx) => {
                      const letters = ['A', 'B', 'C', 'D']
                      const isSelected = userAnswers[activeQuestions[currentQuestionIndex]._id] === idx

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setUserAnswers({
                              ...userAnswers,
                              [activeQuestions[currentQuestionIndex]._id]: idx
                            })
                          }}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all group ${
                            isSelected
                              ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 border-transparent text-white font-medium shadow-lg shadow-indigo-600/20'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/[0.08] hover:border-white/10'
                          }`}
                        >
                          <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-white text-indigo-600 shadow'
                              : 'bg-white/10 text-slate-300 group-hover:bg-white/20'
                          }`}>
                            {letters[idx]}
                          </div>
                          <span className="text-sm font-medium">{option.text}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Footer Controls: Previous, Next */}
                  <div className="mt-8 border-t border-white/5 pt-6 flex justify-between">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      disabled={currentQuestionIndex === 0}
                      className="bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold px-5 py-3 rounded-xl transition-all"
                    >
                      Previous
                    </button>

                    {currentQuestionIndex === activeQuestions.length - 1 ? (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to end this test and submit all answers?')) {
                            handleSubmitQuiz()
                          }
                        }}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
                      >
                        Submit Test
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 3: QUIZ SCORECARD & DETAILED RESULTS */}
            {view === 'results' && quizResults && activeQuiz && (
              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* Scorecard Hero */}
                <div className="bg-[#0c112b] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur text-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    
                    {/* Visual Circular/Radial Score Progress */}
                    <div className="size-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2 shadow-2xl relative flex items-center justify-center border border-white/10 animate-bounce-slow">
                      <div className="size-full rounded-full bg-[#0a0d1d] flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white">{quizResults.score} / {quizResults.totalQuestions}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Correct</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-white mt-5">Practice Quiz Finalized!</h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Outstanding effort! You've successfully finished taking the test for <strong>{activeQuiz.title}</strong>.
                    </p>

                    {/* Gamified XP earned container */}
                    <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-sm shadow-lg shadow-amber-500/5 animate-pulse">
                      <Sparkles className="size-4 animate-spin text-amber-400" />
                      <span>+{quizResults.xpEarned} XP Gained & Added to Profile!</span>
                    </div>

                    <button
                      onClick={() => setView('selector')}
                      className="mt-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all"
                    >
                      Back to Practice Area
                    </button>
                  </div>
                </div>

                {/* Detailed Answers Breakdown */}
                <div className="flex-grow">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-indigo-400" />
                    Correct Answers & Detailed Breakdowns
                  </h3>

                  <div className="space-y-5">
                    {quizResults.results.map((res, index) => {
                      const letters = ['A', 'B', 'C', 'D']
                      return (
                        <div
                          key={res.questionId}
                          className={`border rounded-3xl p-5 shadow-lg relative overflow-hidden backdrop-blur ${
                            res.isCorrect
                              ? 'bg-emerald-500/[0.02] border-emerald-500/20'
                              : 'bg-rose-500/[0.02] border-rose-500/20'
                          }`}
                        >
                          {/* Top Tag info */}
                          <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <span className="text-slate-400 font-bold text-xs">Question {index + 1}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                              res.isCorrect
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {res.isCorrect ? (
                                <>
                                  <CheckCircle2 className="size-3" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <XCircle className="size-3" />
                                  Incorrect
                                </>
                              )}
                            </span>
                          </div>

                          {/* Question prompt */}
                          <h4 className="font-bold text-white text-sm mt-4 leading-relaxed">{res.prompt}</h4>

                          {/* Options stack */}
                          <div className="mt-4 space-y-2.5">
                            {res.options.map((opt, optIdx) => {
                              const isStudentSelected = res.selectedOptionIndex === optIdx
                              const isCorrect = res.correctOptionIndex === optIdx

                              let optClass = 'bg-white/5 border border-white/5 text-slate-400'

                              if (isCorrect) {
                                optClass = 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium'
                              } else if (isStudentSelected) {
                                optClass = 'bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium'
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-3 p-3 rounded-xl text-xs ${optClass}`}
                                >
                                  <div className={`size-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-white'
                                      : isStudentSelected
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-white/10 text-slate-400'
                                  }`}>
                                    {letters[optIdx]}
                                  </div>
                                  <span>{opt.text}</span>
                                  {isCorrect && <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Correct Choice</span>}
                                  {isStudentSelected && !isCorrect && <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">Your Choice</span>}
                                </div>
                              )
                            })}
                          </div>

                          {/* Explanation block */}
                          {res.explanation && (
                            <div className="mt-5 bg-indigo-950/40 border border-indigo-500/10 rounded-2xl p-4 text-xs leading-relaxed text-indigo-200">
                              <span className="font-bold text-indigo-400 flex items-center gap-1.5 mb-1">
                                <AlertCircle className="size-4" />
                                💡 Explanation & Insight:
                              </span>
                              <p className="pl-5">{res.explanation}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
