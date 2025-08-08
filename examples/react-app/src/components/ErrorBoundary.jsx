import React from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>应用出现错误</h2>
            <p>很抱歉，应用遇到了一个意外错误。</p>
            
            <div className="error-actions">
              <button 
                className="btn btn-primary" 
                onClick={this.handleReload}
              >
                重新加载应用
              </button>
              <button 
                className="btn btn-outline" 
                onClick={this.handleReset}
              >
                尝试恢复
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>错误详情 (开发模式)</summary>
                <div className="error-stack">
                  <h4>错误信息:</h4>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  
                  <h4>组件堆栈:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary