import { useEffect, useMemo, useState } from 'react'
import { getLocalReviews, addLocalReview } from '../services/reviewsStore.js'
import { fetchSharedReviews, postSharedReview } from '../services/reviewsApi.js'

// 城市社群牆：旅人留下星等評論與照片。
// 連接 Vercel KV 後是「所有訪客共享」的社群；未連接時存在本機瀏覽器（你自己的評論）。
const Stars = ({ value }) => <span className="rv-stars" aria-label={`${value} 顆星`}>{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>

const fmtDate = (iso) => {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  } catch {
    return ''
  }
}

export default function Reviews({ countryId, regionId, regionName }) {
  const [reviews, setReviews] = useState([])
  const [shared, setShared] = useState(false) // true = 來自社群資料庫
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nickname: '', rating: 5, text: '', photo: '' })
  const [busy, setBusy] = useState(false)

  // 載入：先試社群資料庫，沒有就用本機
  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchSharedReviews({ countryId, regionId }).then((server) => {
      if (!alive) return
      if (server) {
        setShared(true)
        setReviews(server)
      } else {
        setShared(false)
        setReviews(getLocalReviews(countryId, regionId))
      }
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [countryId, regionId])

  const avg = useMemo(() => {
    if (!reviews.length) return 0
    return Math.round((reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length) * 10) / 10
  }, [reviews])

  const submit = async (e) => {
    e.preventDefault()
    const text = form.text.trim()
    const photo = form.photo.trim()
    if (!text && !photo) return
    setBusy(true)
    const review = {
      nickname: form.nickname.trim() || '訪客',
      rating: form.rating,
      text,
      photo: /^https?:\/\//i.test(photo) ? photo : '',
    }
    const ok = await postSharedReview({ countryId, regionId, review })
    if (ok) {
      const server = await fetchSharedReviews({ countryId, regionId })
      setShared(true)
      setReviews(server || [])
    } else {
      // 無資料庫 → 存本機
      const next = addLocalReview(countryId, regionId, { ...review, date: new Date().toISOString() })
      setShared(false)
      setReviews(next)
    }
    setForm({ nickname: form.nickname, rating: 5, text: '', photo: '' })
    setBusy(false)
  }

  return (
    <section id="reviews" className="section reviews">
      <h2 className="section-title">
        <span className="section-title-icon">💬</span>旅人評論與照片
        <span className="section-title-sub">
          {shared ? '社群共享 · 所有人看得到' : '存在你的瀏覽器（連接資料庫後成為社群）'}
        </span>
      </h2>

      <div className="reviews-summary">
        {reviews.length > 0 ? (
          <>
            <span className="reviews-avg">{avg.toFixed(1)}</span>
            <div>
              <Stars value={Math.round(avg)} />
              <p className="reviews-count">{reviews.length} 則評論</p>
            </div>
          </>
        ) : (
          <p className="reviews-empty">還沒有人評論{regionName}，當第一個分享心得的人吧！</p>
        )}
      </div>

      <form className="review-form" onSubmit={submit}>
        <div className="review-form-row">
          <input
            className="review-nick"
            value={form.nickname}
            onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            placeholder="暱稱（選填）"
            maxLength={24}
            aria-label="暱稱"
          />
          <div className="review-rating" role="radiogroup" aria-label="評分">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`review-star ${n <= form.rating ? 'on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, rating: n }))}
                aria-label={`${n} 顆星`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <textarea
          className="review-text"
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder={`分享你在${regionName}的旅遊心得、推薦或提醒…`}
          maxLength={600}
          rows={3}
          aria-label="評論內容"
        />
        <input
          className="review-photo"
          value={form.photo}
          onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
          placeholder="📷 貼上照片網址（選填，https://…）"
          maxLength={400}
          aria-label="照片網址"
        />
        <button className="btn btn-primary review-submit" disabled={busy}>
          {busy ? '送出中…' : '發表評論'}
        </button>
      </form>

      {loading ? (
        <p className="reviews-loading">載入評論中…</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r, i) => (
            <li key={r.id || i} className="review-item">
              <div className="review-item-head">
                <strong className="review-item-nick">{r.nickname || '訪客'}</strong>
                <Stars value={Math.max(1, Math.min(5, Number(r.rating) || 0))} />
                {r.date && <span className="review-item-date">{fmtDate(r.date)}</span>}
              </div>
              {r.text && <p className="review-item-text">{r.text}</p>}
              {r.photo && (
                <img
                  className="review-item-photo"
                  src={r.photo}
                  alt={`${regionName} 旅人照片`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
