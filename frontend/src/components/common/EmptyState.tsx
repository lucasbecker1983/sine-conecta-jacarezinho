export function EmptyState({ message = "Ainda não há dados para exibir." }: { message?: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
