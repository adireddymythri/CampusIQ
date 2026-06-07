import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Brain,
  FileText,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export function LandingPage() {
  const heroImage =
    '/@fs/C:/Users/nagam/.cursor/projects/c-Users-nagam-OneDrive-Desktop-campusIQ/assets/c__Users_nagam_AppData_Roaming_Cursor_User_workspaceStorage_c38426960e6234f6257dd964b11a2bcb_images_image-b6a8d119-fdbd-4a46-9a8f-846e1f4b7d76.png'

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#080b20] via-[#0a0f2a] to-[#080b20] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute right-[-8rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b1f]/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
              <Sparkles className="size-5 text-cyan-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">CampusIQ</div>
              <div className="text-xs text-slate-400">AI College Learning</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#testimonials" className="hover:text-white">
              Testimonials
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 ring-1 ring-white/10 hover:brightness-110"
            >
              Get Started
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6">
        <section className="relative py-4 md:py-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="rounded-3xl border border-white/10 bg-[#0a1027]/85 p-5 shadow-2xl shadow-indigo-950/30 md:p-6"
          >
            <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  <span className="size-2 rounded-full bg-cyan-300" />
                  The Ultimate College Learning Platform
                </div>
                <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.5rem]">
                  Your Entire Semester.
                  <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    One Platform.
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-base text-slate-300 md:text-lg">
                  Notes, AI Assistance, Practice Tests, Doubt Solving and more.
                  Everything you need to learn smarter, not harder.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:brightness-110"
                  >
                    Get Started <ArrowRight className="size-4" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/5"
                  >
                    Explore Notes
                  </a>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <img
                  src={heroImage}
                  alt="CampusIQ learning platform visual"
                  className="h-[18rem] w-full rounded-2xl border border-white/10 object-cover object-center shadow-2xl shadow-indigo-950/40 md:h-[20rem] lg:h-[22rem]"
                />
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-[#0a1027]/25 to-transparent" />
              </motion.div>
            </div>

            <div id="features" className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                {
                  icon: FileText,
                  title: 'Smart Notes',
                  desc: 'Access high-quality notes',
                  tone: 'from-pink-500/25 to-rose-500/25',
                  iconColor: 'text-rose-300',
                },
                {
                  icon: Bot,
                  title: 'AI Assistant',
                  desc: 'Solve doubts instantly',
                  tone: 'from-emerald-500/25 to-green-500/25',
                  iconColor: 'text-emerald-300',
                },
                {
                  icon: Brain,
                  title: 'Exam Practice',
                  desc: 'Practice MCQs & tests',
                  tone: 'from-amber-500/25 to-orange-500/25',
                  iconColor: 'text-amber-300',
                },
                {
                  icon: MessageCircle,
                  title: 'Community',
                  desc: 'Ask, answer, learn together',
                  tone: 'from-sky-500/25 to-blue-500/25',
                  iconColor: 'text-sky-300',
                },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-[#0b112f]/85 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid size-8 place-items-center rounded-lg bg-gradient-to-r ${card.tone} ring-1 ring-white/10`}
                    >
                      <card.icon className={`size-4 ${card.iconColor}`} />
                    </div>
                    <div className="text-sm font-semibold">{card.title}</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{card.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 border-t border-white/10 pt-3 md:grid-cols-4">
                {[
                  { k: '10K+', v: 'Students' },
                  { k: '50K+', v: 'Notes Uploaded' },
                  { k: '100+', v: 'Colleges' },
                  { k: '4.9 ⭐', v: 'User Rating' },
                ].map((s) => (
                  <div key={s.v} className="px-2 py-2 text-center md:px-4">
                    <div className="text-2xl font-semibold text-purple-300 md:text-3xl">{s.k}</div>
                    <div className="mt-1 text-xs text-slate-400">{s.v}</div>
                  </div>
                ))}
              </div>
          </motion.div>
        </section>

        <section id="how-it-works" className="py-8 md:py-12">
          <div className="rounded-3xl border border-white/10 bg-[#0b112f]/85 p-8 backdrop-blur">
            <div className="text-sm text-slate-300">How It Works</div>
            <div className="mt-2 text-2xl font-semibold">Study flow built for your semester</div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { step: '01', title: 'Upload Notes', desc: 'Add your subject notes and resources.' },
                { step: '02', title: 'Learn with AI', desc: 'Get summaries, explanations, and quick revision points.' },
                { step: '03', title: 'Practice & Improve', desc: 'Take quizzes and track your progress daily.' },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl bg-[#0a1027]/90 p-5 ring-1 ring-white/10">
                  <div className="text-xs text-cyan-300">Step {item.step}</div>
                  <div className="mt-2 text-lg font-semibold">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-300">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-8 md:py-12">
          <div className="rounded-3xl border border-white/10 bg-[#0b112f]/85 p-8 backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm text-slate-300">Pricing</div>
                <div className="mt-2 text-2xl font-semibold">Start free. Upgrade for AI power.</div>
              </div>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15"
              >
                Create your CampusIQ
              </Link>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                {
                  name: 'Starter',
                  price: '₹0',
                  items: ['Notes browsing', 'Bookmarks', 'Basic quizzes'],
                },
                {
                  name: 'Pro AI',
                  price: '₹199/mo',
                  items: ['AI summaries', 'AI quiz generation', 'Doubt assistant'],
                },
              ].map((p) => (
                <div key={p.name} className="rounded-3xl bg-[#0a1027]/90 p-6 ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{p.name}</div>
                    <div className="text-sm text-slate-300">{p.price}</div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {p.items.map((i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-cyan-300" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-8 md:py-12">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                q: 'Helped me prepare faster every week.',
                a: 'CampusIQ summaries and quizzes save hours before exams.',
              },
              {
                q: 'Feels premium and super easy to use.',
                a: 'Everything from notes to discussion is clean and quick.',
              },
              {
                q: 'The AI assistant is genuinely useful.',
                a: 'It explains concepts in simple language with examples.',
              },
              {
                q: 'Great for campus collaboration.',
                a: 'We use it to share notes and clear doubts as a team.',
              },
            ].map((x) => (
              <div
                key={x.q}
                className="rounded-3xl border border-white/10 bg-[#0b112f]/85 p-6 backdrop-blur"
              >
                <div className="font-semibold">{x.q}</div>
                <div className="mt-2 text-sm text-slate-300">{x.a}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-8 md:pb-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Brain,
                title: 'AI Summaries & Quizzes',
                desc: 'Auto summarize PDFs, extract key points, and generate timed MCQs.',
              },
              {
                icon: ShieldCheck,
                title: 'College-only Access',
                desc: 'JWT + Google OAuth with verified college email domains.',
              },
              {
                icon: Sparkles,
                title: 'Premium UI & Analytics',
                desc: 'Dashboard cards, micro-interactions, charts, and dark glass UI.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border border-white/10 bg-[#0b112f]/85 p-6 backdrop-blur"
              >
                <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-cyan-400/20 ring-1 ring-white/10">
                  <f.icon className="size-5 text-cyan-200" />
                </div>
                <div className="mt-4 text-lg font-semibold">{f.title}</div>
                <div className="mt-2 text-sm text-slate-300">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-10 text-sm text-slate-400">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} CampusIQ</div>
            <div className="flex gap-4">
              <a className="hover:text-slate-200" href="#">
                Privacy
              </a>
              <a className="hover:text-slate-200" href="#">
                Terms
              </a>
              <a className="hover:text-slate-200" href="#">
                Support
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

