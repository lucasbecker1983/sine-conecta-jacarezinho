export function ErrorState({ message = "Não foi possível carregar os dados agora." }: { message?: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {message}
    </div>
  );
}
