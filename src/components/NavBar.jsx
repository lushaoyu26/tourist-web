import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GROUPS, FEATURED_IDS, COUNTRY_BY_ID } from '../data/index.js'
import { useTrip } from '../hooks/useTrip.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useLang } from '../hooks/useLang.jsx'
import CitySearch from './CitySearch.jsx'

export default function NavBar() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const panelRef = useRef(null)
  const { items } = useTrip()
  const { theme, toggle } = useTheme()
  const { lang, toggle: toggleLang, t } = useLang()

  // 路由切換或點擊選單外側時收合
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // 全域鍵盤捷徑：按「/」或 Cmd/Ctrl+K 開啟搜尋
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const featured = FEATURED_IDS.slice(0, 4).map((id) => COUNTRY_BY_ID[id])

  return (
    <header className={`navbar ${onHome ? 'navbar-dark' : ''}`}>
      <Link to="/" className="navbar-logo">
        <span className="navbar-logo-icon">🌏</span>
        <span className="navbar-logo-text">
          漫遊地球 <em>WanderGlobe</em>
        </span>
      </Link>

      <nav className="navbar-links" ref={panelRef}>
        <button
          className="navbar-search-btn"
          onClick={() => setSearchOpen(true)}
          title="搜尋城市或國家（快捷鍵 /）"
          aria-label="搜尋"
        >
          <span>🔍</span>
          <span className="navbar-search-hint">{t('search')}</span>
          <kbd className="navbar-search-kbd">/</kbd>
        </button>

        {featured.map((c) => (
          <Link
            key={c.id}
            to={`/country/${c.id}`}
            className={`navbar-link ${pathname.startsWith(`/country/${c.id}`) ? 'active' : ''}`}
          >
            <span>{c.flag}</span>
            <span className="navbar-link-name">{c.name}</span>
          </Link>
        ))}

        <button className={`navbar-link navbar-menu-btn ${open ? 'active' : ''}`} onClick={() => setOpen(!open)}>
          <span>🗺️</span>
          <span className="navbar-link-name">{t('allDest')}</span>
          <span className={`navbar-caret ${open ? 'up' : ''}`}>▾</span>
        </button>

        {open && (
          <div className="mega-menu">
            {GROUPS.map((group) => (
              <div key={group.id} className="mega-menu-group">
                <h4>
                  {group.emoji} {group.name}
                </h4>
                <div className="mega-menu-countries">
                  {group.countries.map((c) => (
                    <Link key={c.id} to={`/country/${c.id}`} className="mega-menu-country">
                      <span>{c.flag}</span> {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link to="/destinations" className="mega-menu-all">
              📋 瀏覽全部目的地總覽 →
            </Link>
          </div>
        )}

        <Link
          to="/trip"
          className={`navbar-link navbar-trip ${pathname === '/trip' ? 'active' : ''}`}
        >
          <span>🧳</span>
          <span className="navbar-link-name">{t('myTrip')}</span>
          {items.length > 0 && <span className="navbar-trip-badge">{items.length}</span>}
        </Link>

        <button
          className="navbar-lang-btn"
          onClick={toggleLang}
          title={lang === 'en' ? '切換為中文' : 'Switch to English'}
          aria-label="切換介面語言 / Switch language"
        >
          {lang === 'en' ? '中' : 'EN'}
        </button>

        <button
          className="navbar-theme-btn"
          onClick={toggle}
          title={theme === 'dark' ? t('toLight') : t('toDark')}
          aria-label="切換亮／暗色主題"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <CitySearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
