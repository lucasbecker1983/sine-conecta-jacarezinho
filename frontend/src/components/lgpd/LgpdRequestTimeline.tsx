import { LgpdStatusBadge } from "./LgpdStatusBadge";

type Event = {
  id: string;
  event_type: string;
  message?: string | null;
  new_status?: string | null;
  created_at: string;
};

export function LgpdRequestTimeline({ events }: { events: Event[] }) {
  if (!events.length) {
    return <p className="text-sm text-slate-500">Ainda não há eventos nesta solicitação.</p>;
  }
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{event.event_type.replace(/_/g, " ")}</span>
            {event.new_status ? <LgpdStatusBadge status={event.new_status} /> : null}
          </div>
          {event.message ? <p className="mt-1 text-sm text-slate-600">{event.message}</p> : null}
          <p className="mt-1 text-xs text-slate-500">{new Date(event.created_at).toLocaleString("pt-BR")}</p>
        </li>
      ))}
    </ol>
  );
}
