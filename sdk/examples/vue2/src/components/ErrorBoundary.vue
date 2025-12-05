<template>
  <div>
    <div v-if="hasError" class="error-boundary">
      <div class="error-content">
        <h2>⚠️ 发生了一个错误</h2>
        <p>错误信息：{{ errorMessage }}</p>
        <button @click="resetError" class="btn btn-primary">重试</button>
        <button @click="goHome" class="btn btn-secondary">返回首页</button>
      </div>
    </div>
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script>
import monitor from '@monitor/vue';

export default {
  name: 'ErrorBoundary',
  data() {
    return {
      hasError: false,
      errorMessage: ''
    };
  },
  errorCaptured(err, instance, info) {
    // 捕获子组件的错误
    this.hasError = true;
    this.errorMessage = err.message;
    
    // 上报错误到监控系统
    monitor.captureError(err, {
      component: instance?.$options?.name,
      info: info,
      errorBoundary: true
    });
    
    // 阻止错误继续传播，避免页面崩溃
    return false;
  },
  methods: {
    resetError() {
      this.hasError = false;
      this.errorMessage = '';
    },
    goHome() {
      this.$router.push('/');
      this.resetError();
    }
  }
};
</script>

<style scoped>
.error-boundary {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px;
}

.error-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 500px;
}

.error-content h2 {
  color: #f56565;
  margin-bottom: 20px;
}

.error-content p {
  color: #666;
  margin-bottom: 30px;
  word-break: break-word;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin: 0 10px;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd6;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}
</style>

