import { LockKeyhole } from "lucide-react";

export function PermissionDenied() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <div className="flex items-center gap-2 font-bold">
        <LockKeyhole size={18} />
        Você não tem permissão para acessar esta área.
      </div>
    </div>
  );
}
