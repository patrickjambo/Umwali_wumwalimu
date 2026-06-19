"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressRing, SecurityStatus, NextStep, fieldIcon } from "@/components/layout/AuthChrome";
import { TechBackground } from "@/components/layout/TechBackground";
import { BackButton } from "@/components/layout/BackButton";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        setError("Konti irashobora kuba isanzweho cyangwa habaye ikibazo. (Could not register.)");
      }
    } catch {
      setError("Seriveri ntiyitabye. Ongera ugerageze. (Server unreachable.)");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-cyan-50">
      <TechBackground variant="network" />
      <header className="absolute left-0 top-0 z-10 flex h-16 w-full items-center px-5 lg:px-10">
        <span className="text-lg font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-cyan-100/80 hover:text-white">
            Login / Register
          </Link>
          <BackButton to="/" />
        </div>
      </header>

      <div className="hud glass relative z-10 w-full max-w-4xl rounded-3xl p-6 md:p-8">
        <div className="mx-auto -mt-10 mb-6 w-fit rounded-full glass-soft px-5 py-1.5 text-xs font-semibold tracking-wide text-cyan-200">
          Advanced Profile and Training Portal
        </div>

        <div className="mb-7 text-center">
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Kwiyandikisha (Register)</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-cyan-100/65">
            Uzuza imyirondoro yawe hasi aha kugira ngo ufungure konti kandi utangire amasomo yawe advance.
          </p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-[160px_1fr_180px]">
          {/* Left: training progress */}
          <div className="order-2 rounded-2xl glass-soft p-4 text-center md:order-1">
            <p className="mb-3 text-xs font-medium text-cyan-100/70">Training Progress</p>
            <ProgressRing value={15} />
            <p className="mt-3 text-[11px] text-cyan-100/60">Core Modules: 15% complete</p>
          </div>

          {/* Center: form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="order-1 space-y-4 md:order-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-cyan-100/80">Amazina</Label>
              <div className="relative">
                {fieldIcon("user")}
                <Input id="name" placeholder="Amazina yawe..." className="h-11 border-cyan-400/20 bg-white/5 pl-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" {...form.register("name")} />
              </div>
              {form.formState.errors.name && <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-cyan-100/80">Email</Label>
              <div className="relative">
                {fieldIcon("mail")}
                <Input id="email" type="email" placeholder="m.g@example.com" className="h-11 border-cyan-400/20 bg-white/5 pl-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" {...form.register("email")} />
              </div>
              {form.formState.errors.email && <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-cyan-100/80">Ijambo banga (Password)</Label>
              <div className="relative">
                {fieldIcon("lock")}
                <Input id="password" type={showPw ? "text" : "password"} placeholder="Ijambo banga (Password)" className="h-11 border-cyan-400/20 bg-white/5 px-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" {...form.register("password")} />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-100/50 hover:text-cyan-200" aria-label="toggle password">
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>}
            </div>
            {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300" role="alert">{error}</p>}
            <Button type="submit" disabled={isLoading} className="glow-btn h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
              {isLoading ? "Tegereza..." : "⚡ Iyandikishe ubu"}
            </Button>
          </form>

          {/* Right: security status */}
          <div className="order-3 rounded-2xl glass-soft p-4">
            <p className="mb-3 text-center text-xs font-medium text-cyan-100/70">System Security Status</p>
            <SecurityStatus />
          </div>
        </div>

        <div className="mt-7 rounded-2xl glass-soft p-4">
          <p className="mb-3 text-center text-xs font-semibold tracking-wide text-cyan-200">Recommended Next Steps</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <NextStep title="Take a Skill Assessment" />
            <NextStep title="View Advanced Signage Library" />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-cyan-100/60">
          Usanzwe ufite konti?{" "}
          <Link href="/login" className="font-medium text-cyan-300 hover:underline">Injira hano</Link>
        </p>
      </div>
    </div>
  );
}
