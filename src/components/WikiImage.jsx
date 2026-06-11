import { useEffect, useState } from 'react'

// 透過 Wikipedia REST API 取得條目主圖（免金鑰、支援 CORS）。
// wiki 可為字串或候選標題陣列：含中日韓字元者查中文維基，其餘查英文維基。
// 查無圖片時顯示漸層 + emoji 的優雅替代圖。

const memCache = new Map()

function apiHost(title) {
  return /[一-鿿぀-ヿ가-힯]/.test(title)
    ? 'https://zh.wikipedia.org'
    : 'https://en.wikipedia.org'
}

// Wikimedia 縮圖服務只接受特定寬度，挑不超過原圖的最大合法尺寸
const SIZE_BUCKETS = [960, 500, 330]

// 回傳候選圖片網址陣列（高解析優先，載入失敗時逐一降級）
async function fetchWikiThumb(titles) {
  const list = Array.isArray(titles) ? titles : [titles]
  const key = list.join('|')
  if (memCache.has(key)) return memCache.get(key)
  const cached = sessionStorage.getItem(`wimg:${key}`)
  if (cached !== null) {
    const v = cached ? JSON.parse(cached) : []
    memCache.set(key, v)
    return v
  }
  let urls = []
  for (const title of list) {
    try {
      const res = await fetch(
        `${apiHost(title)}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
      )
      if (!res.ok) continue
      const data = await res.json()
      const thumb = data.thumbnail?.source
      if (thumb) {
        const target = SIZE_BUCKETS.find((b) => b <= (data.originalimage?.width || 0))
        if (target) urls.push(thumb.replace(/\/\d+px-/, `/${target}px-`))
        urls.push(thumb)
        break
      }
    } catch {
      // 網路錯誤時直接用替代圖
    }
  }
  memCache.set(key, urls)
  // 只持久化成功結果，避免暫時性 API 錯誤被快取成「永久無圖」
  if (urls.length) {
    try {
      sessionStorage.setItem(`wimg:${key}`, JSON.stringify(urls))
    } catch {
      // sessionStorage 滿了就只用記憶體快取
    }
  }
  return urls
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #2af598, #009efd)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #30cfd0, #330867)',
]

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export default function WikiImage({ wiki, alt, emoji = '🌍', className = '', style }) {
  const [candidates, setCandidates] = useState(undefined)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    let alive = true
    setCandidates(undefined)
    setIdx(0)
    if (!wiki) {
      setCandidates([])
      return
    }
    fetchWikiThumb(wiki).then((urls) => alive && setCandidates(urls))
    return () => {
      alive = false
    }
  }, [Array.isArray(wiki) ? wiki.join('|') : wiki])

  const src = candidates?.[idx]
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`wiki-img ${className}`}
        style={style}
        onError={() => setIdx(idx + 1)}
      />
    )
  }

  const gradient = GRADIENTS[hashStr(alt || 'x') % GRADIENTS.length]
  return (
    <div
      className={`wiki-img wiki-img-fallback ${className}`}
      style={{ ...style, background: gradient }}
      role="img"
      aria-label={alt}
    >
      <span className={candidates === undefined ? 'pulse' : ''}>{emoji}</span>
    </div>
  )
}
