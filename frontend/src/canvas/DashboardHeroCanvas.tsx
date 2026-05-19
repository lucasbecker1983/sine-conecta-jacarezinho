import { useEffect, useRef } from 'react'

type Variant = 'sine' | 'company' | 'worker'

type Props = {
  variant: Variant
  primary?: number
  secondary?: number
  locked?: boolean
  className?: string
}

const variantConfig = {
  sine: {
    title: 'SINE',
    left: 'Currículos',
    right: 'Empresas',
    bottom: 'Encaminhamentos',
    color: '#14532d',
    accent: '#0f766e'
  },
  company: {
    title: 'Empresa',
    left: 'Vagas',
    right: 'SINE',
    bottom: 'Feedback',
    color: '#0f766e',
    accent: '#f59e0b'
  },
  worker: {
    title: 'Candidato',
    left: 'Perfil',
    right: 'Vagas',
    bottom: 'Currículo',
    color: '#14532d',
    accent: '#2563eb'
  }
}

export function DashboardHeroCanvas({ variant, primary = 0, secondary = 0, locked = false, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const canvasEl = canvas
    const context = ctx

    let frame = 0

    function draw(time: number) {
      const dpr = window.devicePixelRatio || 1
      const rect = canvasEl.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        frame = window.requestAnimationFrame(draw)
        return
      }
      canvasEl.width = rect.width * dpr
      canvasEl.height = rect.height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)

      const config = variantConfig[variant]
      const gradient = context.createLinearGradient(0, 0, rect.width, rect.height)
      gradient.addColorStop(0, '#f0fdf4')
      gradient.addColorStop(0.46, '#f8fafc')
      gradient.addColorStop(1, locked ? '#fff7ed' : '#ecfeff')
      context.fillStyle = gradient
      context.fillRect(0, 0, rect.width, rect.height)

      const pulse = Math.sin(time / 900) * 4
      const center = { x: rect.width * 0.52, y: rect.height * 0.45 }
      const nodes = [
        { x: rect.width * 0.2, y: rect.height * 0.42, label: config.left, value: primary, color: config.accent },
        { x: rect.width * 0.82, y: rect.height * 0.42, label: config.right, value: secondary, color: '#059669' },
        { x: rect.width * 0.52, y: rect.height * 0.78, label: config.bottom, value: locked ? 'Pendente' : 'OK', color: locked ? '#b45309' : '#10b981' },
      ]

      context.lineWidth = 2
      for (let index = 0; index < 6; index += 1) {
        const y = rect.height * (0.18 + index * 0.12) + Math.sin(time / 1200 + index) * 4
        context.beginPath()
        context.moveTo(rect.width * 0.05, y)
        context.bezierCurveTo(rect.width * 0.3, y - 18, rect.width * 0.68, y + 18, rect.width * 0.95, y - 6)
        context.strokeStyle = locked ? 'rgba(251, 146, 60, 0.16)' : 'rgba(16, 185, 129, 0.16)'
        context.stroke()
      }

      nodes.forEach((node) => {
        context.beginPath()
        context.moveTo(center.x, center.y)
        context.lineTo(node.x, node.y)
        context.strokeStyle = locked ? '#fed7aa' : '#bbf7d0'
        context.stroke()
      })

      context.beginPath()
      context.arc(center.x, center.y, 58 + pulse, 0, Math.PI * 2)
      context.fillStyle = locked ? 'rgba(251, 146, 60, 0.12)' : 'rgba(20, 83, 45, 0.12)'
      context.fill()

      context.beginPath()
      context.arc(center.x, center.y, 56, 0, Math.PI * 2)
      context.fillStyle = config.color
      context.fill()
      context.fillStyle = '#ffffff'
      context.textAlign = 'center'
      context.font = '700 15px Inter, sans-serif'
      context.fillText(config.title, center.x, center.y - 4)
      context.font = '12px Inter, sans-serif'
      context.fillText(locked ? 'bloqueio ativo' : 'fluxo ativo', center.x, center.y + 16)

      nodes.forEach((node) => {
        context.beginPath()
        context.arc(node.x, node.y, 43, 0, Math.PI * 2)
        context.fillStyle = node.color
        context.fill()
        context.fillStyle = '#ffffff'
        context.font = '700 12px Inter, sans-serif'
        context.fillText(String(node.value), node.x, node.y - 4)
        context.font = '11px Inter, sans-serif'
        context.fillText(node.label, node.x, node.y + 14)
      })

      frame = window.requestAnimationFrame(draw)
    }

    frame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(frame)
  }, [locked, primary, secondary, variant])

  return <canvas ref={ref} className={className ?? 'h-64 w-full rounded-md border border-emerald-100 bg-white'} />
}
