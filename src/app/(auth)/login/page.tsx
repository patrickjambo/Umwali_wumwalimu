"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NextStep, fieldIcon } from "@/components/layout/AuthChrome";
import { TechBackground } from "@/components/layout/TechBackground";
import { BackButton } from "@/components/layout/BackButton";

function IntegrityBar({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-cyan-100/70">
        <span>{label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-cyan-400 to-amber-300" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email cyangwa ijambo banga sibyo. (Invalid email or password.)");
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Habaye ikibazo kitazwi. Ongera ugerageze. (Unexpected error.)");
      }
    } catch {
      setError("Seriveri ntiyitabye. Ongera ugerageze nyuma. (Server unreachable.)");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-cyan-50">
      <TechBackground variant="network" />
      <header className="absolute left-0 top-0 z-10 flex h-16 w-full items-center gap-2 px-5 lg:px-10">
        <span className="text-lg font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
        <span className="text-sm text-cyan-100/50">Advanced Platform</span>
        <BackButton fallback="/" className="ml-auto" />
      </header>

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-5 md:grid-cols-[220px_1fr_220px]">
        {/* Left: integrity */}
        <div className="order-2 rounded-2xl glass-soft p-4 md:order-1">
          <div className="mb-3 flex items-center gap-2 text-cyan-200">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>
            <span className="text-xs font-semibold">System Security Integrity</span>
          </div>
          <div className="space-y-3">
            <IntegrityBar label="Multi-Factor Auth" />
            <IntegrityBar label="Data Encryption" />
          </div>
          <p className="mt-3 text-[11px] text-cyan-100/60">Status: <span className="font-semibold text-emerald-300">Active</span></p>
        </div>

        {/* Center: login card */}
        <div className="hud glass order-1 rounded-3xl p-7 md:order-2 md:p-9">
          <div className="mb-6 text-center">
            <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Injira (Login)</h1>
            <p className="mt-2 text-sm text-cyan-100/65">Shyiramo imyirondoro yawe kugira ngo ukomeze amasomo.</p>
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="flex justify-end">
              <Link href="#" className="text-xs text-cyan-300 hover:underline">Forgot Password?</Link>
            </div>
            {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300" role="alert">{error}</p>}
            <Button type="submit" disabled={isLoading} className="glow-btn h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
              {isLoading ? "Tegereza..." : "⊙ Injira"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-cyan-100/60">
            Nta konti ufite?{" "}
            <Link href="/register" className="font-medium text-cyan-300 hover:underline">Iyandikishe hano</Link>
          </p>
        </div>

        {/* Right: recommended content */}
        <div className="order-3 rounded-2xl glass-soft p-4">
          <p className="mb-3 text-xs font-semibold text-cyan-200">Recommended Advanced Content</p>
          <div className="space-y-3">
            <NextStep title="Module 3.1: Traffic Light Logic" />
            <NextStep title="Assessment: Advanced Right of Way" />
          </div>
        </div>
      </div>
    </div>
  );
}
