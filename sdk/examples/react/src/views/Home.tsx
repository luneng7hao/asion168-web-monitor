import monitor from '@monitor/react'
import './Home.css'

function Home() {
  const trackCustomEvent = () => {
    monitor.track('custom_event', {
      action: 'click',
      button: 'trackCustomEvent',
      page: 'Home'
    })
    alert('自定义事件已追踪！')
  }

  const testApiRequest = async () => {
    try {
      const response = await fetch('https://api.github.com/users/octocat')
      const data = await response.json()
      alert('API 请求成功，已监控！')
      console.log(data)
    } catch (error) {
      alert('API 请求失败')
    }
  }

  const testErrorRequest = () => {
    fetch('https://nonexistent-domain-12345.com/api')
      .catch(() => {
        alert('错误请求已监控！')
      })
  }

  const testXHRRequest = () => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://api.github.com/users/octocat')
    xhr.onload = function() {
      if (xhr.status === 200) {
        alert('XMLHttpRequest 请求成功，已监控！')
        console.log(JSON.parse(xhr.responseText))
      }
    }
    xhr.onerror = function() {
      alert('XMLHttpRequest 请求失败，已监控！')
    }
    xhr.send()
  }

  const testXHRError = () => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://nonexistent-domain-12345.com/api')
    xhr.onerror = function() {
      alert('XMLHttpRequest 错误请求已监控！')
    }
    xhr.send()
  }

  return (
    <div className="home">
      <div className="card">
        <h2>🏠 首页</h2>
        <p>这是 React 监控 SDK 的测试页面。</p>
        <p>监控 SDK 已自动初始化，正在监控以下内容：</p>
        <ul className="feature-list">
          <li>✅ JavaScript 错误</li>
          <li>✅ Promise 错误</li>
          <li>✅ React 组件错误（Error Boundary）</li>
          <li>✅ 资源加载错误</li>
          <li>✅ 页面性能指标</li>
          <li>✅ 用户行为（PV、点击）</li>
          <li>✅ API 请求监控</li>
          <li>✅ 路由变化追踪</li>
        </ul>
      </div>

      <div className="card">
        <h2>📊 测试功能</h2>
        <div className="button-group">
          <button onClick={trackCustomEvent} className="btn btn-primary">
            追踪自定义事件
          </button>
          <button onClick={testApiRequest} className="btn btn-success">
            测试 API 请求
          </button>
          <button onClick={testErrorRequest} className="btn btn-danger">
            测试错误请求
          </button>
          <button onClick={testXHRRequest} className="btn btn-info">
            测试 XMLHttpRequest
          </button>
          <button onClick={testXHRError} className="btn btn-warning">
            测试 XHR 错误请求
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home

