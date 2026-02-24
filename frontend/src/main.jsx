/**
 * IKMS Frontend - Main Entry Point
 * Created by: Soreti (Team Leader)
 * DO NOT MODIFY WITHOUT PERMISSION
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
