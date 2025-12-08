<script>
  import monitor from '@monitor/svelte'

  function trackCustomEvent() {
    monitor.track('custom_event', {
      action: 'button_click',
      button: 'trackCustomEvent',
      page: 'Home'
    })
    alert('自定义事件已追踪！')
  }

  async function testApiRequest() {
    try {
      const response = await fetch('https://api.github.com/users/octocat')
      const data = await response.json()
      alert('API 请求成功，已监控！')
      console.log(data)
    } catch (error) {
      alert('API 请求失败')
    }
  }

  function testErrorRequest() {
    fetch('https://nonexistent-domain-12345.com/api')
      .catch(() => {
        alert('错误请求已监控！')
      })
  }

  function testXHRRequest() {
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

  function testXHRError() {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://nonexistent-domain-12345.com/api')
    xhr.onerror = function() {
      alert('XMLHttpRequest 错误请求已监控！')
    }
    xhr.send()
  }
</script>

<div class="home">
  <div class="card">
    <h2>🏠 首页</h2>
    <p>这是 Svelte 监控 SDK 的测试页面。</p>
    <p>监控 SDK 已自动初始化，正在监控以下内容：</p>
    <ul class="feature-list">
      <li>✅ JavaScript 错误</li>
      <li>✅ Promise 错误</li>
      <li>✅ Svelte 组件错误（onError）</li>
      <li>✅ 资源加载错误</li>
      <li>✅ 页面性能指标</li>
      <li>✅ 用户行为（PV、点击）</li>
      <li>✅ API 请求监控</li>
      <li>✅ 路由变化追踪</li>
    </ul>
  </div>

  <div class="card">
    <h2>📊 测试功能</h2>
    <div class="button-group">
      <button on:click={trackCustomEvent} class="btn btn-primary">
        追踪自定义事件
      </button>
      <button on:click={testApiRequest} class="btn btn-success">
        测试 API 请求
      </button>
      <button on:click={testErrorRequest} class="btn btn-danger">
        测试错误请求
      </button>
      <button on:click={testXHRRequest} class="btn btn-info">
        测试 XMLHttpRequest
      </button>
      <button on:click={testXHRError} class="btn btn-warning">
        测试 XHR 错误请求
      </button>
    </div>
  </div>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .card h2 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.5rem;
  }

  .card p {
    margin-bottom: 1rem;
    color: #666;
    line-height: 1.6;
  }

  .feature-list {
    list-style: none;
    padding: 0;
    margin-top: 1rem;
  }

  .feature-list li {
    padding: 0.5rem 0;
    color: #555;
    font-size: 14px;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s;
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover {
    background: #5a6fd6;
  }

  .btn-success {
    background: #48bb78;
    color: white;
  }

  .btn-success:hover {
    background: #38a169;
  }

  .btn-danger {
    background: #f56565;
    color: white;
  }

  .btn-danger:hover {
    background: #e53e3e;
  }

  .btn-info {
    background: #4299e1;
    color: white;
  }

  .btn-info:hover {
    background: #3182ce;
  }

  .btn-warning {
    background: #ed8936;
    color: white;
  }

  .btn-warning:hover {
    background: #dd6b20;
  }
</style>

