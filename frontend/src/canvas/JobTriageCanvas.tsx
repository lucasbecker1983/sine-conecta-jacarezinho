import { useEffect, useRef } from "react";
import type { JobCandidate } from "../types";

type Props = {
  jobTitle: string;
  candidates: JobCandidate[];
  selectedWorkerId?: string;
  onSelect: (workerId: string) => void;
};

function colorFor(score = 0) {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  return "#64748b";
}

export function JobTriageCanvas({
  jobTitle,
  candidates,
  selectedWorkerId,
  onSelect,
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<
    Array<{ workerId: string; x: number; y: number; r: number }>
  >([]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(rect.width, rect.height);
    };

    const draw = (width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#d1fae5";
      ctx.lineWidth = 1;
      [70, 125, 180].forEach((radius) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = "#064e3b";
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VAGA", cx, cy - 4);
      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillText(jobTitle.slice(0, 26), cx, cy + 13);

      const points: Array<{
        workerId: string;
        x: number;
        y: number;
        r: number;
      }> = [];
      candidates.slice(0, 24).forEach((candidate, index) => {
        const score = candidate.match_score ?? 35;
        const distance = score >= 80 ? 92 : score >= 60 ? 140 : 188;
        const angle =
          (Math.PI * 2 * index) / Math.max(1, candidates.length) - Math.PI / 2;
        const x = cx + Math.cos(angle) * Math.min(distance, width * 0.42);
        const y = cy + Math.sin(angle) * Math.min(distance, height * 0.38);
        const selected = candidate.worker_id === selectedWorkerId;
        ctx.strokeStyle = colorFor(score);
        ctx.globalAlpha = selected ? 0.9 : 0.35;
        ctx.lineWidth = selected ? 3 : Math.max(1, score / 35);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = colorFor(score);
        ctx.beginPath();
        ctx.arc(x, y, selected ? 16 : 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 10px Inter, sans-serif";
        ctx.fillText(String(score), x, y + 3);
        ctx.fillStyle = "#334155";
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillText(
          candidate.worker_name.split(" ")[0] ?? "Candidato",
          x,
          y + 28,
        );
        points.push({ workerId: candidate.worker_id, x, y, r: 18 });
      });
      pointsRef.current = points;
      const legend = [
        ["alta compatibilidade", "#059669"],
        ["média compatibilidade", "#d97706"],
        ["baixa compatibilidade", "#64748b"],
      ];
      legend.forEach(([label, color], index) => {
        const x = 18;
        const y = height - 62 + index * 20;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#475569";
        ctx.font = "500 12px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(label, x + 12, y + 4);
      });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [candidates, jobTitle, selectedWorkerId]);

  return (
    <canvas
      ref={ref}
      className="h-[360px] w-full rounded-md border border-emerald-100"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const point = pointsRef.current.find(
          (item) => Math.hypot(item.x - x, item.y - y) <= item.r,
        );
        if (point) onSelect(point.workerId);
      }}
    />
  );
}
