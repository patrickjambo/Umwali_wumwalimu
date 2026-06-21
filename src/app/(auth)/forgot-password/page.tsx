"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldIcon } from "@/components/layout/AuthChrome";
import { TechBackground } from "@/components/layout/TechBackground";
import { BackButton } from "@/components/layout/BackButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setDevLink(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || "Twakira ubusabe bwawe.");
      if (data.devResetLink) setDevLink(data.devResetLink);
    } catch {
      setMessage("Seriveri ntiyitabye. Ongera ugerageze.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-cyan-50">
      <TechBackground variant="network" />
      <header className="absolute left-0 top-0 z-10 flex h-16 w-full items-center px-5 lg:px-10">
        <span className="text-lg font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
        <BackButton to="/login" label="Subira ku Injira" className="ml-auto" />
      </header>

      <div className="hud glass relative z-10 w-full max-w-md rounded-3xl p-7 md:p-9">
        <div className="mb-6 text-center">
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Wibagiwe ijambo banga?</h1>
          <p className="mt-2 text-sm text-cyan-100/65">
            Andika email yawe, tuzakohereza link yo gusubiramo ijambo ry&apos;ibanga.
          </p>
        </div>

        {message ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 p-3 text-sm text-cyan-50">{message}</p>
            {devLink && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
                <p className="mb-1 font-semibold">Dev: email ntiyashyizweho — koresha iyi link:</p>
                <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="break-all font-semibold text-amber-200 underline">
                  {devLink}
                </Link>
              </div>
            )}
            <Link href="/login" className="block text-center text-sm font-medium text-cyan-300 hover:underline">
              Subira ku Injira
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-cyan-100/80">Email</Label>
              <div className="relative">
                {fieldIcon("mail")}
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="m.g@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-cyan-400/20 bg-white/5 pl-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="glow-btn h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
              {loading ? "Tegereza..." : "Ohereza link yo gusubiramo"}
            </Button>
            <p className="text-center text-sm text-cyan-100/60">
              Wibutse?{" "}
              <Link href="/login" className="font-medium text-cyan-300 hover:underline">Injira hano</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
