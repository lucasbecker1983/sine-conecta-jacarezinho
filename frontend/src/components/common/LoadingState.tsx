export function LoadingState({ message = "Carregando informações..." }: { message?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
      {message}
    </div>
  );
}
