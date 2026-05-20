import { LockKeyhole } from "lucide-react";

export function AppPermissionDenied() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950" role="alert">
      <div className="flex items-center gap-2 font-bold">
        <LockKeyhole size={18} />
        Você não tem permissão para acessar esta área.
      </div>
      <p className="mt-2 leading-6">Caso precise deste acesso, fale com o responsável pelo SINE ou administrador do tenant.</p>
    </div>
  );
}
