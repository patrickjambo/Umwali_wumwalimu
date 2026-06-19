import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TechBackground } from "@/components/layout/TechBackground";

function StepIcon({ d }: { d: React.ReactNode }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center rounded-xl glass-soft text-cyan-300 animate-floaty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        {d}
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-cyan-50">
      <TechBackground variant="city" />
      {/* Header */}
      <header className="relative z-10 flex h-16 items-center px-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-cyan-100/80 transition-colors hover:text-white">
            Login
          </Link>
          <span className="text-cyan-100/30">/</span>
          <Link href="/register" className="rounded-lg px-3 py-1.5 text-cyan-100/80 transition-colors hover:text-white">
            Register
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-12 pb-8 text-center md:pt-20">
          <div className="hud glass relative w-full max-w-3xl rounded-3xl px-6 py-12 md:px-14 md:py-16">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-medium text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse-glow" />
              Advanced Driving-Law Platform
            </p>
            <h1 className="text-glow text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Uburyo Bwiza bwo Kwiga Amategeko y&apos;Umuhanda mu Rwanda
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm text-cyan-100/70 md:text-base">
              Iga amategeko y&apos;umuhanda, kora imyitozo, kandi unutsinde ibizamini byo kubona
              uruhushya rwo gutwara ibinyabiziga (Provisoire).
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/register">
                <Button className="glow-btn h-11 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-7 text-sm font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
                  Tangira Ubu →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-white">Uko Bikora (How it works)</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Kwiyandikisha",
                desc: "Iremere konti kugira ngo uyavo utangire gukurikirana amasomo yawe.",
                meta: "Registration: 98% complete",
                icon: (
                  <>
                    <circle cx="8" cy="8" r="3" />
                    <path d="M11 11l7 7m-2-5l2 2-2 2" />
                  </>
                ),
              },
              {
                title: "Kwiga (Study)",
                desc: "Soma ibika, reba ibyapa, reba imyitozo, kora kandi wige irana imategeko y'umuhanda zasobanuwe neza.",
                meta: "Module Progress: 45%",
                icon: (
                  <>
                    <path d="M4 5a2 2 0 012-2h6v16H6a2 2 0 00-2 2zM20 5a2 2 0 00-2-2h-6v16h6a2 2 0 012 2z" />
                  </>
                ),
              },
              {
                title: "Kwitwara Neza (Certify)",
                desc: "Kora ibizamini, utsinde kuko kuri kure uri busatve kurc uri busatve amorota 70% kugera ubonye icyemezo.",
                meta: "Test Accuracy: 91%",
                icon: (
                  <>
                    <circle cx="12" cy="9" r="5" />
                    <path d="M9 13l-1 7 4-2 4 2-1-7" />
                  </>
                ),
              },
            ].map((s) => (
              <div key={s.title} className="hud glass is-interactive relative rounded-2xl p-6 transition-all">
                <StepIcon d={s.icon} />
                <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-cyan-100/65">{s.desc}</p>
                <div className="mt-5 border-t border-cyan-400/15 pt-3 text-[11px] font-medium uppercase tracking-wide text-cyan-300/80">
                  {s.meta}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col items-center gap-2 border-t border-cyan-400/10 px-6 py-5 sm:flex-row">
        <p className="text-xs text-cyan-100/50">© 2026 Amategeko y&apos;Umuhanda. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-5">
          <Link href="#" className="text-xs text-cyan-100/50 transition-colors hover:text-white">Ibijyanye n&apos;iyi paji</Link>
          <Link href="#" className="text-xs text-cyan-100/50 transition-colors hover:text-white">Ubufasha</Link>
        </nav>
      </footer>
    </div>
  );
}
