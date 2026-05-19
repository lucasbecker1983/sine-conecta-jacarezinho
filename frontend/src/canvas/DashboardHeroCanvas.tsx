import { useEffect, useRef } from 'react'

type Variant = 'sine' | 'company' | 'worker'

type Props = {
  variant: Variant
  primary?: number
  secondary?: number
  locked?: boolean
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

export function DashboardHeroCanvas({ variant, primary = 0, secondary = 0, locked = false }: Props) {
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const config = variantConfig[variant]
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    gradient.addColorStop(0, '#f0fdf4')
    gradient.addColorStop(0.46, '#f8fafc')
    gradient.addColorStop(1, locked ? '#fff7ed' : '#ecfeff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, rect.width, rect.height)

    const center = { x: rect.width * 0.52, y: rect.height * 0.45 }
    const nodes = [
      { x: rect.width * 0.2, y: rect.height * 0.42, label: config.left, value: primary, color: config.accent },
      { x: rect.width * 0.82, y: rect.height * 0.42, label: config.right, value: secondary, color: '#059669' },
      { x: rect.width * 0.52, y: rect.height * 0.78, label: config.bottom, value: locked ? 'Pendente' : 'OK', color: locked ? '#b45309' : '#10b981' },
    ]

    ctx.lineWidth = 3
    nodes.forEach((node) => {
      ctx.beginPath()
      ctx.moveTo(center.x, center.y)
      ctx.lineTo(node.x, node.y)
      ctx.strokeStyle = locked ? '#fed7aa' : '#bbf7d0'
      ctx.stroke()
    })

    ctx.beginPath()
    ctx.arc(center.x, center.y, 56, 0, Math.PI * 2)
    ctx.fillStyle = config.color
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.font = '700 15px Inter, sans-serif'
    ctx.fillText(config.title, center.x, center.y - 4)
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText(locked ? 'bloqueio ativo' : 'fluxo ativo', center.x, center.y + 16)

    nodes.forEach((node) => {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 43, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 12px Inter, sans-serif'
      ctx.fillText(String(node.value), node.x, node.y - 4)
      ctx.font = '11px Inter, sans-serif'
      ctx.fillText(node.label, node.x, node.y + 14)
    })
  }, [locked, primary, secondary, variant])

  return <canvas ref={ref} className="h-64 w-full rounded-md border border-emerald-100 bg-white" />
}
