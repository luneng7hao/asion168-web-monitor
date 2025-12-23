import { useState, useEffect } from 'react'
import './Performance.css'

function Performance() {
  const [loadTime, setLoadTime] = useState(0)
  const [fcp, setFcp] = useState(0)
  const [lcp, setLcp] = useState(0)
  const [fid, setFid] = useState(0)
  const [cls, setCls] = useState(0)

  useEffect(() => {
    collectPerformance()
  }, [])

  const collectPerformance = () => {
    const timing = performance.timing
    if (timing.loadEventEnd > 0) {
      setLoadTime(timing.loadEventEnd - timing.navigationStart)
    }

    // 获取 Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // FCP 和 LCP
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              setFcp(Math.round(entry.startTime))
            }
            if (entry.entryType === 'largest-contentful-paint') {
              setLcp(Math.round(entry.startTime))
            }
          }
        })
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })

        // FID (首次输入延迟)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fidEntry = entries[0] as any
          if (fidEntry) {
            setFid(Math.round(fidEntry.processingStart - fidEntry.startTime))
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // CLS (累积布局偏移)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              setCls(parseFloat(clsValue.toFixed(2)))
            }
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.error('Performance observer error:', e)
      }
    }
  }

  const reloadPage = () => {
    location.reload()
  }

  const simulateHeavyTask = () => {
    const start = Date.now()
    // 模拟重计算
    let result = 0
    for (let i = 0; i < 10000000; i++) {
      result += Math.sqrt(i)
    }
    const duration = Date.now() - start
    alert(`重任务完成，耗时: ${duration}ms`)
  }

  const testFID = () => {
    // FID 会在用户首次交互时自动测量
    // 这个按钮的点击会触发 FID 测量
    alert('FID 会在首次点击时自动测量，请查看性能指标')
  }

  const testCLS = () => {
    // 动态改变布局来触发 CLS
    const card = document.querySelector('.card')
    if (card) {
      // 添加一个会改变布局的元素
      const testDiv = document.createElement('div')
      testDiv.style.height = '200px'
      testDiv.style.width = '100%'
      testDiv.style.background = '#f0f0f0'
      testDiv.style.marginTop = '20px'
      testDiv.textContent = '这个元素会触发布局偏移（CLS）'
      card.appendChild(testDiv)

      // 延迟移除，观察 CLS 变化
      setTimeout(() => {
        if (card.contains(testDiv)) {
          card.removeChild(testDiv)
        }
      }, 2000)

      alert('已触发布局偏移，CLS 值会更新')
    }
  }

  return (
    <div className="performance">
      <div className="card">
        <h2>⚡ 性能测试页面</h2>
        <p>这个页面用于测试性能监控功能。</p>
        
        <div className="metrics">
          <div className="metric-item">
            <label>页面加载时间：</label>
            <span>{loadTime}ms</span>
          </div>
          <div className="metric-item">
            <label>首次内容绘制 (FCP)：</label>
            <span>{fcp}ms</span>
          </div>
          <div className="metric-item">
            <label>最大内容绘制 (LCP)：</label>
            <span>{lcp}ms</span>
          </div>
          <div className="metric-item">
            <label>首次输入延迟 (FID)：</label>
            <span>{fid}ms</span>
          </div>
          <div className="metric-item">
            <label>累积布局偏移 (CLS)：</label>
            <span>{cls}</span>
          </div>
        </div>

        <div className="button-group">
          <button onClick={reloadPage} className="btn btn-primary">
            重新加载页面（测试性能）
          </button>
          <button onClick={simulateHeavyTask} className="btn btn-warning">
            模拟重任务（测试性能）
          </button>
          <button onClick={testFID} className="btn btn-success">
            测试 FID（点击此按钮）
          </button>
          <button onClick={testCLS} className="btn btn-info">
            测试 CLS（布局偏移）
          </button>
        </div>
      </div>
    </div>
  )
}

export default Performance

