export function AppLoadingState({ message = "Carregando informações..." }: { message?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" role="status">
      <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-3 w-64 max-w-full animate-pulse rounded bg-slate-100" />
      <p className="mt-4 text-sm text-slate-500">{message}</p>
    </div>
  );
}
