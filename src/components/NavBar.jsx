import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GROUPS, FEATURED_IDS, COUNTRY_BY_ID } from '../data/index.js'

export default function NavBar() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // 路由切換或點擊選單外側時收合
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

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
          <span className="navbar-link-name">全部目的地</span>
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
      </nav>
    </header>
  )
}
