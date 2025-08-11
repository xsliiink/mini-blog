import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './pages/adminpage/index.css'
import App from './pages/App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </StrictMode>,
)
