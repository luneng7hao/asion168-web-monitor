import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './views/Home'
import About from './views/About'
import ErrorTest from './views/ErrorTest'
import Performance from './views/Performance'
import './App.css'

function App() {
  const location = useLocation()

  useEffect(() => {
    console.log('VITE_BASE:', import.meta.env.VITE_BASE)
  }, [])

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-title">React 监控 SDK 测试</h1>
          <div className="nav-links">
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              首页
            </Link>
            <Link 
              to="/about" 
              className={location.pathname === '/about' ? 'active' : ''}
            >
              关于
            </Link>
            <Link 
              to="/error-test" 
              className={location.pathname === '/error-test' ? 'active' : ''}
            >
              错误测试
            </Link>
            <Link 
              to="/performance" 
              className={location.pathname === '/performance' ? 'active' : ''}
            >
              性能测试
            </Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/error-test" element={<ErrorTest />} />
          <Route path="/performance" element={<Performance />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

