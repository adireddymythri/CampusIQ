import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { GoogleAuthCallbackPage } from './pages/auth/GoogleAuthCallbackPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { DashboardPage } from './pages/app/DashboardPage'
import { NotesPage } from './pages/app/NotesPage'
import { NoteDetailPage } from './pages/app/NoteDetailPage'
import { UploadPage } from './pages/app/UploadPage'
import { AIPage } from './pages/app/AIPage'
import { PracticePage } from './pages/app/PracticePage'
import { ProfilePage } from './pages/app/ProfilePage'
import { SettingsPage } from './pages/app/SettingsPage'
import { PapersPage } from './pages/app/PapersPage'
import { PlaceholderPage } from './pages/app/PlaceholderPage'

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('campusIQ_theme') || 'Dark Mode'
    if (theme === 'Light Mode') {
      document.body.classList.add('light-mode')
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* App Routes */}
      <Route path="/app" element={<DashboardPage />} />
      <Route path="/app/notes" element={<NotesPage />} />
      <Route path="/app/notes/:id" element={<NoteDetailPage />} />
      <Route path="/app/upload" element={<UploadPage />} />
      <Route path="/app/ai" element={<AIPage />} />
      <Route path="/app/practice" element={<PracticePage />} />

      <Route path="/app/discussions" element={<PlaceholderPage title="Discussions" />} />
      <Route path="/app/papers" element={<PapersPage />} />
      <Route path="/app/planner" element={<PlaceholderPage title="Planner" />} />
      <Route path="/app/leaderboard" element={<PlaceholderPage title="Leaderboard" />} />
      <Route path="/app/profile" element={<ProfilePage />} />
      <Route path="/app/settings" element={<SettingsPage />} />


      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

