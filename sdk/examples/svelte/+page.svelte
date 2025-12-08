<!--
  Svelte/SvelteKit 监控 SDK 使用示例
-->
<script>
  import { onMount } from 'svelte';
  import monitor, { monitorAction } from '@monitor/svelte';

  // 初始化监控
  onMount(() => {
    monitor.init({
      apiUrl: 'http://localhost:3000/api',
      projectId: 'your-project-id',
      enableError: true,
      enablePerformance: true,
      enableBehavior: true,
      enableApi: true,
      sampleRate: 1
    });

    // 设置用户ID
    monitor.setUser('user-123');
  });

  function triggerError() {
    throw new Error('测试错误');
  }

  function trackEvent() {
    monitor.track('button-click', { action: 'test' });
  }
</script>

<main>
  <h1>Svelte Monitor Demo</h1>
  
  <!-- 使用 action 监控组件 -->
  <div use:monitorAction={{ name: 'demo-component' }}>
    <button on:click={triggerError}>触发错误</button>
    <button on:click={trackEvent}>追踪事件</button>
  </div>
</main>

<!--
  ============ hooks.server.ts (SvelteKit) ============
  
  import { handleError as monitorHandleError } from '@monitor/svelte';
  
  export function handleError({ error, event }) {
    monitorHandleError({ error, event });
    return {
      message: 'Internal Error'
    };
  }
-->

