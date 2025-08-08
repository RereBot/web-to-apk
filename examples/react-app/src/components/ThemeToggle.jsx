import './ThemeToggle.css'

function ThemeToggle({ theme, onToggle }) {
  return (
    <button 
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`切换到${theme === 'light' ? '暗色' : '亮色'}主题`}
      title={`切换到${theme === 'light' ? '暗色' : '亮色'}主题`}
    >
      <div className="toggle-icon">
        {theme === 'light' ? (
          // Moon icon for dark mode
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        ) : (
          // Sun icon for light mode
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5"/>
            <path d="m12 1-1.5 1.5L12 4l1.5-1.5L12 1zM21 11h-3l1.5-1.5L21 11zM12 20l-1.5 1.5L12 23l1.5-1.5L12 20zM4.5 10.5L3 12l1.5 1.5L6 12l-1.5-1.5zM17.5 17.5L19 19l-1.5 1.5L16 19l1.5-1.5zM17.5 6.5L16 5l1.5-1.5L19 5l-1.5 1.5zM6.5 17.5L5 19l-1.5-1.5L5 16l1.5 1.5zM6.5 6.5L8 5 6.5 3.5 5 5l1.5 1.5z"/>
          </svg>
        )}
      </div>
      <span className="toggle-text">
        {theme === 'light' ? '暗色' : '亮色'}
      </span>
    </button>
  )
}

export default ThemeToggle