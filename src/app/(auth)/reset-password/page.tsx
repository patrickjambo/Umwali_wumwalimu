"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldIcon } from "@/components/layout/AuthChrome";
import { TechBackground } from "@/components/layout/TechBackground";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Ijambo banga rigomba kuba nibura inyuguti 6.");
    if (password !== confirm) return setError("Amagambo banga ntahuye.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 1800);
      } else {
        setError(data.message || "Habaye ikibazo.");
      }
    } catch {
      setError("Seriveri ntiyitabye. Ongera ugerageze.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-glow text-2xl font-extrabold text-white">Link ntiyemewe</h1>
        <p className="mt-2 text-sm text-cyan-100/65">Iyi link yo gusubiramo ijambo banga ntiyuzuye.</p>
        <Link href="/forgot-password" className="mt-4 inline-block font-medium text-cyan-300 hover:underline">Ongera usabe</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-2xl text-emerald-300">✓</div>
        <h1 className="text-glow text-2xl font-extrabold text-white">Byagenze neza!</h1>
        <p className="mt-2 text-sm text-cyan-100/65">Ijambo banga ryahinduwe. Turagusubiza ku rupapuro rwo Kwinjira...</p>
        <Link href="/login" className="mt-4 inline-block font-medium text-cyan-300 hover:underline">Injira ubu</Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Shyiraho ijambo banga rishya</h1>
        <p className="mt-2 text-sm text-cyan-100/65">Hitamo ijambo ry&apos;ibanga rishya kandi rikomeye.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-cyan-100/80">Ijambo banga rishya</Label>
          <div className="relative">
            {fieldIcon("lock")}
            <Input id="password" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ijambo banga rishya" className="h-11 border-cyan-400/20 bg-white/5 px-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-100/50 hover:text-cyan-200" aria-label="toggle password">{showPw ? "🙈" : "👁"}</button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-cyan-100/80">Subiramo ijambo banga</Label>
          <div className="relative">
            {fieldIcon("lock")}
            <Input id="confirm" type={showPw ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Subiramo ijambo banga" className="h-11 border-cyan-400/20 bg-white/5 px-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" />
          </div>
        </div>
        {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">{error}</p>}
        <Button type="submit" disabled={loading} className="glow-btn h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
          {loading ? "Tegereza..." : "Hindura ijambo banga"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-cyan-50">
      <TechBackground variant="network" />
      <header className="absolute left-0 top-0 z-10 flex h-16 w-full items-center px-5 lg:px-10">
        <span className="text-lg font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
      </header>
      <div className="hud glass relative z-10 w-full max-w-md rounded-3xl p-7 md:p-9">
        <Suspense fallback={<p className="text-center text-sm text-cyan-100/60">Tegereza...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
