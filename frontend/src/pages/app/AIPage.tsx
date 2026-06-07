import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Brain, 
  HelpCircle, 
  RotateCcw, 
  Loader2,
  ChevronRight,
  MessageSquare,
  Save,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { HeaderProfile } from '../../components/HeaderProfile'

interface Note {
  _id: string
  title: string
  description?: string
  subjectId?: { name: string }
  file?: { url: string; originalName: string }
}

interface Message {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: Date
  meta?: { usedPdf?: boolean; usedWebSearch?: boolean; source?: string }
}

// Custom inline formatting parser
function formatInline(text: string) {
  let parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2)
      return <strong key={idx} className="font-bold text-white">{inner}</strong>
    }
    
    let codeParts = part.split(/(`.*?`)/g)
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith('`') && cPart.endsWith('`')) {
        return (
          <code key={`${idx}-${cIdx}`} className="bg-slate-950 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-300 border border-white/5">
            {cPart.slice(1, -1)}
          </code>
        )
      }
      
      let mathParts = cPart.split(/(\$.*?\$)/g)
      return mathParts.map((mPart, mIdx) => {
        if (mPart.startsWith('$') && mPart.endsWith('$')) {
          return (
            <span key={`${idx}-${cIdx}-${mIdx}`} className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20">
              {mPart.slice(1, -1)}
            </span>
          )
        }
        return mPart
      })
    })
  })
}

// Markdown-like parser helper component
function MarkdownRenderer({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```/g, '').trim()
          return (
            <pre key={i} className="bg-[#050816] p-4 rounded-xl text-xs font-mono my-3 overflow-x-auto text-slate-300 border border-white/5 leading-relaxed">
              <code>{code}</code>
            </pre>
          )
        }

        const subParts = part.split(/(\$\$[\s\S]*?\$\$)/g)
        return subParts.map((subPart, j) => {
          if (subPart.startsWith('$$')) {
            const eq = subPart.replace(/\$\$/g, '').trim()
            return (
              <div key={`${i}-${j}`} className="text-center my-3 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 font-mono text-sm text-indigo-200">
                {eq}
              </div>
            )
          }

          const lines = subPart.split('\n')
          return lines.map((line, k) => {
            if (line.startsWith('### ')) {
              return <h3 key={`${i}-${j}-${k}`} className="text-base font-bold text-white mt-4 mb-2 flex items-center gap-1.5"><ChevronRight className="size-4 text-indigo-400" />{line.replace('### ', '')}</h3>
            }
            if (line.startsWith('#### ')) {
              return <h4 key={`${i}-${j}-${k}`} className="text-sm font-semibold text-white mt-3 mb-1">{line.replace('#### ', '')}</h4>
            }

            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
              const bulletText = line.replace(/^\s*[\*\-]\s+/, '')
              return (
                <li key={`${i}-${j}-${k}`} className="ml-4 list-disc text-sm text-slate-300 my-1">
                  {formatInline(bulletText)}
                </li>
              )
            }

            if (line.trim() === '') return <div key={`${i}-${j}-${k}`} className="h-2" />

            return (
              <p key={`${i}-${j}-${k}`} className="text-sm text-slate-300 leading-relaxed my-1">
                {formatInline(line)}
              </p>
            )
          })
        })
      })}
    </div>
  )
}

export function AIPage() {
  const {} = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const noteId = searchParams.get('noteId') || ''
  
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingNote, setFetchingNote] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data } = await api.get<{ ok: boolean; items: Note[] }>('/notes?limit=100')
        if (data.ok) setNotes(data.items)
      } catch (e) {
        console.error('Failed to fetch notes catalog:', e)
      }
    }
    fetchNotes()
  }, [])

  useEffect(() => {
    if (!noteId) {
      setSelectedNote(null)
      // Try loading conversation history for general study
      const fetchGeneralHistory = async () => {
        try {
          const historyRes = await api.get<{ ok: boolean; conversation?: { messages: Message[] } }>(`/ai/history`)
          if (historyRes.data.ok && historyRes.data.conversation?.messages?.length) {
            setMessages(historyRes.data.conversation.messages.map(m => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })))
          } else {
            setMessages([
              {
                id: 'welcome',
                sender: 'ai',
                text: "### Welcome to your AI Study Assistant! 👋\n\nI'm your advanced study tutor — like ChatGPT for your coursework. I can:\n\n* **Read your PDF notes** and answer questions from them\n* **Search the web** for extra explanations and examples\n* **Summarize, quiz, and explain** any topic step-by-step\n\n👉 **Select a note from the left panel**, or ask a general question below to get started.",
                timestamp: new Date()
              }
            ])
          }
        } catch (e) {
          console.error('Failed to load history:', e)
          setMessages([
            {
              id: 'welcome',
              sender: 'ai',
              text: "### Welcome to your AI Study Assistant! 👋\n\nI'm your advanced study tutor — like ChatGPT for your coursework. I can:\n\n* **Read your PDF notes** and answer questions from them\n* **Search the web** for extra explanations and examples\n* **Summarize, quiz, and explain** any topic step-by-step\n\n👉 **Select a note from the left panel**, or ask a general question below to get started.",
              timestamp: new Date()
            }
          ])
        }
      }
      fetchGeneralHistory()
      return
    }

    const fetchSelectedNote = async () => {
      setFetchingNote(true)
      try {
        const { data } = await api.get<{ ok: boolean; note: Note }>(`/notes/${noteId}`)
        if (data.ok) {
          setSelectedNote(data.note)
          // Try loading conversation history
          try {
            const historyRes = await api.get<{ ok: boolean; conversation?: { messages: Message[] } }>(`/ai/history?noteId=${noteId}`)
            if (historyRes.data.ok && historyRes.data.conversation?.messages?.length) {
              setMessages(historyRes.data.conversation.messages.map(m => ({
                ...m,
                timestamp: new Date(m.timestamp)
              })))
            } else {
              setMessages([
                {
                  id: 'welcome-note',
                  sender: 'ai',
                  text: `### Study Assistant Loaded! 🚀\n\nI've loaded **"${data.note.title}"** and will read its PDF content when answering.\n\nAsk anything — I'll explain clearly using your notes plus web resources when helpful.`,
                  timestamp: new Date()
                }
              ])
            }
          } catch (e) {
            console.error('Failed to load history:', e)
            setMessages([
              {
                id: 'welcome-note',
                sender: 'ai',
                text: `### Study Assistant Loaded! 🚀\n\nI've loaded **"${data.note.title}"** and will read its PDF content when answering.\n\nAsk anything — I'll explain clearly using your notes plus web resources when helpful.`,
                timestamp: new Date()
              }
            ])
          }
        }
      } catch (e) {
        setError(apiErrorMessage(e))
      } finally {
        setFetchingNote(false)
      }
    }

    fetchSelectedNote()
  }, [noteId])

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input
    if (!messageText.trim()) return

    if (!textToSend) setInput('')

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages
        .filter(m => m.id !== 'welcome' && m.id !== 'welcome-note' && m.id !== 'welcome-reset')
        .slice(-12)
        .map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text,
        }))

      const { data } = await api.post<{
        ok: boolean
        answer: string
        meta?: { usedPdf?: boolean; usedWebSearch?: boolean; source?: string; hasOpenRouterKey?: boolean }
      }>('/ai/query', {
        noteId: selectedNote?._id,
        question: messageText,
        history,
        enableWebSearch: true,
      })

      if (data.ok) {
        const aiMsg: Message = {
          id: Math.random().toString(),
          sender: 'ai',
          text: data.answer,
          timestamp: new Date(),
          meta: data.meta,
        }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (e) {
      const aiErrorMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: `⚠️ **Error:** ${apiErrorMessage(e)}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiErrorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (!selectedNote) return
    setLoading(true)
    
    // Add temporary user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: 'Please summarize this note.',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const { data } = await api.post<{ ok: boolean; summary: string; meta?: { hasPdfContent?: boolean; pdfError?: string; hasOpenRouterKey?: boolean; source?: string } }>('/ai/summarize', {
        noteId: selectedNote._id
      })

      if (data.ok) {
        let summaryText = data.summary
        if (!data.meta?.hasOpenRouterKey && !data.meta?.hasPdfContent) {
          summaryText += '\n\n---\n\n⚠️ **Could not read PDF content.** Re-upload a text-based PDF, or add `OPENROUTER_API_KEY` in backend/.env.'
        } else if (!data.meta?.hasOpenRouterKey && data.meta?.source === 'local') {
          summaryText += '\n\n---\n\n💡 *Check OpenRouter credits at openrouter.ai or restart the backend.*'
        }
        const aiMsg: Message = {
          id: Math.random().toString(),
          sender: 'ai',
          text: summaryText,
          timestamp: new Date(),
          meta: { usedPdf: data.meta?.hasPdfContent, source: data.meta?.source },
        }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (e) {
      const aiErrorMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: `⚠️ **Error generating summary:** ${apiErrorMessage(e)}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiErrorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectNote = (id: string) => {
    setSearchParams({ noteId: id })
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: selectedNote 
          ? `### Chat reset!\n\nAsk me any question about **"${selectedNote.title}"**, or use the quick buttons below.`
          : `### Chat reset!\n\nSelect a note on the left or ask general questions.`,
        timestamp: new Date()
      }
    ])
  }

  const handleSaveConversation = async () => {
    setIsSaving(true)
    try {
      const { data } = await api.post('/ai/save', {
        noteId: selectedNote?._id || null,
        messages
      })
      if (data.ok) {
        setSavedSuccess(true)
        alert('You have saved conversation successfully')
        setTimeout(() => setSavedSuccess(false), 3000)
      }
    } catch (e) {
      console.error('Failed to save conversation:', e)
      alert('Failed to save: ' + apiErrorMessage(e))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 p-4 lg:p-8 flex flex-col">
      <div className="mx-auto max-w-6xl w-full flex-1 flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Link to="/app" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="size-6 text-indigo-400 animate-pulse" />
                AI Study Assistant
              </h1>
              <p className="text-xs text-slate-400">Powered by OpenRouter — reads PDFs and searches the web.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSaveConversation}
              disabled={isSaving || messages.length <= 1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs
                ${savedSuccess 
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                  : 'border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <Save className="size-3.5" />
              )}
              {isSaving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save'}
            </button>
            <button 
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
            <div className="h-6 w-px bg-white/10 mx-1"></div>
            <HeaderProfile />
          </div>
        </header>

        {/* Main Interface Grid */}
        <div className="grid gap-6 md:grid-cols-4 flex-1 h-[calc(100vh-180px)] min-h-[450px]">
          
          {/* Notes Selection Sidebar */}
          <aside className="md:col-span-1 rounded-3xl border border-white/5 bg-[#0f142b] p-4 flex flex-col gap-4 overflow-hidden">
            <h2 className="font-bold text-white flex items-center gap-2 text-sm border-b border-white/5 pb-3">
              <BookOpen className="size-4 text-indigo-400" />
              Notes Catalog
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No study materials found.</p>
              ) : (
                notes.map(note => {
                  const isActive = note._id === noteId
                  return (
                    <button
                      key={note._id}
                      onClick={() => handleSelectNote(note._id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 group ${
                        isActive 
                          ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                          : 'bg-[#0a0d1d] border-transparent hover:border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className={`size-4.5 shrink-0 mt-0.5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">{note.title}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-1">
                          {note.subjectId?.name || 'General'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            
            {/* Note details at the bottom of sidebar if selected */}
            {selectedNote && (
              <div className="mt-auto border-t border-white/5 pt-3 bg-white/[0.01] p-3 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-1">Active Context</p>
                <h4 className="text-xs font-bold text-white truncate">{selectedNote.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{selectedNote.description || 'No description provided.'}</p>
                {selectedNote.file?.url && (
                  <Link 
                    to={`/app/notes/${selectedNote._id}`}
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold mt-2"
                  >
                    View Document <ChevronRight className="size-3" />
                  </Link>
                )}
              </div>
            )}
          </aside>

          {/* Chat Panel */}
          <main className="md:col-span-3 rounded-3xl border border-white/5 bg-[#0f142b] flex flex-col overflow-hidden relative">
            
            {/* Context bar inside Chat */}
            {fetchingNote && (
              <div className="absolute inset-0 bg-[#0f142b]/70 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-slate-400">Loading document context...</span>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isAI = msg.sender === 'ai'
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    >
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isAI 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-indigo-600 text-white'
                      }`}>
                        {isAI ? <Brain className="size-4" /> : <span className="text-xs font-bold font-mono">U</span>}
                      </div>
                      
                      <div className={`p-4 rounded-2xl ${
                        isAI 
                          ? 'bg-white/[0.02] border border-white/5 text-slate-100 rounded-tl-none' 
                          : 'bg-indigo-600/15 border border-indigo-500/20 text-slate-100 rounded-tr-none'
                      }`}>
                        <MarkdownRenderer text={msg.text} />
                        {isAI && msg.meta && (msg.meta.usedPdf || msg.meta.usedWebSearch) && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                            {msg.meta.usedPdf && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                PDF context
                              </span>
                            )}
                            {msg.meta.usedWebSearch && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Web sources
                              </span>
                            )}
                          </div>
                        )}
                        <span className="block text-[9px] text-slate-500 mt-2 text-right">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 max-w-[80%] mr-auto"
                  >
                    <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Brain className="size-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 rounded-tl-none flex items-center gap-2">
                      <Loader2 className="size-4 text-indigo-400 animate-spin" />
                      <span className="text-xs">AI is writing...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggested Prompt Buttons */}
            {selectedNote && (
              <div className="px-6 py-2 border-t border-white/5 bg-white/[0.01] flex flex-wrap gap-2">
                <button
                  onClick={handleSummarize}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="size-3" />
                  Summarize Note
                </button>
                <button
                  onClick={() => handleSendMessage('Explain the main key formulas and math concepts in this note.')}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <HelpCircle className="size-3 text-slate-400" />
                  Explain Key Concepts
                </button>
                <button
                  onClick={() => handleSendMessage('Give me a quick 3-question multiple choice practice quiz based on this note.')}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="size-3 text-slate-400" />
                  Practice Quiz
                </button>
              </div>
            )}

            {/* Message Input Panel */}
            <footer className="p-4 border-t border-white/5 bg-[#0f142b]">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  placeholder={
                    selectedNote 
                      ? `Ask anything about "${selectedNote.title}"...` 
                      : "Ask any study question (select a note for PDF-based answers)..."
                  }
                  className="flex-1 bg-[#050816] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 disabled:bg-slate-800"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </footer>

          </main>

        </div>
      </div>
    </div>
  )
}
