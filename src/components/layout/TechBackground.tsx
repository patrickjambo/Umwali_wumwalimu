// Fixed, animated photo background used behind the public + dashboard shells.
// Pure CSS animation (no hooks) so it works inside server components and
// respects prefers-reduced-motion via globals.css.

// Deterministic particle field (no Math.random -> no hydration mismatch).
const PARTICLES = [
  { top: "12%", left: "8%", s: 3, d: 9, delay: 0 },
  { top: "22%", left: "24%", s: 2, d: 12, delay: 1.5 },
  { top: "18%", left: "62%", s: 4, d: 10, delay: 0.6 },
  { top: "30%", left: "82%", s: 2, d: 13, delay: 2.2 },
  { top: "44%", left: "14%", s: 3, d: 11, delay: 0.9 },
  { top: "52%", left: "44%", s: 2, d: 14, delay: 1.1 },
  { top: "58%", left: "70%", s: 3, d: 9.5, delay: 2.6 },
  { top: "66%", left: "30%", s: 4, d: 12.5, delay: 0.3 },
  { top: "72%", left: "88%", s: 2, d: 10.5, delay: 1.8 },
  { top: "80%", left: "18%", s: 3, d: 13.5, delay: 1.2 },
  { top: "84%", left: "54%", s: 2, d: 11.5, delay: 0.5 },
  { top: "38%", left: "92%", s: 3, d: 9.8, delay: 2.0 },
  { top: "10%", left: "44%", s: 2, d: 12.8, delay: 1.4 },
  { top: "62%", left: "6%", s: 3, d: 10.2, delay: 0.8 },
  { top: "90%", left: "76%", s: 2, d: 13.2, delay: 2.4 },
  { top: "26%", left: "50%", s: 3, d: 11.8, delay: 0.2 },
];

export function TechBackground({ variant }: { variant: "city" | "network" }) {
  const src = variant === "city" ? "/photo/homepage-bg.jpg" : "/photo/login-bg.jpg";
  // City photo is brighter -> darken more so glass UI stays readable.
  const overlay =
    variant === "city"
      ? "linear-gradient(180deg, rgba(6,18,29,0.78), rgba(6,18,29,0.70) 45%, rgba(5,16,25,0.94))"
      : "linear-gradient(180deg, rgba(6,18,29,0.55), rgba(8,32,47,0.55) 45%, rgba(5,16,25,0.88))";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#06121d]">
      {/* photo with slow ken-burns pan */}
      <div
        className="absolute inset-0 animate-kenburns bg-cover bg-center will-change-transform"
        style={{ backgroundImage: `url(${src})` }}
      />
      {/* readability overlay */}
      <div className="absolute inset-0" style={{ background: overlay }} />

      {/* floating glow orbs */}
      <div className="animate-orb-a absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="animate-orb-b absolute -right-16 top-0 h-96 w-96 rounded-full bg-sky-600/18 blur-3xl" />
      <div className="animate-orb-a absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal-400/12 blur-3xl" />

      {/* diagonal light sweep */}
      <div className="animate-sweep absolute -inset-y-10 left-0 w-40 bg-gradient-to-r from-transparent via-cyan-200/10 to-transparent blur-xl" />

      {/* drifting particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-drift absolute rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          style={{
            top: p.top,
            left: p.left,
            width: p.s,
            height: p.s,
            animationDuration: `${p.d}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
