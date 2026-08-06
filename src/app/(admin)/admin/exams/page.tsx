import { db } from "@/db";
import { generatedExams } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { generateExamAction, deleteExamAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage() {
  const exams = await db.select().from(generatedExams).orderBy(desc(generatedExams.createdAt)).limit(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Gutunganya Ibizamini</h1>
        <p className="mt-1 max-w-2xl text-sm text-cyan-100/65">
          Injiza link ya video ya YouTube (nka Teacher Nkotanyi) n&apos;insanganyamatsiko ivugwamo. Sisitemu izasoma
          umutwe wa video, ihitemo ibibazo bisa na byo <strong>biva mu bubiko bwacu</strong>, ikore ikizamini
          abanyeshuri bakora. (Ntidukoresha ibibazo bye — dukoresha ibyacu bisa.)
        </p>
      </div>

      {/* Generate form */}
      <form action={generateExamAction} className="glass space-y-4 rounded-2xl p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cyan-100/70">Izina ry&apos;ikizamini (bitegetswe)</label>
            <input name="title" placeholder="Ikizamini ry'uyu munsi" className="h-10 w-full rounded-lg border border-cyan-400/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cyan-100/70">Umubare w&apos;ibibazo</label>
            <input name="count" type="number" min={5} max={40} defaultValue={20} className="h-10 w-full rounded-lg border border-cyan-400/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/60" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cyan-100/70">Link ya YouTube (bitegetswe)</label>
          <input name="url" type="url" placeholder="https://www.youtube.com/watch?v=..." className="h-10 w-full rounded-lg border border-cyan-400/20 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/60" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cyan-100/70">Insanganyamatsiko / ibibazo bivugwa muri video (bifasha guhitamo neza)</label>
          <textarea name="text" rows={4} placeholder="Andika insanganyamatsiko cyangwa amagambo y'ingenzi (urugero: ibyapa, umuvuduko ntarengwa, amatara, kunyuranaho, gutambuka mbere...)" className="w-full rounded-lg border border-cyan-400/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60" />
        </div>
        <button type="submit" className="glow-btn h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 text-sm font-semibold text-white">
          ⚙ Kora Ikizamini
        </button>
      </form>

      {/* Generated exams list */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Ibizamini byakozwe ({exams.length})</h2>
        {exams.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-cyan-100/55">Nta kizamini kirakorwa.</div>
        ) : (
          exams.map((e, i) => {
            const n = Array.isArray(e.questionIds) ? (e.questionIds as string[]).length : 0;
            return (
              <div key={e.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{e.title}</span>
                    {i === 0 && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Iy&apos;uyu munsi</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-cyan-100/55">
                    Ibibazo {n} • {e.createdAt ? new Date(e.createdAt).toLocaleString("en-GB") : ""}
                    {e.sourceUrl && (
                      <>
                        {" • "}
                        <a href={e.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-300 underline">video</a>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/exam/${e.id}`} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-white/10">Reba/Kora</Link>
                  <form action={deleteExamAction.bind(null, e.id)}>
                    <button className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/25">Siba</button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
