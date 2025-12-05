<script>
  import { onMount } from 'svelte'
  
  // 在 onMount 中抛出错误，这样更容易被全局错误处理器捕获
  onMount(() => {
    // 使用 setTimeout 确保错误在下一个事件循环中抛出
    setTimeout(() => {
      throw new Error('这是一个测试的 Svelte 组件错误')
    }, 0)
  })
</script>

