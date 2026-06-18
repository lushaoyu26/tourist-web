import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// 行程組合狀態：使用者可把任意國家的任意區域加入「我的行程」，
// 自由排序、設定停留天數，資料以 localStorage 持久化（重新整理不流失）。

const TripContext = createContext(null)
const STORAGE_KEY = 'wanderglobe-trip-v1'

const sameStop = (a, countryId, regionId) => a.countryId === countryId && a.regionId === regionId

export function TripProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // 隱私模式或容量不足時，僅維持記憶體狀態
    }
  }, [items])

  const add = useCallback((countryId, regionId, days = null) => {
    setItems((prev) =>
      prev.some((i) => sameStop(i, countryId, regionId))
        ? prev
        : [...prev, { countryId, regionId, days }]
    )
  }, [])

  const remove = useCallback((countryId, regionId) => {
    setItems((prev) => prev.filter((i) => !sameStop(i, countryId, regionId)))
  }, [])

  const toggle = useCallback((countryId, regionId, days = null) => {
    setItems((prev) =>
      prev.some((i) => sameStop(i, countryId, regionId))
        ? prev.filter((i) => !sameStop(i, countryId, regionId))
        : [...prev, { countryId, regionId, days }]
    )
  }, [])

  const has = useCallback(
    (countryId, regionId) => items.some((i) => sameStop(i, countryId, regionId)),
    [items]
  )

  const move = useCallback((index, dir) => {
    setItems((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }, [])

  const setDays = useCallback((index, days) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, days } : it)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return (
    <TripContext.Provider value={{ items, add, remove, toggle, has, move, setDays, clear }}>
      {children}
    </TripContext.Provider>
  )
}

export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip 必須在 TripProvider 內使用')
  return ctx
}
