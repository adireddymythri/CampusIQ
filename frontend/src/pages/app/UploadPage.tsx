import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileUp,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { HeaderProfile } from '../../components/HeaderProfile'

export function UploadPage() {
  const { } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [description, setDescription] = useState('')
  const [branchId, setBranchId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [unit, setUnit] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [documentType, setDocumentType] = useState<'note' | 'paper'>('note')

  const [filters, setFilters] = useState<{
    branches: any[]
    semesters: any[]
    subjects: any[]
    units: string[]
  } | null>(null)

  useEffect(() => {
    api.get('/notes/filters')
      .then(res => setFilters(res.data))
      .catch(console.error)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      if (!title) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    if (description) formData.append('description', description)
    if (branchId) formData.append('branchId', branchId)
    if (semesterId) formData.append('semesterId', semesterId)
    if (subjectId) formData.append('subjectName', subjectId) // Send free-text subject name
    if (unit) formData.append('unit', unit)
    if (difficulty) formData.append('difficulty', difficulty)
    formData.append('documentType', documentType)

    try {
      const { data } = await api.post('/notes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (data.ok) {
        setSuccess(true)
        setTimeout(() => navigate(documentType === 'paper' ? '/app/papers' : '/app/notes'), 2000)
      }
    } catch (err: any) {
      const msg = apiErrorMessage(err)
      setError(msg)
      if (err?.response?.data?.code === 'DUPLICATE_FILE' || msg.includes('already been uploaded')) {
        alert(`Duplicate Detected:\n\n${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 p-6 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link to="/app" className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                  <ArrowLeft className="size-5" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-white">Upload Notes</h1>
              </div>
              <p className="text-slate-400 ml-14">Add your notes and organize them easily</p>
            </div>
            
            <HeaderProfile />
          </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b112f]/85 p-8 shadow-2xl backdrop-blur">
          {success ? (
            <div className="text-center py-10">
              <div className="inline-grid size-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
                <CheckCircle2 className="size-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Upload Successful!</h2>
              <p className="text-slate-400 mt-2">Your notes have been uploaded and are being processed.</p>
              <p className="text-slate-500 mt-1 text-sm italic">Redirecting to notes page...</p>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <FileText className="size-4 text-indigo-400" />
                  Document Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Software Project Management"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-indigo-500 transition-all text-white"
                    required
                  />
                  {title.length > 2 && (
                    <CheckCircle2 className="absolute right-3 top-3.5 size-5 text-emerald-500" />
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <svg className="size-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Document Type
                </label>
                <div className="relative max-w-[250px]">
                  <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value as 'note' | 'paper')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all text-white appearance-none"
                  >
                    <option value="note" className="bg-slate-900">Study Note</option>
                    <option value="paper" className="bg-slate-900">Previous Question Paper</option>
                  </select>
                  <svg className="absolute right-3 top-4 size-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>

              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <FileUp className="size-4 text-indigo-400" />
                  Select File (PDF, DOCX)
                </label>
                {!file ? (
                  <div className="relative group">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-white/10 group-hover:border-indigo-500/50 rounded-2xl p-10 flex flex-col items-center justify-center transition-all bg-white/[0.02]">
                      <div className="size-14 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                        <FileUp className="size-6" />
                      </div>
                      <p className="text-base font-bold text-white mb-1">Drag & drop your file here</p>
                      <p className="text-sm text-slate-400 mb-4">or click to browse</p>
                      <p className="text-xs text-slate-500">PDF or Word documents up to 25MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[250px]">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFile(null)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <svg className="size-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                    Branch
                  </label>
                  <select
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all text-white appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select Branch</option>
                    {filters?.branches.map(b => (
                      <option key={b._id} value={b._id} className="bg-slate-900">{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <svg className="size-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Semester
                  </label>
                  <select
                    value={semesterId}
                    onChange={e => setSemesterId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all text-white appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select Semester</option>
                    {filters?.semesters.map(s => (
                      <option key={s._id} value={s._id} className="bg-slate-900">{s.name || `Semester ${s.number}`}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <svg className="size-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Subject
                  </label>
                  <input
                    list="subject-list"
                    type="text"
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    placeholder="Type or select a subject..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all text-white"
                  />
                  <datalist id="subject-list">
                    {filters?.subjects.map(s => (
                      <option key={s._id} value={s.name} />
                    ))}
                  </datalist>
                </div>
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <svg className="size-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all text-white appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select Unit</option>
                    <option value="Unit-1" className="bg-slate-900">Unit-1</option>
                    <option value="Unit-2" className="bg-slate-900">Unit-2</option>
                    <option value="Unit-3" className="bg-slate-900">Unit-3</option>
                    <option value="Unit-4" className="bg-slate-900">Unit-4</option>
                    <option value="Unit-5" className="bg-slate-900">Unit-5</option>
                    <option value="Full Syllabus" className="bg-slate-900">Full Syllabus</option>
                  </select>
                  <svg className="absolute right-3 top-11 size-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>

              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <svg className="size-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
                  Difficulty
                </label>
                <div className="relative max-w-[200px]">
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all text-white appearance-none"
                  >
                    <option value="easy" className="bg-slate-900">Easy</option>
                    <option value="medium" className="bg-slate-900">Medium</option>
                    <option value="hard" className="bg-slate-900">Hard</option>
                  </select>
                  <div className="absolute left-3 top-3.5 size-4 flex items-center justify-center">
                    <div className={`size-2.5 rounded-full ${
                      difficulty === 'easy' ? 'bg-emerald-500' : 
                      difficulty === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                  </div>
                  <svg className="absolute right-3 top-4 size-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>

              <div className="relative">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <svg className="size-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Briefly describe what these notes cover..."
                    rows={3}
                    maxLength={250}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/50 transition-all resize-none text-white"
                  />
                  <div className="absolute bottom-3 right-4 text-xs text-slate-500">
                    {description.length} / 250
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="size-5" />
                    Upload Notes
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
