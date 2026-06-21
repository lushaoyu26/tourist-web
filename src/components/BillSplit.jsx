import { useMemo, useState } from 'react'
import { fmt } from '../services/hotels.js'

// 多人分帳：輸入每個人各自付了多少，計算均攤金額與「誰該補給誰」的最少筆數結算。
// 適合旅伴旅途中 AA：有人先付機票、有人付住宿，回來一鍵算清。
const seed = () => [
  { id: 1, name: '我', amount: '' },
  { id: 2, name: '旅伴 A', amount: '' },
]

export default function BillSplit({ suggested = 0 }) {
  const [people, setPeople] = useState(seed)
  const [nextId, setNextId] = useState(3)

  const setName = (id, name) => setPeople((p) => p.map((x) => (x.id === id ? { ...x, name } : x)))
  const setAmount = (id, amount) =>
    setPeople((p) => p.map((x) => (x.id === id ? { ...x, amount: amount.replace(/[^\d.]/g, '') } : x)))
  const addPerson = () => {
    setPeople((p) => [...p, { id: nextId, name: `旅伴 ${String.fromCharCode(64 + p.length)}`, amount: '' }])
    setNextId((n) => n + 1)
  }
  const removePerson = (id) => setPeople((p) => (p.length > 2 ? p.filter((x) => x.id !== id) : p))

  const { total, share, settlements } = useMemo(() => {
    const vals = people.map((p) => ({ name: p.name.trim() || '某人', amount: Number(p.amount) || 0 }))
    const total = vals.reduce((s, v) => s + v.amount, 0)
    const share = vals.length ? total / vals.length : 0
    // 計算結算：用貪婪法把欠款方補給收款方，產生最少筆數
    const bal = vals.map((v) => ({ name: v.name, bal: v.amount - share }))
    const creditors = bal.filter((b) => b.bal > 0.5).sort((a, b) => b.bal - a.bal)
    const debtors = bal.filter((b) => b.bal < -0.5).sort((a, b) => a.bal - b.bal)
    const settlements = []
    let i = 0
    let j = 0
    while (i < debtors.length && j < creditors.length) {
      const amt = Math.min(-debtors[i].bal, creditors[j].bal)
      settlements.push({ from: debtors[i].name, to: creditors[j].name, amt: Math.round(amt) })
      debtors[i].bal += amt
      creditors[j].bal -= amt
      if (Math.abs(debtors[i].bal) < 0.5) i++
      if (creditors[j].bal < 0.5) j++
    }
    return { total, share, settlements }
  }, [people])

  return (
    <section className="billsplit">
      <div className="billsplit-head">
        <h2>🧮 旅伴分帳</h2>
        <p>輸入每個人各付了多少，立刻算出每人均攤與誰該補給誰（最少轉帳筆數）。</p>
      </div>

      <div className="billsplit-rows">
        {people.map((p) => (
          <div key={p.id} className="billsplit-row">
            <input
              className="billsplit-name"
              value={p.name}
              onChange={(e) => setName(p.id, e.target.value)}
              placeholder="名字"
              aria-label="付款人名字"
            />
            <div className="billsplit-amount">
              <span>NT$</span>
              <input
                inputMode="decimal"
                value={p.amount}
                onChange={(e) => setAmount(p.id, e.target.value)}
                placeholder="0"
                aria-label="付款金額"
              />
            </div>
            <button
              className="billsplit-del"
              onClick={() => removePerson(p.id)}
              disabled={people.length <= 2}
              title="移除"
            >
              ✕
            </button>
          </div>
        ))}
        <button className="billsplit-add" onClick={addPerson}>＋ 加一個人</button>
      </div>

      <div className="billsplit-summary">
        <div className="billsplit-stat">
          <span>總支出</span>
          <strong>{fmt(Math.round(total))}</strong>
        </div>
        <div className="billsplit-stat">
          <span>{people.length} 人均攤</span>
          <strong>{fmt(Math.round(share))}</strong>
        </div>
      </div>

      <div className="billsplit-result">
        <h3>結算建議</h3>
        {total <= 0 ? (
          <p className="billsplit-empty">輸入金額後，這裡會列出每個人該補多少給誰。</p>
        ) : settlements.length === 0 ? (
          <p className="billsplit-even">🎉 大家付得剛好平均，不用互相補錢。</p>
        ) : (
          <ul className="billsplit-tx">
            {settlements.map((t, i) => (
              <li key={i}>
                <strong>{t.from}</strong> 補給 <strong>{t.to}</strong>
                <span className="billsplit-tx-amt">{fmt(t.amt)}</span>
              </li>
            ))}
          </ul>
        )}
        {suggested > 0 && (
          <p className="panel-note">💡 參考：你目前行程每人估算約 {fmt(suggested)}，{people.length} 人合計約 {fmt(suggested * people.length)}。</p>
        )}
      </div>
    </section>
  )
}
