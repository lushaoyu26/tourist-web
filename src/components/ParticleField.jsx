import { useEffect, useRef } from 'react'

// 沉浸式粒子星空：緩慢漂移的光點 + 鄰近連線 + 游標附近發亮（activetheory 氛圍）。
// 純 2D canvas、輕量；尊重 prefers-reduced-motion；精簡模式下不會被掛載。
export default function ParticleField() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const DPR = Math.min(2, window.devicePixelRatio || 1)
    let w = 0, h = 0, raf = 0
    let parts = []
    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      w = canvas.width = Math.floor(canvas.offsetWidth * DPR)
      h = canvas.height = Math.floor(canvas.offsetHeight * DPR)
      const N = Math.max(40, Math.min(130, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 13000)))
      parts = Array.from({ length: N }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.14 * DPR,
        vy: (Math.random() - 0.5) * 0.14 * DPR,
        r: (Math.random() * 1.5 + 0.4) * DPR,
        a: Math.random() * 0.45 + 0.18,
      }))
    }

    const onMove = (e) => {
      mouse.x = e.clientX * DPR
      mouse.y = e.clientY * DPR
    }
    const onLeave = () => {
      mouse.x = mouse.y = -9999
    }

    const LINK = 130 * DPR
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x += w
        else if (p.x > w) p.x -= w
        if (p.y < 0) p.y += h
        else if (p.y > h) p.y -= h

        // 游標附近的光點變亮
        const dxm = p.x - mouse.x
        const dym = p.y - mouse.y
        const near = dxm * dxm + dym * dym < (180 * DPR) * (180 * DPR)
        ctx.beginPath()
        ctx.arc(p.x, p.y, near ? p.r * 1.8 : p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(150, 200, 255, ${near ? Math.min(0.9, p.a + 0.4) : p.a})`
        ctx.fill()
      }
      // 鄰近連線（淡）
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK * LINK) {
            const o = (1 - Math.sqrt(d2) / LINK) * 0.18
            ctx.strokeStyle = `rgba(120, 180, 255, ${o})`
            ctx.lineWidth = DPR * 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    if (reduce) draw() // 畫一幀靜態
    else raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className="particle-field" aria-hidden="true" />
}
