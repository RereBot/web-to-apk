import { useState } from 'react'
import './Header.css'

function Header({ user }) {
  const [showMenu, setShowMenu] = useState(false)

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#61dafb" />
                  <stop offset="100%" stopColor="#21a1c4" />
                </linearGradient>
              </defs>
              <rect width="120" height="120" rx="20" fill="url(#logoGradient)"/>
              <g transform="translate(60,60)">
                <circle cx="0" cy="0" r="8" fill="white"/>
                <g stroke="white" strokeWidth="3" fill="none">
                  <ellipse rx="25" ry="10"/>
                  <ellipse rx="25" ry="10" transform="rotate(60)"/>
                  <ellipse rx="25" ry="10" transform="rotate(120)"/>
                </g>
              </g>
            </svg>
          </div>
          <div className="header-text">
            <h1>React App</h1>
            <p>Web-to-APK 示例</p>
          </div>
        </div>

        <div className="header-right">
          {user && (
            <div className="user-info">
              <span>欢迎, {user.name}</span>
            </div>
          )}
          
          <button 
            className="menu-button"
            onClick={toggleMenu}
            aria-label="菜单"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {showMenu && (
        <nav className="mobile-menu">
          <a href="#counter" onClick={() => setShowMenu(false)}>计数器</a>
          <a href="#storage" onClick={() => setShowMenu(false)}>存储</a>
          <a href="#form" onClick={() => setShowMenu(false)}>表单</a>
          <a href="#info" onClick={() => setShowMenu(false)}>信息</a>
        </nav>
      )}
    </header>
  )
}

export default Header