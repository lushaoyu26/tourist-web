import { useCallback, useEffect, useState } from 'react'

// 已儲存的行程方案：把目前行程命名存起來，可同時保留多組（省錢版／豪華版／給朋友…）
// 並在 /trip 並排比較成本。資料以 localStorage 持久化。

const KEY = 'wanderglobe-plans-v1'

export function useSavedPlans() {
  const [plans, setPlans] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(plans))
    } catch {
      // 隱私模式：僅維持本次工作階段
    }
  }, [plans])

  const save = useCallback((name, items) => {
    const id = `${Date.now()}-${Math.round(Math.random() * 1e4)}`
    setPlans((prev) => [
      ...prev,
      { id, name: (name || `方案 ${prev.length + 1}`).trim(), items: items.map((i) => ({ ...i })) },
    ])
  }, [])

  const remove = useCallback((id) => setPlans((prev) => prev.filter((p) => p.id !== id)), [])

  return { plans, save, remove }
}
