import { useState, useEffect } from 'react'
import Header from './components/Header'
import Counter from './components/Counter'
import UserForm from './components/UserForm'
import StorageDemo from './components/StorageDemo'
import ThemeToggle from './components/ThemeToggle'
import AppInfo from './components/AppInfo'
import ErrorBoundary from './components/ErrorBoundary'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTheme } from './hooks/useTheme'
import './styles/App.css'

function App() {
  const [theme, toggleTheme] = useTheme()
  const [user, setUser] = useLocalStorage('user', null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Hide loading screen
      const loading = document.getElementById('loading')
      if (loading) {
        loading.style.display = 'none'
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return null // Loading screen is handled in HTML
  }

  return (
    <ErrorBoundary>
      <div className={`app ${theme}`} data-theme={theme}>
        <Header user={user} />
        
        <main className="main-content">
          <div className="container">
            {/* Welcome Section */}
            <section className="welcome-section">
              <h2>欢迎使用 React App</h2>
              <p>This is a sample application created with React + Vite + Web-to-APK.</p>
              
              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">⚛️</div>
                  <h3>React 18</h3>
                  <p>使用最新的React特性和Hooks</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>Vite</h3>
                  <p>快速的开发和构建体验</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📱</div>
                  <h3>移动优化</h3>
                  <p>专为移动设备优化的界面</p>
                </div>
              </div>
            </section>

            {/* Interactive Components */}
            <section className="components-section">
              <h2>交互组件</h2>
              
              <div className="components-grid">
                <Counter />
                <StorageDemo />
              </div>
            </section>

            {/* User Form */}
            <section className="form-section">
              <UserForm user={user} onUserUpdate={setUser} />
            </section>

            {/* App Info */}
            <section className="info-section">
              <AppInfo />
            </section>
          </div>
        </main>

        {/* Theme Toggle */}
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
    </ErrorBoundary>
  )
}

export default App