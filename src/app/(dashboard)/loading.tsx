// Instant transition feedback for the dashboard / courses / quiz routes.
export default function Loading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-cyan-200/75">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-cyan-400/25 border-t-cyan-300" />
        <span className="text-sm font-medium">Tegereza...</span>
      </div>
    </div>
  );
}
