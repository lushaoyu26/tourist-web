import { monthRatings } from '../services/bestMonths.js'

const LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

// 城市全年旅遊指數：把 bestSeason 轉成一條 12 個月的色帶，
// 一眼看出何時去最好（綠）、過渡季（黃）、淡季（灰），並標出本月。
export default function BestMonths({ region }) {
  const ratings = monthRatings(region.bestSeason)
  const nowIdx = new Date().getMonth() // 0..11
  const allOk = ratings.every((r) => r === 'ok')

  return (
    <section className="best-months">
      <div className="best-months-head">
        <h3>🗓️ 全年旅遊指數</h3>
        {region.bestSeason && <span className="best-months-season">最佳季節 · {region.bestSeason}</span>}
      </div>

      <div className="best-months-grid" role="img" aria-label={`全年旅遊指數，最佳季節 ${region.bestSeason || '全年'}`}>
        {ratings.map((r, i) => (
          <div key={i} className={`bm-cell bm-${r} ${i === nowIdx ? 'bm-now' : ''}`}>
            <span className="bm-month">{LABELS[i]}</span>
            {i === nowIdx && <span className="bm-now-tag">本月</span>}
          </div>
        ))}
      </div>

      <div className="best-months-legend">
        {allOk ? (
          <span className="bm-note">此地大致全年皆可造訪，出發前再依當月天氣微調即可。</span>
        ) : (
          <>
            <span className="bm-legend-item"><i className="bm-key bm-best" /> 最佳</span>
            <span className="bm-legend-item"><i className="bm-key bm-ok" /> 過渡季</span>
            <span className="bm-legend-item"><i className="bm-key bm-low" /> 淡季</span>
          </>
        )}
      </div>
    </section>
  )
}
