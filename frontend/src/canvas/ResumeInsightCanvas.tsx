import { useEffect, useRef } from 'react'

export function ResumeInsightCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)
    const blocks = [
      ['Habilidades', '#0f766e', ['Atendimento', 'Excel', 'Organização']],
      ['Experiencias', '#14532d', ['Recepção', 'Caixa']],
      ['Cursos', '#f59e0b', ['Informática', 'Vendas']],
      ['Atenção', '#64748b', ['Datas ausentes', 'Poucos resultados']]
    ] as const
    blocks.forEach((block, index) => {
      const x = 18 + (index % 2) * (rect.width / 2)
      const y = 22 + Math.floor(index / 2) * 120
      ctx.fillStyle = block[1]
      ctx.fillRect(x, y, rect.width / 2 - 36, 86)
      ctx.fillStyle = 'white'
      ctx.font = '700 13px Inter, sans-serif'
      ctx.fillText(block[0], x + 14, y + 24)
      ctx.font = '12px Inter, sans-serif'
      block[2].forEach((item, i) => ctx.fillText(item, x + 14, y + 46 + i * 16))
    })
  }, [])
  return <canvas ref={ref} className="h-64 w-full rounded-md border border-slate-200 bg-white" />
}
