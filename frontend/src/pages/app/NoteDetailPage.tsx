import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  MessageSquare, 
  Share2, 
  Star, 
  FileText, 
  Calendar, 
  User,
  ExternalLink,
  Trash2
} from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'

interface NoteDetail {
  _id: string
  title: string
  description?: string
  subjectId?: { name: string }
  ownerId?: { _id: string, name: string }
  file: {
    url: string
    originalName: string
    format: string
    bytes: number
  }
  stats: {
    views: number
    downloads: number
  }
  rating: {
    avg: number
    count: number
  }
  createdAt: string
}

export function NoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<NoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Interactive Rating States
  const [userRating, setUserRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const { user } = useAuth()
  const [submittingRating, setSubmittingRating] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const { data } = await api.get<{ ok: boolean; note: NoteDetail }>(`/notes/${id}`)
        if (data.ok) setNote(data.note)
      } catch (e) {
        setError(apiErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    fetchNote()
  }, [id])

  const isOwner = user?._id === note?.ownerId?._id

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return
    
    setIsDeleting(true)
    try {
      const { data } = await api.delete(`/notes/${id}`)
      if (data.ok) {
        alert('Document deleted successfully.')
        navigate('/app/notes')
      }
    } catch (err) {
      alert(apiErrorMessage(err))
      setIsDeleting(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: note?.title || 'CampusIQ Note',
        url: window.location.href
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!note?.file?.url) return
    
    try {
      // Use fetch to download the file directly as a Blob
      const response = await fetch(note.file.url)
      if (!response.ok) throw new Error('Network response was not ok')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = note.file.originalName || 'CampusIQ_Document'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed via fetch, trying alternative:', err)
      // Fallback to Cloudinary fl_attachment if fetch fails due to CORS
      let fallbackUrl = note.file.url
      if (fallbackUrl.includes('cloudinary.com') && fallbackUrl.includes('/upload/')) {
        fallbackUrl = fallbackUrl.replace('/upload/', '/upload/fl_attachment/')
      }
      
      const link = document.createElement('a')
      link.href = fallbackUrl
      link.target = '_blank'
      link.download = note.file.originalName || 'CampusIQ_Document'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-[#050816] text-white">
        <div className="size-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-[#050816] text-slate-100 p-10 flex flex-col items-center justify-center">
        <div className="size-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6">
          <FileText className="size-10" />
        </div>
        <h1 className="text-2xl font-bold">Note Not Found</h1>
        <p className="text-slate-400 mt-2">{error || "The note you're looking for doesn't exist."}</p>
        <button 
          onClick={() => navigate('/app/notes')}
          className="mt-8 px-6 py-2 bg-indigo-600 rounded-xl font-medium hover:bg-indigo-500 transition-colors"
        >
          Back to Notes
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <Link to="/app/notes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            Back to Catalog
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 uppercase tracking-wider">
                  {note.subjectId?.name || 'General'}
                </span>
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">{note.title}</h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
                    <div className="w-full h-full rounded-[7px] bg-[#0a0d1d] flex items-center justify-center">
                      <User className="size-4 text-indigo-400" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-300">{note.ownerId?.name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 border-l border-white/10 pl-6">
                  <span className="flex items-center gap-1.5"><Eye className="size-4" /> {note.stats.views}</span>
                  <span className="flex items-center gap-1.5"><Star className="size-4 text-amber-400 fill-amber-400" /> {note.rating.avg.toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {isOwner && (
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                  title="Delete Document"
                >
                  {isDeleting ? <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : <Trash2 className="size-5" />}
                </button>
              )}
              <button 
                onClick={handleShare}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                title="Share Note"
              >
                <Share2 className="size-5" />
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                <Download className="size-5" />
                Download PDF
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-3xl border border-white/5 bg-[#0f142b] overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <FileText className="size-4 text-indigo-400" />
                  Document Preview
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 hidden sm:inline-block max-w-[200px] truncate" title={note.file.originalName}>
                    {note.file.originalName}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({(note.file.bytes / 1024).toFixed(0)} KB)
                  </span>
                  <a 
                    href={note.file.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Open PDF in New Tab"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
              <div className="h-[350px] w-full bg-[#0a0d1d] flex flex-col items-center justify-center p-0 group relative">
                {note.file.url && note.file.originalName.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={`${note.file.url}#toolbar=0`}
                    className="w-full h-full border-0 rounded-b-2xl"
                    title="PDF Document Viewer"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="size-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="size-8 text-slate-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-400 mb-1">Preview Not Available</h3>
                    <p className="text-xs text-slate-600 max-w-xs mb-4">
                      Web browsers cannot preview Word documents natively. Please download the file to view its contents.
                    </p>
                    <button 
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Download className="size-4" />
                      Download File
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/5 bg-[#0f142b] p-8">
              <h2 className="text-xl font-bold text-white mb-4">Description</h2>
              <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                {note.description || "The author didn't provide a description for this note."}
              </p>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#0f142b] p-6">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <Star className="size-5 text-amber-400 fill-amber-400" />
                Ratings & Reviews
              </h3>
              
              <div className="text-center py-8 border-b border-white/5 mb-6">
                <div className="text-5xl font-black text-white mb-2">{note.rating.avg.toFixed(1)}</div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`size-4 ${s <= Math.round(note.rating.avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">Based on {note.rating.count} reviews</p>
              </div>

              {/* Interactive Rating Component */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 text-center">Rate this Study Material</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = star <= (hoverRating || userRating)
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        disabled={submittingRating}
                        className="p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none disabled:opacity-50"
                      >
                        <Star 
                          className={`size-6 transition-all ${
                            isSelected 
                              ? 'text-amber-400 fill-amber-400 scale-110' 
                              : 'text-slate-600 hover:text-slate-500'
                          }`} 
                        />
                      </button>
                    )
                  })}
                </div>

                {userRating > 0 && (
                  <button
                    onClick={async () => {
                      if (userRating === 0) return
                      setSubmittingRating(true)
                      try {
                        const { data } = await api.post<{ ok: boolean; avg: number; count: number }>(
                          `/notes/${note._id}/rate`, 
                          { rating: userRating }
                        )
                        if (data.ok) {
                          setNote(prev => prev ? {
                            ...prev,
                            rating: { avg: data.avg, count: data.count }
                          } : null)
                          setUserRating(0)
                          alert('Thank you! Your rating has been recorded and you earned 5 XP.')
                        }
                      } catch (err) {
                        alert(apiErrorMessage(err))
                      } finally {
                        setSubmittingRating(false)
                      }
                    }}
                    disabled={submittingRating}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all text-sm flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {submittingRating ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      `Submit ${userRating}-Star Rating`
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-6">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="size-5 text-indigo-400" />
                AI Study Assistant
              </h3>
              <p className="text-sm text-indigo-200/70 mb-6">
                Have questions about this material? Our AI can help you summarize or explain complex topics.
              </p>
              <button 
                onClick={() => navigate(`/app/ai?noteId=${note._id}`)}
                className="w-full py-3 rounded-xl bg-white text-[#050816] font-bold hover:bg-slate-200 transition-all text-sm"
              >
                Ask AI Assistant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
