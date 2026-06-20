import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { daysRemaining, getDefaultTrialDays, SUPPORT_PHONE } from "@/lib/access";
import { setUserActive, addUserDays, addUserDaysForm, setDefaultTrialForm } from "./actions";
import { AutoRefresh } from "@/components/layout/AutoRefresh";

export const dynamic = "force-dynamic";

function StatusPill({ active, days }: { active: boolean; days: number }) {
  const ok = active && days > 0;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? "bg-emerald-400/15 text-emerald-300" : !active ? "bg-red-400/15 text-red-300" : "bg-amber-400/15 text-amber-300"}`}>
      {!active ? "Yahagaritswe" : days > 0 ? "Irakora" : "Yarangiye"}
    </span>
  );
}

export default async function AdminUsersPage() {
  const [list, trial] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    getDefaultTrialDays(),
  ]);
  const students = list.filter((u) => u.role !== "admin");
  const activeCount = students.filter((u) => u.isActive && daysRemaining(u.accessExpiresAt) > 0).length;
  const expiredCount = students.length - activeCount;

  return (
    <div className="space-y-6">
      <AutoRefresh />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Abakoresha (Users)</h1>
          <p className="mt-1 text-sm text-cyan-100/65">
            Genzura konti z&apos;abanyeshuri — gufungura/guhagarika no kongera iminsi. Telefoni y&apos;ubufasha: {SUPPORT_PHONE}
          </p>
        </div>
        <div className="flex gap-3 text-center text-sm">
          <div className="glass-soft rounded-xl px-4 py-2"><div className="text-lg font-bold text-white">{students.length}</div><div className="text-[11px] text-cyan-100/60">Bose</div></div>
          <div className="glass-soft rounded-xl px-4 py-2"><div className="text-lg font-bold text-emerald-300">{activeCount}</div><div className="text-[11px] text-cyan-100/60">Bakora</div></div>
          <div className="glass-soft rounded-xl px-4 py-2"><div className="text-lg font-bold text-amber-300">{expiredCount}</div><div className="text-[11px] text-cyan-100/60">Barangiye</div></div>
        </div>
      </div>

      {/* Default trial setting */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-white">Iminsi y&apos;igeragezwa (Free trial)</h3>
          <p className="text-xs text-cyan-100/60">Iminsi buri konti nshya itangirana nayo ku buntu (ubu: {trial}).</p>
        </div>
        <form action={setDefaultTrialForm} className="flex items-center gap-2">
          <input name="days" type="number" min={0} defaultValue={trial} className="h-10 w-24 rounded-lg border border-cyan-400/20 bg-white/5 px-3 text-white outline-none focus:border-cyan-400/60" />
          <button type="submit" className="glow-btn h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-4 text-sm font-semibold text-white">Bika</button>
        </form>
      </div>

      {/* Users table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-cyan-100/60">
              <tr>
                <th className="px-4 py-3">Umukoresha</th>
                <th className="px-4 py-3">Imiterere</th>
                <th className="px-4 py-3">Iminsi isigaye</th>
                <th className="px-4 py-3">Irangira</th>
                <th className="px-4 py-3">Ibikorwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-400/10">
              {students.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-cyan-100/50">Nta bakoresha baraboneka.</td></tr>
              ) : (
                students.map((u) => {
                  const days = daysRemaining(u.accessExpiresAt);
                  return (
                    <tr key={u.id} className="align-top hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-cyan-100/55">{u.email}</div>
                      </td>
                      <td className="px-4 py-3"><StatusPill active={!!u.isActive} days={days} /></td>
                      <td className="px-4 py-3 font-semibold text-cyan-100">{days}</td>
                      <td className="px-4 py-3 text-cyan-100/70">{u.accessExpiresAt ? new Date(u.accessExpiresAt).toLocaleDateString("en-GB") : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <form action={addUserDays.bind(null, u.id, 2)}><button className="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-200 hover:bg-white/10">+2d</button></form>
                          <form action={addUserDays.bind(null, u.id, 7)}><button className="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-200 hover:bg-white/10">+1w</button></form>
                          <form action={addUserDays.bind(null, u.id, 30)}><button className="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-200 hover:bg-white/10">+1m</button></form>
                          <form action={addUserDays.bind(null, u.id, -7)}><button className="rounded-md bg-white/5 px-2 py-1 text-xs text-amber-200 hover:bg-white/10">-1w</button></form>
                          <form action={addUserDaysForm.bind(null, u.id)} className="flex items-center gap-1">
                            <input name="days" type="number" placeholder="±" className="h-7 w-14 rounded-md border border-cyan-400/20 bg-white/5 px-2 text-xs text-white outline-none focus:border-cyan-400/60" />
                            <button className="rounded-md bg-cyan-500/20 px-2 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30">Ongera</button>
                          </form>
                          <form action={setUserActive.bind(null, u.id, !u.isActive)}>
                            <button className={`rounded-md px-2 py-1 text-xs font-semibold ${u.isActive ? "bg-red-500/15 text-red-300 hover:bg-red-500/25" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"}`}>
                              {u.isActive ? "Hagarika" : "Fungura"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
