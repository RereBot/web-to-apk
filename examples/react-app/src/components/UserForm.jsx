import { useState } from 'react'
import { useNotification } from '../hooks/useNotification'
import './UserForm.css'

function UserForm({ user, onUserUpdate }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: user?.message || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showNotification = useNotification()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      showNotification('请输入姓名', 'error')
      return false
    }
    
    if (!formData.email.trim()) {
      showNotification('请输入邮箱', 'error')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showNotification('请输入有效的邮箱地址', 'error')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData = {
        ...formData,
        timestamp: new Date().toISOString()
      }
      
      onUserUpdate(userData)
      showNotification('用户信息保存成功！', 'success')
      
    } catch (error) {
      showNotification('保存失败，请重试', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = () => {
    setFormData({
      name: '',
      email: '',
      message: ''
    })
    onUserUpdate(null)
    showNotification('表单已清空', 'info')
  }

  return (
    <div className="user-form-widget" id="form">
      <h3>用户信息</h3>
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="name">姓名 *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="请输入您的姓名"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">邮箱 *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="请输入您的邮箱"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">留言</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="请留下您的留言"
            disabled={isSubmitting}
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClear}
            disabled={isSubmitting}
          >
            清空
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>

      {user && (
        <div className="user-preview">
          <h4>当前用户信息</h4>
          <div className="user-details">
            <p><strong>姓名:</strong> {user.name}</p>
            <p><strong>邮箱:</strong> {user.email}</p>
            {user.message && <p><strong>留言:</strong> {user.message}</p>}
            <p><strong>保存时间:</strong> {new Date(user.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserForm