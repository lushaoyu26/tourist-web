import { createContext, useContext, useEffect, useState } from 'react'

// 介面語言（中文／English）：切換導覽列、首頁等「介面外框」字串。
// 注意：城市攻略內文資料量大（850+ 城），維持原本中文／雙語欄位，不在此即時翻譯。
const LangContext = createContext(null)
const KEY = 'wanderglobe-lang'

const DICT = {
  zh: {
    search: '搜尋',
    allDest: '全部目的地',
    myTrip: '我的行程',
    searchPlaceholder: (n) => `搜尋城市或國家…（全站 ${n} 個城市）`,
    searchHint: '輸入城市或國家名稱（中英文皆可），例如「京都」「Kyoto」「冰島」。',
    searchEmpty: (q) => `找不到符合「${q}」的目的地`,
    heroTitle1: '轉動地球，',
    heroTitle2: '找到你的下一場旅行',
    heroSub: '滑鼠懸停國家立即浮起預覽 · 點擊深入區域攻略、機票住宿與預算估算',
    randomCity: '🎲 隨機探索一個城市',
    hint: '🖱️ 拖曳旋轉 · 滾輪縮放 · 懸停預覽 · 點擊探索',
    countriesCities: (c, n) => `${c} 國 · ${n} 城市`,
    toLight: '切換為亮色模式',
    toDark: '切換為深色模式',
  },
  en: {
    search: 'Search',
    allDest: 'All destinations',
    myTrip: 'My trip',
    searchPlaceholder: (n) => `Search a city or country… (${n} cities)`,
    searchHint: 'Type a city or country (Chinese or English), e.g. “京都”, “Kyoto”, “Iceland”.',
    searchEmpty: (q) => `No destinations match “${q}”`,
    heroTitle1: 'Spin the globe,',
    heroTitle2: 'find your next journey',
    heroSub: 'Hover a country to preview · click for guides, flights, stays & budget estimates',
    randomCity: '🎲 Surprise me with a city',
    hint: '🖱️ Drag to rotate · scroll to zoom · hover to preview · click to explore',
    countriesCities: (c, n) => `${c} countries · ${n} cities`,
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
  },
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(KEY) === 'en' ? 'en' : 'zh'
    } catch {
      return 'zh'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      // 隱私模式略過
    }
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant'
  }, [lang])

  const toggle = () => setLang((l) => (l === 'en' ? 'zh' : 'en'))
  const t = (key, ...args) => {
    const v = (DICT[lang] && DICT[lang][key]) ?? DICT.zh[key] ?? key
    return typeof v === 'function' ? v(...args) : v
  }

  return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang 必須在 LangProvider 內使用')
  return ctx
}
