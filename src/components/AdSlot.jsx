import { useEffect, useRef } from 'react'

// 廣告版位：Google AdSense 就緒。
// 設定環境變數 VITE_ADSENSE_CLIENT（你的 AdSense 發布商 ID，例如 ca-pub-xxxx）後，
// 自動載入 AdSense 並顯示真實廣告；未設定時顯示一個乾淨的「版位佔位」，方便排版預覽。
const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT

export default function AdSlot({ slot = '', label = '廣告', format = 'auto' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!CLIENT) return
    // 只插入一次 AdSense 載入器
    if (!document.querySelector('script[data-adsense]')) {
      const s = document.createElement('script')
      s.async = true
      s.dataset.adsense = '1'
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
      s.crossOrigin = 'anonymous'
      document.head.appendChild(s)
    }
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense 尚未就緒時忽略
    }
  }, [])

  if (!CLIENT) {
    // 未設定 AdSense：顯示佔位（清楚標示是廣告版位，不放假廣告）
    return (
      <aside className="ad-slot ad-slot-placeholder" aria-label="廣告版位">
        <span className="ad-slot-tag">{label} · Sponsored</span>
        <span className="ad-slot-hint">此處為廣告版位（設定 AdSense 後自動顯示）</span>
      </aside>
    )
  }

  return (
    <aside className="ad-slot" aria-label="廣告">
      <span className="ad-slot-tag">{label}</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  )
}
