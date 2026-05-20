type Props = {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
};

export function AppTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${active === tab ? "bg-[var(--tenant-primary)] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
