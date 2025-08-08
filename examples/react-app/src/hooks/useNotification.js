import { useCallback } from 'react'

export function useNotification() {
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message

    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      fontSize: '14px',
      zIndex: '10000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      maxWidth: '300px',
      wordWrap: 'break-word',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    })

    // Set background color based on type
    const colors = {
      success: '#4CAF50',
      error: '#F44336',
      info: '#2196F3',
      warning: '#FF9800'
    }
    notification.style.backgroundColor = colors[type] || colors.info

    // Add to DOM
    document.body.appendChild(notification)

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)'
    })

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, duration)

    // Allow manual dismissal
    notification.addEventListener('click', () => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    })

    // Add cursor pointer for clickable notifications
    notification.style.cursor = 'pointer'
    notification.title = '点击关闭'

  }, [])

  return showNotification
}