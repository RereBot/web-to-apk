import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// Initialize Capacitor if available
if (window.Capacitor) {
  console.log('Running in Capacitor environment')
  
  // Import Capacitor plugins
  import('@capacitor/app').then(({ App: CapApp }) => {
    // Handle app state changes
    CapApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive)
    })
    
    // Handle back button
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapApp.exitApp()
      } else {
        window.history.back()
      }
    })
  }).catch(err => {
    console.log('Capacitor App plugin not available:', err)
  })
}

// Create React app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)