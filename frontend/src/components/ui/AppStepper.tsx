import { CheckCircle2 } from "lucide-react";

export type StepperStep = {
  title: string;
  description?: string;
};

export function AppStepper({
  steps,
  current,
  currentStep,
  className = "",
}: {
  steps: Array<StepperStep | string>;
  current?: number;
  currentStep?: number;
  className?: string;
}) {
  const activeStep = current ?? currentStep ?? 0;
  return (
    <ol className={`grid gap-3 md:grid-cols-4 ${className}`}>
      {steps.map((rawStep, index) => {
        const step =
          typeof rawStep === "string" ? { title: rawStep } : rawStep;
        const done = index < activeStep;
        const active = index === activeStep;
        return (
          <li key={step.title} className={`rounded-xl border p-4 ${active ? "border-emerald-500 bg-emerald-50" : done ? "border-emerald-200 bg-white" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-700 text-white" : active ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"}`}>
                {done ? <CheckCircle2 size={16} /> : index + 1}
              </span>
              <span className="font-semibold text-slate-950">{step.title}</span>
            </div>
            {step.description ? <p className="mt-2 text-xs leading-5 text-slate-600">{step.description}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
