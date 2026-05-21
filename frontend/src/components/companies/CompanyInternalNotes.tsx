import { FormEvent, useState } from "react";
import { AppButton, AppCard, AppTextarea } from "../ui";

export function CompanyInternalNotes({
  notes,
  onSubmit,
}: {
  notes?: string | null;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    await onSubmit(note.trim());
    setNote("");
  }
  return (
    <div className="space-y-4">
      <AppCard>
        <form onSubmit={submit}>
          <AppTextarea label="Observação interna do SINE" value={note} onChange={(event) => setNote(event.target.value)} />
          <AppButton type="submit" className="mt-3">Adicionar observação</AppButton>
        </form>
      </AppCard>
      <AppCard>
        <h2 className="font-bold text-slate-950">Histórico de observações internas</h2>
        <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{notes || "Nenhuma observação interna registrada."}</pre>
      </AppCard>
    </div>
  );
}
