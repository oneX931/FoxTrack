import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '../css/fonts.css'
import '../css/normalize.css'
import '../css/tokens.css'
import '../css/base.css'
import '../css/layout.css'
import '../css/components.css'
import '../css/icons.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
