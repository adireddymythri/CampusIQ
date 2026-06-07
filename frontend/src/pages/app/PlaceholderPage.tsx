import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 p-6 lg:p-10 flex flex-col items-center justify-center">
      <div className="inline-grid size-20 place-items-center rounded-3xl bg-indigo-500/10 text-indigo-400 mb-6">
        <Construction className="size-10" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
      <p className="text-slate-400 text-center max-w-md mb-8">
        We're working hard to bring this feature to life. Stay tuned for updates!
      </p>
      <Link to="/app" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-medium transition-all">
        <ArrowLeft className="size-5" />
        Back to Dashboard
      </Link>
    </div>
  )
}
