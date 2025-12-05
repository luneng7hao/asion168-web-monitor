import { useState, Component, ErrorInfo, ReactNode } from 'react'
import monitor from '@monitor/react'
import './ErrorTest.css'

// 一个会出错的组件
function ErrorComponent(): ReactNode {
  // 在渲染时抛出错误，会被 ErrorBoundary 捕获
  throw new Error('这是一个测试的 React 组件错误')
  return null // 这行永远不会执行，但满足类型要求
}

// 本地 ErrorBoundary，用于在页面内显示错误
class LocalErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="error-boundary-fallback">
          <h3>⚠️ React 组件错误已捕获</h3>
          <p>错误信息：{this.state.error.message}</p>
          <p className="error-note">错误已上报到监控系统</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-primary"
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function ErrorTest() {
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorComponent, setShowErrorComponent] = useState(false)

  const triggerJsError = () => {
    setErrorMessage('已触发 JavaScript 错误...')
    setTimeout(() => {
      throw new Error('这是一个测试的 JavaScript 错误')
    }, 100)
  }

  const triggerPromiseError = () => {
    setErrorMessage('已触发 Promise 错误...')
    Promise.reject(new Error('这是一个测试的 Promise 错误'))
  }

  const triggerResourceError = () => {
    setErrorMessage('正在触发资源加载错误...')
    // 创建一个图片元素并添加到 DOM，确保能被 error 事件监听器捕获
    const img = document.createElement('img')
    img.src = 'https://nonexistent-domain-12345.com/image.jpg'
    img.style.display = 'none'
    img.onerror = () => {
      setErrorMessage('资源加载错误已触发，已上报到监控系统')
      // 延迟移除，确保错误事件能被捕获
      setTimeout(() => {
        if (img.parentNode) {
          img.parentNode.removeChild(img)
        }
      }, 1000)
    }
    // 添加到 DOM 中，触发加载
    document.body.appendChild(img)
  }

  const triggerReactError = () => {
    setErrorMessage('已触发 React 组件错误...')
    // 清空之前的错误状态
    setTimeout(() => {
      setShowErrorComponent(true)
    }, 100)
  }

  const handleLocalError = (error: Error) => {
    setErrorMessage(`React 组件错误已捕获：${error.message}\n错误已上报到监控系统`)
  }

  const captureManualError = () => {
    try {
      const obj: any = null
      obj.doSomething()
    } catch (error: any) {
      monitor.captureError(error, {
        action: '手动捕获',
        page: 'ErrorTest',
        customData: '这是手动捕获的错误'
      })
      setErrorMessage('错误已手动捕获并上报：' + error.message)
      alert('错误已捕获并上报到监控系统')
    }
  }

  return (
    <div className="error-test">
      <div className="card">
        <h2>🐛 错误测试页面</h2>
        <p>点击下面的按钮来测试不同类型的错误捕获：</p>
        
        <div className="button-group">
          <button onClick={triggerJsError} className="btn btn-danger">
            触发 JavaScript 错误
          </button>
          <button onClick={triggerPromiseError} className="btn btn-danger">
            触发 Promise 错误
          </button>
          <button onClick={triggerResourceError} className="btn btn-danger">
            触发资源加载错误
          </button>
          <button onClick={triggerReactError} className="btn btn-danger">
            触发 React 组件错误
          </button>
          <button onClick={captureManualError} className="btn btn-warning">
            手动捕获错误
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="card">
          <h3>错误信息</h3>
          <pre>{errorMessage}</pre>
        </div>
      )}

      {showErrorComponent && (
        <LocalErrorBoundary onError={handleLocalError}>
          <ErrorComponent />
        </LocalErrorBoundary>
      )}
    </div>
  )
}

export default ErrorTest

