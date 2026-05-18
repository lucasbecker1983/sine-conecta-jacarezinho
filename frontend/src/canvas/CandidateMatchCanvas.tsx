import { useEffect, useRef } from 'react'

type Candidate = { id: string; name: string; score: number }

export function CandidateMatchCanvas({ onSelect }: { onSelect?: (candidate: Candidate) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const candidates: Candidate[] = [
    { id: '1', name: 'Ana Paula', score: 92 },
    { id: '2', name: 'Carlos Lima', score: 81 },
    { id: '3', name: 'Marina Souza', score: 74 },
    { id: '4', name: 'João Pedro', score: 66 }
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const cx = rect.width / 2
    const cy = rect.height / 2
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = '#d1fae5'
    ctx.lineWidth = 2
    ctx.fillStyle = '#14532d'
    ctx.beginPath()
    ctx.arc(cx, cy, 54, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = '700 14px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Vaga', cx, cy - 4)
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('Atendente', cx, cy + 14)
    candidates.forEach((candidate, index) => {
      const angle = (index / candidates.length) * Math.PI * 2 - Math.PI / 2
      const radius = Math.min(rect.width, rect.height) * 0.34
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(x, y)
      ctx.strokeStyle = candidate.score >= 85 ? '#10b981' : '#94a3b8'
      ctx.stroke()
      ctx.fillStyle = candidate.score >= 85 ? '#f59e0b' : '#0f766e'
      ctx.beginPath()
      ctx.arc(x, y, 38, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = '700 12px Inter, sans-serif'
      ctx.fillText(`${candidate.score}%`, x, y - 3)
      ctx.font = '11px Inter, sans-serif'
      ctx.fillText(candidate.name.split(' ')[0], x, y + 14)
    })
  }, [])

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const radius = Math.min(rect.width, rect.height) * 0.34
    const selected = candidates.find((candidate, index) => {
      const angle = (index / candidates.length) * Math.PI * 2 - Math.PI / 2
      const px = cx + Math.cos(angle) * radius
      const py = cy + Math.sin(angle) * radius
      return Math.hypot(px - x, py - y) <= 42
    })
    if (selected) onSelect?.(selected)
  }

  return <canvas ref={canvasRef} onClick={handleClick} className="h-80 w-full cursor-pointer rounded-md border border-slate-200 bg-white" />
}
