import { db } from "@/db";
import { appSettings, generatedExams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getQuestionsIndex } from "@/lib/catalog";
import { pickQuestionsForSeed, fetchYouTubeHint, resolveChannelId, fetchLatestChannelVideo } from "@/lib/exam-generator";

async function getSetting(key: string): Promise<string | null> {
  const r = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return r[0]?.value ?? null;
}
async function setSetting(key: string, value: string) {
  await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({ target: appSettings.key, set: { value } });
}

export type DailyResult =
  | { status: "created"; examId: string; title: string; videoId: string; questions: number }
  | { status: "skipped"; reason: string; videoId?: string }
  | { status: "error"; reason: string };

/**
 * Read the configured YouTube source, find its latest video, and (if it's new)
 * generate a daily exam from OUR bank using the video title as the topic seed.
 * Configured via app_settings: youtube_source (channel URL/@handle/id or a
 * video URL). Deduped via last_exam_video_id. Used by the cron + "Run now".
 */
export async function runDailyExamFromSettings(force = false): Promise<DailyResult> {
  const result = await computeDaily(force);
  const summary =
    result.status === "created"
      ? `Byakozwe: ${result.title}`
      : result.status === "skipped"
        ? `Byasimbutse: ${result.reason}`
        : `Ikibazo: ${result.reason}`;
  await setSetting("last_exam_run_at", new Date().toISOString());
  await setSetting("last_exam_run_status", summary);
  return result;
}

async function computeDaily(force: boolean): Promise<DailyResult> {
  const source = (await getSetting("youtube_source"))?.trim();
  if (!source) return { status: "skipped", reason: "Nta youtube_source yashyizweho" };

  let video: { videoId: string; title: string; url: string } | null = null;
  if (/watch\?v=|youtu\.be\//.test(source)) {
    const title = (await fetchYouTubeHint(source)) ?? "";
    const m = source.match(/[?&]v=([\w-]+)/) || source.match(/youtu\.be\/([\w-]+)/);
    video = { videoId: (m && m[1]) || source, title, url: source };
  } else {
    const channelId = await resolveChannelId(source);
    if (!channelId) return { status: "error", reason: "Ntibyashobotse kubona channel (reba URL)" };
    video = await fetchLatestChannelVideo(channelId);
    if (!video) return { status: "error", reason: "Nta video iheruka iboneka" };
  }

  if (!force) {
    const last = await getSetting("last_exam_video_id");
    if (last && last === video.videoId) {
      return { status: "skipped", reason: "Ikizamini cya video iheruka cyarakozwe", videoId: video.videoId };
    }
  }

  const index = await getQuestionsIndex();
  const ids = pickQuestionsForSeed(index, video.title, 20);
  const title = video.title ? `Ikizamini: ${video.title.slice(0, 90)}` : `Ikizamini ${new Date().toLocaleDateString("en-GB")}`;

  const [row] = await db.insert(generatedExams).values({ title, sourceUrl: video.url, questionIds: ids }).returning({ id: generatedExams.id });
  await setSetting("last_exam_video_id", video.videoId);

  return { status: "created", examId: row.id, title, videoId: video.videoId, questions: ids.length };
}
