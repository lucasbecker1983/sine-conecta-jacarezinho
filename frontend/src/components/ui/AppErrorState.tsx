import { AlertCircle } from "lucide-react";

export function AppErrorState({ message = "Não foi possível carregar os dados agora." }: { message?: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-950" role="alert">
      <div className="flex items-center gap-2 font-bold">
        <AlertCircle size={18} />
        Algo não saiu como esperado
      </div>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </div>
  );
}
