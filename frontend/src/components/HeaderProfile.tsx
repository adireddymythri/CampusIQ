import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function HeaderProfile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <Link to="/app/profile" className="flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity cursor-pointer">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-semibold text-white">{user.name}</p>
        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
      </div>
      <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
        <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0a0d1d] overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="size-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white uppercase">
              {user.name?.slice(0, 2) || 'IQ'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
