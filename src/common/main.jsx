import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routing from './Routing.jsx'
import '../styles/global.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Routing />
  </StrictMode>,
)
