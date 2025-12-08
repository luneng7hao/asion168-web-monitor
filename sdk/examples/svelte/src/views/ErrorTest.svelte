<script>
  import { onMount } from 'svelte'
  import monitor from '@monitor/svelte'
  import ErrorComponent from '../components/ErrorComponent.svelte'

  let errorMessage = ''
  let showErrorComponent = false
  let errorComponentKey = 0  // 用于强制重新渲染错误组件

  // Svelte 4 不支持 onError（Svelte 5 才支持）
  // 组件错误会通过全局错误监听器捕获（已在 SDK 中配置）
  // 这里添加一个错误处理包装器来显示错误信息
  let lastErrorTime = 0  // 记录最后一次错误的时间戳
  
  onMount(() => {
    // 监听全局错误事件，用于显示错误信息
    const handleError = (event) => {
      if (event.error) {
        const errorMsg = event.error.message || '未知错误'
        const currentTime = Date.now()
        
        // 只处理最近的错误（避免处理旧的错误）
        if (currentTime - lastErrorTime < 2000) {
          console.log('🔍 Error caught:', errorMsg, 'showErrorComponent:', showErrorComponent)
          
          // 如果错误组件正在显示，且错误消息匹配 Svelte 组件错误，才认为是 Svelte 组件错误
          if (showErrorComponent && (errorMsg.includes('测试的 Svelte 组件错误') || errorMsg.includes('Svelte 组件错误'))) {
            errorMessage = `Svelte 组件错误已触发：${errorMsg}\n错误已上报到监控系统`
            console.log('✅ Svelte component error detected')
          } else if (!showErrorComponent) {
            // 只有当错误组件不显示时，才处理其他类型的错误
            if (errorMsg.includes('测试的 JavaScript 错误')) {
              errorMessage = `JavaScript 错误已触发：${errorMsg}\n错误已上报到监控系统`
              console.log('✅ JavaScript error detected')
            } else if (errorMsg.includes('测试的 Promise 错误')) {
              errorMessage = `Promise 错误已触发：${errorMsg}\n错误已上报到监控系统`
              console.log('✅ Promise error detected')
            }
          }
        }
      }
    }
    
    // 监听未处理的 Promise 拒绝
    const handleUnhandledRejection = (event) => {
      if (event.reason) {
        const errorMsg = event.reason.message || String(event.reason)
        const currentTime = Date.now()
        
        console.log('🔍 Promise rejection caught:', errorMsg, 'showErrorComponent:', showErrorComponent)
        
        // 只处理最近的错误
        if (currentTime - lastErrorTime < 2000) {
          // 如果错误组件正在显示，且错误消息匹配 Svelte 组件错误，才认为是 Svelte 组件错误
          if (showErrorComponent && (errorMsg.includes('测试的 Svelte 组件错误') || errorMsg.includes('Svelte 组件错误'))) {
            errorMessage = `Svelte 组件错误已触发：${errorMsg}\n错误已上报到监控系统`
            console.log('✅ Svelte component error detected (from promise rejection)')
          } else if (!showErrorComponent && errorMsg.includes('测试的 Promise 错误')) {
            errorMessage = `Promise 错误已触发：${errorMsg}\n错误已上报到监控系统`
            console.log('✅ Promise rejection detected')
          }
        }
      }
    }
    
    window.addEventListener('error', handleError, true)  // 使用捕获阶段，确保先于 SDK 监听器执行
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  })

  function triggerJsError() {
    // 先清除错误组件，确保不会干扰
    showErrorComponent = false
    errorComponentKey++  // 强制重新渲染
    errorMessage = ''  // 清空之前的错误信息
    lastErrorTime = Date.now()  // 更新时间戳
    // 延迟一下，确保错误组件完全移除
    setTimeout(() => {
      errorMessage = '正在触发 JavaScript 错误...'
      setTimeout(() => {
        lastErrorTime = Date.now()  // 更新错误时间戳
        throw new Error('这是一个测试的 JavaScript 错误')
      }, 50)
    }, 100)
  }

  function triggerPromiseError() {
    // 先清除错误组件，确保不会干扰
    showErrorComponent = false
    errorComponentKey++  // 强制重新渲染
    errorMessage = ''  // 清空之前的错误信息
    lastErrorTime = Date.now()  // 更新时间戳
    // 延迟一下，确保错误组件完全移除
    setTimeout(() => {
      errorMessage = '正在触发 Promise 错误...'
      lastErrorTime = Date.now()  // 更新错误时间戳
      Promise.reject(new Error('这是一个测试的 Promise 错误'))
    }, 100)
  }

  function triggerResourceError() {
    // 先清除错误组件，确保不会干扰
    showErrorComponent = false
    errorComponentKey++  // 强制重新渲染
    errorMessage = ''  // 清空之前的错误信息
    lastErrorTime = Date.now()  // 更新时间戳
    // 延迟一下，确保错误组件完全移除
    setTimeout(() => {
      errorMessage = '正在触发资源加载错误...'
      // 创建一个图片元素并添加到 DOM，确保能被 error 事件监听器捕获
      const img = document.createElement('img')
      img.src = 'https://nonexistent-domain-12345.com/image.jpg'
      img.style.display = 'none'
      img.onerror = () => {
        errorMessage = '资源加载错误已触发，已上报到监控系统'
        // 延迟移除，确保错误事件能被捕获
        setTimeout(() => {
          if (img.parentNode) {
            img.parentNode.removeChild(img)
          }
        }, 1000)
      }
      // 添加到 DOM 中，触发加载
      document.body.appendChild(img)
    }, 100)
  }

  function triggerSvelteError() {
    errorMessage = '正在触发 Svelte 组件错误...'
    errorComponentKey++  // 每次触发时使用新的 key，强制重新渲染
    showErrorComponent = true
    lastErrorTime = Date.now()  // 更新时间戳
    // 延迟更新错误信息，等待组件错误被捕获
    setTimeout(() => {
      if (errorMessage === '正在触发 Svelte 组件错误...') {
        errorMessage = 'Svelte 组件错误已触发，错误已上报到监控系统'
      }
    }, 500)
  }

  function captureManualError() {
    // 先清除错误组件，确保不会干扰
    showErrorComponent = false
    errorComponentKey++  // 强制重新渲染
    errorMessage = ''  // 清空之前的错误信息
    lastErrorTime = Date.now()  // 更新时间戳
    // 延迟一下，确保错误组件完全移除
    setTimeout(() => {
      try {
        const obj = null
        obj.doSomething()
      } catch (error) {
        monitor.captureError(error, {
          action: '手动捕获',
          page: 'ErrorTest',
          customData: '这是手动捕获的错误'
        })
        errorMessage = '错误已手动捕获并上报：' + error.message
        alert('错误已捕获并上报到监控系统')
      }
    }, 100)
  }
</script>

<div class="error-test">
  <div class="card">
    <h2>🐛 错误测试页面</h2>
    <p>点击下面的按钮来测试不同类型的错误捕获：</p>
    
    <div class="button-group">
      <button on:click={triggerJsError} class="btn btn-danger">
        触发 JavaScript 错误
      </button>
      <button on:click={triggerPromiseError} class="btn btn-danger">
        触发 Promise 错误
      </button>
      <button on:click={triggerResourceError} class="btn btn-danger">
        触发资源加载错误
      </button>
      <button on:click={triggerSvelteError} class="btn btn-danger">
        触发 Svelte 组件错误
      </button>
      <button on:click={captureManualError} class="btn btn-warning">
        手动捕获错误
      </button>
    </div>
  </div>

  {#if errorMessage}
    <div class="card">
      <h3>错误信息</h3>
      <pre>{errorMessage}</pre>
    </div>
  {/if}

  {#if showErrorComponent}
    <!-- 会出错的组件，使用 key 强制重新渲染 -->
    <ErrorComponent key={errorComponentKey} />
  {/if}
</div>

<style>
  .error-test {
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

  .card h3 {
    margin-bottom: 1rem;
    color: #f56565;
  }

  .card p {
    margin-bottom: 1rem;
    color: #666;
    line-height: 1.6;
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

  .btn-danger {
    background: #f56565;
    color: white;
  }

  .btn-danger:hover {
    background: #e53e3e;
  }

  .btn-warning {
    background: #ed8936;
    color: white;
  }

  .btn-warning:hover {
    background: #dd6b20;
  }

  pre {
    background: #f7fafc;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    color: #e53e3e;
    font-size: 13px;
    line-height: 1.5;
  }
</style>

