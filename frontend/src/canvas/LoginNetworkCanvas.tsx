import { useEffect, useRef } from 'react'

const nodes = [
  { label: 'SINE', x: 0.5, y: 0.48, r: 42, color: '#064e3b' },
  { label: 'Empresas', x: 0.2, y: 0.28, r: 25, color: '#0f766e' },
  { label: 'Vagas', x: 0.78, y: 0.3, r: 24, color: '#d97706' },
  { label: 'Candidatos', x: 0.26, y: 0.72, r: 30, color: '#166534' },
  { label: 'Curriculos', x: 0.76, y: 0.7, r: 27, color: '#0369a1' }
]

export function LoginNetworkCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const drawingCanvas = canvas
    const context = ctx
    let frame = 0
    let animationId = 0

    function resize() {
      const rect = drawingCanvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      drawingCanvas.width = Math.max(1, Math.floor(rect.width * dpr))
      drawingCanvas.height = Math.max(1, Math.floor(rect.height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function draw() {
      const rect = drawingCanvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      frame += reduceMotion ? 0 : 0.012
      context.clearRect(0, 0, w, h)
      const gradient = context.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, '#022c22')
      gradient.addColorStop(0.5, '#065f46')
      gradient.addColorStop(1, '#0f766e')
      context.fillStyle = gradient
      context.fillRect(0, 0, w, h)

      const warm = context.createRadialGradient(w * 0.82, h * 0.12, 0, w * 0.82, h * 0.12, Math.max(w, h) * 0.75)
      warm.addColorStop(0, 'rgba(245, 158, 11, 0.34)')
      warm.addColorStop(0.42, 'rgba(20, 184, 166, 0.1)')
      warm.addColorStop(1, 'rgba(2, 44, 34, 0)')
      context.fillStyle = warm
      context.fillRect(0, 0, w, h)

      context.globalAlpha = 0.11
      for (let i = 0; i < 54; i += 1) {
        const x = ((i * 71 + frame * 34) % (w + 80)) - 40
        const y = ((i * 43 + Math.sin(frame + i) * 22) % (h + 80)) - 40
        context.beginPath()
        context.arc(x, y, 1.3 + (i % 3), 0, Math.PI * 2)
        context.fillStyle = '#ffffff'
        context.fill()
      }
      context.globalAlpha = 1

      for (let line = 0; line < 4; line += 1) {
        context.beginPath()
        const y = h * (0.18 + line * 0.18)
        context.moveTo(-40, y)
        for (let x = -40; x <= w + 40; x += 28) {
          context.lineTo(x, y + Math.sin(frame * 1.6 + x * 0.012 + line) * 18)
        }
        context.strokeStyle = `rgba(255,255,255,${0.08 + line * 0.025})`
        context.lineWidth = 1.4
        context.stroke()
      }

      const center = nodes[0]
      nodes.slice(1).forEach((node, index) => {
        const sx = center.x * w
        const sy = center.y * h
        const tx = node.x * w + Math.sin(frame + index) * 5
        const ty = node.y * h + Math.cos(frame + index) * 5
        context.beginPath()
        context.moveTo(sx, sy)
        const cx = (sx + tx) / 2 + Math.sin(frame + index) * 24
        const cy = (sy + ty) / 2 - Math.cos(frame + index) * 18
        if (typeof context.quadraticCurveTo === 'function') {
          context.quadraticCurveTo(cx, cy, tx, ty)
        } else {
          context.lineTo(tx, ty)
        }
        context.strokeStyle = 'rgba(255,255,255,0.38)'
        context.lineWidth = 1.8
        context.stroke()
        const pulse = (Math.sin(frame * 3 + index) + 1) / 2
        context.beginPath()
        context.arc(sx + (tx - sx) * pulse, sy + (ty - sy) * pulse, 3.6, 0, Math.PI * 2)
        context.fillStyle = index === 1 ? 'rgba(245,158,11,0.92)' : 'rgba(255,255,255,0.82)'
        context.fill()
      })

      nodes.forEach((node, index) => {
        const x = node.x * w + Math.sin(frame + index) * 5
        const y = node.y * h + Math.cos(frame + index) * 5
        context.beginPath()
        context.arc(x, y, node.r + 13, 0, Math.PI * 2)
        context.fillStyle = 'rgba(255,255,255,0.1)'
        context.fill()
        context.beginPath()
        context.arc(x, y, node.r + 6, 0, Math.PI * 2)
        context.strokeStyle = 'rgba(255,255,255,0.22)'
        context.lineWidth = 1
        context.stroke()
        context.beginPath()
        context.arc(x, y, node.r, 0, Math.PI * 2)
        context.fillStyle = node.color
        context.fill()
        context.fillStyle = '#ffffff'
        context.font = index === 0 ? '700 15px Inter, sans-serif' : '700 12px Inter, sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(node.label, x, y)
      })

      if (!reduceMotion) animationId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
