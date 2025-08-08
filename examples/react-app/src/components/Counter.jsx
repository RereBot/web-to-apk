import { useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import './Counter.css'

function Counter() {
  const [count, setCount] = useLocalStorage('counter', 0)
  const [isAnimating, setIsAnimating] = useState(false)

  const increment = () => {
    setCount(prev => prev + 1)
    triggerAnimation()
  }

  const decrement = () => {
    setCount(prev => prev - 1)
    triggerAnimation()
  }

  const reset = () => {
    setCount(0)
    triggerAnimation()
  }

  const triggerAnimation = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <div className="counter-widget" id="counter">
      <h3>计数器</h3>
      <div className="counter-display">
        <span className={`counter-value ${isAnimating ? 'animating' : ''}`}>
          {count}
        </span>
      </div>
      <div className="counter-buttons">
        <button 
          className="btn btn-secondary" 
          onClick={decrement}
          aria-label="减少"
        >
          -
        </button>
        <button 
          className="btn btn-outline" 
          onClick={reset}
          aria-label="重置"
        >
          重置
        </button>
        <button 
          className="btn btn-primary" 
          onClick={increment}
          aria-label="增加"
        >
          +
        </button>
      </div>
      <div className="counter-info">
        <small>当前值: {count}</small>
      </div>
    </div>
  )
}

export default Counter