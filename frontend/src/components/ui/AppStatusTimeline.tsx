import { CheckCircle2, Circle } from "lucide-react";

export type TimelineItem = {
  label?: string;
  title?: string;
  description?: string;
  complete?: boolean;
  status?: "done" | "current" | "pending";
};

export function AppStatusTimeline({
  items,
  className = "",
}: {
  items: TimelineItem[];
  className?: string;
}) {
  return (
    <ol className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const label = item.label ?? item.title ?? "";
        const complete = item.complete || item.status === "done";
        return (
        <li key={label} className="flex gap-3">
          {complete ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" /> : <Circle className={`mt-0.5 h-5 w-5 ${item.status === "current" ? "text-emerald-500" : "text-slate-300"}`} />}
          <div>
            <div className="font-semibold text-slate-900">{label}</div>
            {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
          </div>
        </li>
        );
      })}
    </ol>
  );
}
