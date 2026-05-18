import { useEffect, useRef } from 'react'

const nodes = [
  { label: 'SINE', x: 0.5, y: 0.44, r: 38, color: '#14532d' },
  { label: 'Empresas', x: 0.22, y: 0.28, r: 25, color: '#0f766e' },
  { label: 'Vagas', x: 0.78, y: 0.3, r: 24, color: '#f59e0b' },
  { label: 'Candidatos', x: 0.28, y: 0.68, r: 29, color: '#166534' },
  { label: 'Curriculos', x: 0.74, y: 0.66, r: 27, color: '#0d9488' }
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

    function draw() {
      const rect = drawingCanvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      frame += 0.012
      context.clearRect(0, 0, w, h)
      const gradient = context.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, 'rgba(20, 83, 45, 0.92)')
      gradient.addColorStop(0.62, 'rgba(15, 118, 110, 0.88)')
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.82)')
      context.fillStyle = gradient
      context.fillRect(0, 0, w, h)

      context.globalAlpha = 0.16
      for (let i = 0; i < 44; i += 1) {
        const x = ((i * 83 + frame * 42) % (w + 80)) - 40
        const y = ((i * 47 + Math.sin(frame + i) * 18) % (h + 80)) - 40
        context.beginPath()
        context.arc(x, y, 1.8 + (i % 4), 0, Math.PI * 2)
        context.fillStyle = '#ffffff'
        context.fill()
      }
      context.globalAlpha = 1

      const center = nodes[0]
      nodes.slice(1).forEach((node, index) => {
        const sx = center.x * w
        const sy = center.y * h
        const tx = node.x * w + Math.sin(frame + index) * 5
        const ty = node.y * h + Math.cos(frame + index) * 5
        context.beginPath()
        context.moveTo(sx, sy)
        context.lineTo(tx, ty)
        context.strokeStyle = 'rgba(255,255,255,0.42)'
        context.lineWidth = 2
        context.stroke()
        const pulse = (Math.sin(frame * 3 + index) + 1) / 2
        context.beginPath()
        context.arc(sx + (tx - sx) * pulse, sy + (ty - sy) * pulse, 4, 0, Math.PI * 2)
        context.fillStyle = 'rgba(255,255,255,0.84)'
        context.fill()
      })

      nodes.forEach((node, index) => {
        const x = node.x * w + Math.sin(frame + index) * 5
        const y = node.y * h + Math.cos(frame + index) * 5
        context.beginPath()
        context.arc(x, y, node.r + 8, 0, Math.PI * 2)
        context.fillStyle = 'rgba(255,255,255,0.14)'
        context.fill()
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

      animationId = requestAnimationFrame(draw)
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
