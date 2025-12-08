<script>
  import { Link, useLocation } from 'svelte-routing'
  import { onMount } from 'svelte'
  import monitor from '@monitor/svelte'

  const location = useLocation()
  
  // 使用 $ 前缀订阅 location store，确保响应式更新
  // 获取当前路径（响应式）
  $: currentPath = $location?.pathname || window.location.pathname
  
  // 监听路由变化并上报（使用专门的 trackRouteChange 方法）
  let previousPath = ''
  
  onMount(() => {
    previousPath = currentPath
  })
  
  $: {
    if (currentPath && currentPath !== previousPath && previousPath !== '') {
      monitor.trackRouteChange(
        previousPath || document.referrer,
        currentPath,
        {
          path: currentPath
        }
      )
      previousPath = currentPath
    } else if (previousPath === '') {
      previousPath = currentPath
    }
  }

  // 判断链接是否激活（响应式）
  // 对于首页，需要精确匹配，不能匹配所有路径
  $: isActiveHome = currentPath === '/' || currentPath === ''
  $: isActiveAbout = currentPath === '/about'
  $: isActiveErrorTest = currentPath === '/error-test'
  $: isActivePerformance = currentPath === '/performance'
</script>

<nav class="navbar">
  <div class="nav-container">
    <h1 class="nav-title">Svelte 监控 SDK 测试</h1>
    <div class="nav-links">
      <Link to="/" class={isActiveHome ? 'active' : ''}>首页</Link>
      <Link to="/about" class={isActiveAbout ? 'active' : ''}>关于</Link>
      <Link to="/error-test" class={isActiveErrorTest ? 'active' : ''}>错误测试</Link>
      <Link to="/performance" class={isActivePerformance ? 'active' : ''}>性能测试</Link>
    </div>
  </div>
</nav>

<style>
  .navbar {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    padding: 1rem 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-title {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
  }

  .nav-links :global(a) {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.3s;
    font-weight: 500;
  }

  .nav-links :global(a:hover) {
    background: rgba(255, 255, 255, 0.2);
  }

  .nav-links :global(a.active) {
    background: rgba(255, 255, 255, 0.3) !important;
    font-weight: 600;
  }
  
  /* 确保 active 类样式优先级更高 */
  .nav-links :global(a.active:hover) {
    background: rgba(255, 255, 255, 0.4) !important;
  }
</style>

