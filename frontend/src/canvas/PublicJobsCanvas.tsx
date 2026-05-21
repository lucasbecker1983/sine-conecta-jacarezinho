import { useEffect, useRef } from "react";

export function PublicJobsCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let animation = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ecfdf5";
      ctx.fillRect(0, 0, width, height);

      const center = { x: width * 0.5, y: height * 0.48 };
      const nodes = [
        { label: "SINE", x: center.x, y: center.y, r: 46, color: "#047857" },
        {
          label: "Candidatos",
          x: width * 0.22,
          y: height * 0.3,
          r: 30,
          color: "#0f766e",
        },
        {
          label: "Empresas",
          x: width * 0.78,
          y: height * 0.32,
          r: 30,
          color: "#0369a1",
        },
        {
          label: "Vagas",
          x: width * 0.25,
          y: height * 0.72,
          r: 26,
          color: "#ca8a04",
        },
        {
          label: "Cuidado",
          x: width * 0.76,
          y: height * 0.72,
          r: 26,
          color: "#7c3aed",
        },
      ];

      nodes.slice(1).forEach((node, index) => {
        const pulse = Math.sin(frame * 0.025 + index) * 0.18 + 0.72;
        ctx.strokeStyle = `rgba(4, 120, 87, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      });

      nodes.forEach((node, index) => {
        const lift = Math.sin(frame * 0.02 + index * 1.7) * 3;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y + lift, node.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `${node.r > 40 ? "700 14px" : "700 10px"} Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + lift + 4);
      });

      frame += 1;
      animation = window.requestAnimationFrame(draw);
    };

    draw();
    return () => window.cancelAnimationFrame(animation);
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
