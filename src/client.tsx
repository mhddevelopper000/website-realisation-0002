import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

console.log('Client starting...')

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  document.body.innerHTML = '<h1>ERROR: root element not found!</h1>'
} else {
  try {
    const router = getRouter()
    console.log('Router created:', router)
    
    const root = ReactDOM.createRoot(rootElement)
    console.log('React root created')
    
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    )
    console.log('App rendered')
  } catch (error) {
    console.error('Error initializing app:', error)
    document.body.innerHTML = `<h1>App Error</h1><pre>${error}</pre>`
  }
}
