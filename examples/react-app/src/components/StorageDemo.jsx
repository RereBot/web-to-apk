import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useNotification } from '../hooks/useNotification'
import './StorageDemo.css'

function StorageDemo() {
  const [input, setInput] = useState('')
  const [storedData, setStoredData] = useLocalStorage('demoData', null)
  const showNotification = useNotification()

  const handleSave = () => {
    if (!input.trim()) {
      showNotification('请输入要保存的内容', 'error')
      return
    }

    const data = {
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    setStoredData(data)
    setInput('')
    showNotification('数据保存成功', 'success')
  }

  const handleLoad = () => {
    if (storedData) {
      setInput(storedData.content)
      showNotification('数据加载成功', 'success')
    } else {
      showNotification('没有找到保存的数据', 'info')
    }
  }

  const handleClear = () => {
    setStoredData(null)
    setInput('')
    showNotification('数据清除成功', 'success')
  }

  return (
    <div className="storage-demo-widget" id="storage">
      <h3>本地存储演示</h3>
      
      <div className="storage-controls">
        <div className="input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要保存的内容"
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        
        <div className="button-group">
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleSave}
            disabled={!input.trim()}
          >
            保存
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleLoad}
            disabled={!storedData}
          >
            加载
          </button>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={handleClear}
            disabled={!storedData}
          >
            清除
          </button>
        </div>
      </div>

      <div className="storage-display">
        {storedData ? (
          <div className="stored-data">
            <div className="data-header">
              <strong>保存的数据:</strong>
              <span className="timestamp">
                {new Date(storedData.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="data-content">
              {storedData.content}
            </div>
          </div>
        ) : (
          <div className="no-data">
            暂无保存的数据
          </div>
        )}
      </div>

      <div className="storage-info">
        <small>
          数据保存在浏览器的 localStorage 中，关闭应用后仍会保留
        </small>
      </div>
    </div>
  )
}

export default StorageDemo