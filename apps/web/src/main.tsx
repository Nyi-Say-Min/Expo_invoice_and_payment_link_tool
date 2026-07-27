import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './app/global.css'
import App from './app/app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={4500}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="light"
    />
  </StrictMode>,
)
