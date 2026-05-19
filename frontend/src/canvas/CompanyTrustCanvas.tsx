import { useEffect, useRef } from 'react'

type Props = {
  pendingReturns: number
  canOpenJob: boolean
}

export function CompanyTrustCanvas({ pendingReturns, canOpenJob }: Props) {
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

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    gradient.addColorStop(0, '#ecfdf5')
    gradient.addColorStop(0.52, '#f8fafc')
    gradient.addColorStop(1, '#fff7ed')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, rect.width, rect.height)

    const nodes = [
      { label: 'Empresa', detail: 'cadastro LGPD', x: rect.width * 0.2, y: rect.height * 0.48, color: '#0f766e' },
      { label: 'SINE', detail: 'triagem humana', x: rect.width * 0.5, y: rect.height * 0.3, color: '#14532d' },
      { label: 'IA', detail: 'apoio interno', x: rect.width * 0.8, y: rect.height * 0.48, color: '#f59e0b' },
      { label: canOpenJob ? 'Nova vaga' : 'Retorno', detail: canOpenJob ? 'liberada' : `${pendingReturns} pendente(s)`, x: rect.width * 0.5, y: rect.height * 0.76, color: canOpenJob ? '#059669' : '#b45309' }
    ]

    ctx.lineWidth = 3
    ctx.strokeStyle = '#bbf7d0'
    ctx.beginPath()
    ctx.moveTo(nodes[0].x, nodes[0].y)
    ctx.quadraticCurveTo(rect.width * 0.36, rect.height * 0.12, nodes[1].x, nodes[1].y)
    ctx.quadraticCurveTo(rect.width * 0.64, rect.height * 0.12, nodes[2].x, nodes[2].y)
    ctx.moveTo(nodes[1].x, nodes[1].y)
    ctx.lineTo(nodes[3].x, nodes[3].y)
    ctx.stroke()

    nodes.forEach((node) => {
      ctx.fillStyle = node.color
      ctx.beginPath()
      ctx.arc(node.x, node.y, 42, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.font = '700 12px Inter, sans-serif'
      ctx.fillText(node.label, node.x, node.y - 4)
      ctx.font = '11px Inter, sans-serif'
      ctx.fillText(node.detail, node.x, node.y + 14)
    })
  }, [canOpenJob, pendingReturns])

  return <canvas ref={ref} className="h-72 w-full rounded-md border border-emerald-100 bg-white" />
}
