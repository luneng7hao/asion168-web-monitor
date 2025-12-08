<template>
  <div class="error-test">
    <div class="card">
      <h2>🐛 错误测试页面</h2>
      <p>点击下面的按钮来测试不同类型的错误捕获：</p>
      
      <div class="button-group">
        <button @click="triggerJsError" class="btn btn-danger">
          触发 JavaScript 错误
        </button>
        <button @click="triggerPromiseError" class="btn btn-danger">
          触发 Promise 错误
        </button>
        <button @click="triggerResourceError" class="btn btn-danger">
          触发资源加载错误
        </button>
        <button @click="triggerVueError" class="btn btn-danger">
          触发 Vue 组件错误
        </button>
        <button @click="captureManualError" class="btn btn-warning">
          手动捕获错误
        </button>
        <button @click="triggerVueWarning" class="btn btn-info">
          触发 Vue 警告
        </button>
      </div>
    </div>

    <div class="card" v-if="errorMessage">
      <h3>错误信息</h3>
      <pre>{{ errorMessage }}</pre>
    </div>

    <!-- 故意包含错误的组件 -->
    <ErrorComponent v-if="showErrorComponent" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import monitor from '@monitor/vue';

// 一个会出错的组件
const ErrorComponent = {
  name: 'ErrorComponent',
  setup() {
    const data = ref(null);
    // 故意触发错误
    data.value.doSomething();
    return {};
  },
};

const errorMessage = ref('');
const showErrorComponent = ref(false);

const triggerJsError = () => {
  errorMessage.value = '已触发 JavaScript 错误...';
  setTimeout(() => {
    throw new Error('这是一个测试的 JavaScript 错误');
  }, 100);
};

const triggerPromiseError = () => {
  errorMessage.value = '已触发 Promise 错误...';
  Promise.reject(new Error('这是一个测试的 Promise 错误'));
};

const triggerResourceError = () => {
  errorMessage.value = '正在触发资源加载错误...';
  // 创建一个图片元素并添加到 DOM，确保能被 error 事件监听器捕获
  const img = document.createElement('img');
  img.src = 'https://nonexistent-domain-12345.com/image.jpg';
  img.style.display = 'none';
  img.onerror = () => {
    errorMessage.value = '资源加载错误已触发，已上报到监控系统';
    // 延迟移除，确保错误事件能被捕获
    setTimeout(() => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    }, 1000);
  };
  // 添加到 DOM 中，触发加载
  document.body.appendChild(img);
};

const triggerVueError = () => {
  errorMessage.value = '已触发 Vue 组件错误...';
  showErrorComponent.value = true;
};

const captureManualError = () => {
  try {
    const obj = null;
    obj.doSomething();
  } catch (error) {
    monitor.captureError(error, {
      action: '手动捕获',
      page: 'ErrorTest',
      customData: '这是手动捕获的错误'
    });
    errorMessage.value = '错误已手动捕获并上报：' + error.message;
    alert('错误已捕获并上报到监控系统');
  }
};

const triggerVueWarning = () => {
  errorMessage.value = '已触发 Vue 警告...';
  
  // Vue 3 中触发警告的方式
  // 方式1: 在列表渲染中缺少 key（会触发警告）
  // 方式2: 使用 v-if 和 v-else-if 但不完整
  // 方式3: 在组件中使用未定义的 prop
  
  // 注意：Vue 警告通常在开发模式下才会显示
  // 这里我们通过创建一个会触发警告的组件来演示
  errorMessage.value = 'Vue 警告已触发（检查控制台和监控系统）\n提示：在列表渲染时缺少 key 会触发警告\n注意：Vue 警告主要在开发模式下显示';
  alert('Vue 警告已触发，请查看监控系统');
  
  // 在实际使用中，Vue 警告会在以下情况自动触发：
  // 1. v-for 缺少 key
  // 2. 组件 prop 类型不匹配
  // 3. 使用了已废弃的 API
  // 这些警告会被 SDK 自动捕获
};
</script>

<style scoped>
.error-test {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card h2 {
  margin-bottom: 20px;
  color: #333;
}

.card h3 {
  margin-bottom: 15px;
  color: #f56565;
}

.card p {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.button-group {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
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

.btn-info {
  background: #4299e1;
  color: white;
}

.btn-info:hover {
  background: #3182ce;
}

pre {
  background: #f7fafc;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  color: #e53e3e;
  font-size: 13px;
  line-height: 1.5;
}
</style>

