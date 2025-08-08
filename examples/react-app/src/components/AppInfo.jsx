import { useState, useEffect } from 'react'
import './AppInfo.css'

function AppInfo() {
  const [platformInfo, setPlatformInfo] = useState({
    platform: 'Web',
    userAgent: '',
    isCapacitor: false,
    screenSize: '',
    language: navigator.language
  })

  useEffect(() => {
    const updatePlatformInfo = () => {
      let platform = 'Web'
      let isCapacitor = false

      if (window.Capacitor) {
        platform = window.Capacitor.getPlatform()
        isCapacitor = true
      } else if (navigator.userAgent.includes('Android')) {
        platform = 'Android (Web)'
      } else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        platform = 'iOS (Web)'
      }

      setPlatformInfo({
        platform,
        userAgent: navigator.userAgent,
        isCapacitor,
        screenSize: `${window.screen.width} × ${window.screen.height}`,
        language: navigator.language
      })
    }

    updatePlatformInfo()

    // Update on resize
    window.addEventListener('resize', updatePlatformInfo)
    return () => window.removeEventListener('resize', updatePlatformInfo)
  }, [])

  const appVersion = '1.0.0'
  const buildTool = 'React + Vite + Web-to-APK'

  return (
    <div className="app-info-widget" id="info">
      <h3>应用信息</h3>
      
      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">版本</div>
          <div className="info-value">{appVersion}</div>
        </div>
        
        <div className="info-item">
          <div className="info-label">构建工具</div>
          <div className="info-value">{buildTool}</div>
        </div>
        
        <div className="info-item">
          <div className="info-label">平台</div>
          <div className="info-value">
            {platformInfo.platform}
            {platformInfo.isCapacitor && (
              <span className="capacitor-badge">Capacitor</span>
            )}
          </div>
        </div>
        
        <div className="info-item">
          <div className="info-label">屏幕尺寸</div>
          <div className="info-value">{platformInfo.screenSize}</div>
        </div>
        
        <div className="info-item">
          <div className="info-label">语言</div>
          <div className="info-value">{platformInfo.language}</div>
        </div>
        
        <div className="info-item">
          <div className="info-label">React版本</div>
          <div className="info-value">18.2.0</div>
        </div>
      </div>

      <div className="user-agent-info">
        <div className="info-label">用户代理</div>
        <div className="info-value user-agent">
          {platformInfo.userAgent}
        </div>
      </div>

      <div className="feature-status">
        <h4>功能支持状态</h4>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-name">本地存储</span>
            <span className={`feature-status ${typeof Storage !== 'undefined' ? 'supported' : 'not-supported'}`}>
              {typeof Storage !== 'undefined' ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="feature-item">
            <span className="feature-name">触摸支持</span>
            <span className={`feature-status ${'ontouchstart' in window ? 'supported' : 'not-supported'}`}>
              {'ontouchstart' in window ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="feature-item">
            <span className="feature-name">Service Worker</span>
            <span className={`feature-status ${'serviceWorker' in navigator ? 'supported' : 'not-supported'}`}>
              {'serviceWorker' in navigator ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="feature-item">
            <span className="feature-name">Capacitor</span>
            <span className={`feature-status ${platformInfo.isCapacitor ? 'supported' : 'not-supported'}`}>
              {platformInfo.isCapacitor ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppInfo