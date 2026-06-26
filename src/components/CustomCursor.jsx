import { useEffect, useRef } from 'react'

// 自訂游標：一個即時跟隨的小點 + 一個緩動延遲的外環；滑到可互動元素時外環放大發光。
// 觸控裝置不啟用。
export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return // 觸控不啟用

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let raf = 0

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`
    }
    const loop = () => {
      rx += (mx - rx) * 0.16
      ry += (my - ry) * 0.16
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }
    const isInteractive = (el) => el && el.closest && el.closest('a, button, .magnetic, input, [role="button"]')
    const onOver = (e) => {
      if (isInteractive(e.target)) document.body.classList.add('cursor-hover')
    }
    const onOut = (e) => {
      if (isInteractive(e.target)) document.body.classList.remove('cursor-hover')
    }
    const onDown = () => document.body.classList.add('cursor-down')
    const onUp = () => document.body.classList.remove('cursor-down')

    document.body.classList.add('has-custom-cursor')
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.body.classList.remove('has-custom-cursor', 'cursor-hover', 'cursor-down')
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
