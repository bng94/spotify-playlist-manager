import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './globals.css'
import App from './App.tsx'
import ToastProvider from './contexts/ToastContext/ToastContext'
import UserProvider from './contexts/UserContext/UserContext'
import SpotifyApiProvider from './contexts/SpotifyApiContext/SpotifyApiContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <UserProvider>
          <SpotifyApiProvider>
            <App />
          </SpotifyApiProvider>
        </UserProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
