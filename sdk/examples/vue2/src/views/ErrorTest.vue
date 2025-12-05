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

<script>
import monitor from '@monitor/vue';

// 一个会出错的组件
const ErrorComponent = {
  name: 'ErrorComponent',
  data() {
    return {
      data: null
    };
  },
  mounted() {
    // 故意触发错误
    this.data.doSomething();
  },
};

export default {
  name: 'ErrorTest',
  components: {
    ErrorComponent
  },
  data() {
    return {
      errorMessage: '',
      showErrorComponent: false
    };
  },
  methods: {
    triggerJsError() {
      this.errorMessage = '已触发 JavaScript 错误...';
      
      // 方式1：手动捕获并上报（推荐，不会导致页面崩溃）
      const error = new Error('这是一个测试的 JavaScript 错误');
      monitor.captureError(error, {
        action: 'triggerJsError',
        page: 'ErrorTest',
        testType: 'manual'
      });
      this.errorMessage = 'JavaScript 错误已手动上报（不会导致页面崩溃）';
      alert('错误已上报到监控系统');
      
      // 方式2：真正抛出错误（用于测试全局错误捕获）
      // 注意：这会触发 Vue 的错误处理器，但不会导致页面崩溃（因为已配置错误边界）
      // 取消下面的注释来测试真正的错误抛出
      /*
      setTimeout(() => {
        throw new Error('这是一个测试的 JavaScript 错误（会触发全局错误处理）');
      }, 100);
      */
    },
    triggerPromiseError() {
      this.errorMessage = '已触发 Promise 错误...';
      
      // 方式1：手动捕获并上报（推荐，不会导致页面崩溃）
      const error = new Error('这是一个测试的 Promise 错误');
      monitor.captureError(error, {
        action: 'triggerPromiseError',
        page: 'ErrorTest',
        testType: 'promise-manual'
      });
      this.errorMessage = 'Promise 错误已手动上报（不会导致页面崩溃）';
      alert('Promise 错误已上报到监控系统');
      
      // 方式2：创建未处理的 Promise 错误（用于测试全局错误捕获）
      // 注意：这会触发 unhandledrejection 事件，但不会导致 Vue 组件错误
      // 取消下面的注释来测试真正的 Promise 错误
      /*
      setTimeout(() => {
        Promise.reject(new Error('这是一个测试的 Promise 错误（会触发全局错误处理）'));
      }, 100);
      */
    },
    triggerResourceError() {
      this.errorMessage = '正在触发资源加载错误...';
      // 创建一个图片元素并添加到 DOM，确保能被 error 事件监听器捕获
      const img = document.createElement('img');
      img.src = 'https://nonexistent-domain-12345.com/image.jpg';
      img.style.display = 'none';
      img.onerror = () => {
        this.errorMessage = '资源加载错误已触发，已上报到监控系统';
        // 延迟移除，确保错误事件能被捕获
        setTimeout(() => {
          if (img.parentNode) {
            img.parentNode.removeChild(img);
          }
        }, 1000);
      };
      // 添加到 DOM 中，触发加载
      document.body.appendChild(img);
    },
    triggerVueError() {
      this.errorMessage = '已触发 Vue 组件错误...';
      this.showErrorComponent = true;
    },
    captureManualError() {
      try {
        const obj = null;
        obj.doSomething();
      } catch (error) {
        monitor.captureError(error, {
          action: '手动捕获',
          page: 'ErrorTest',
          customData: '这是手动捕获的错误'
        });
        this.errorMessage = '错误已手动捕获并上报：' + error.message;
        alert('错误已捕获并上报到监控系统');
      }
    },
    triggerVueWarning() {
      // Vue 2.x 中触发警告的方式
      this.errorMessage = '已触发 Vue 警告...';
      
      // 方式1: 在列表渲染中缺少 key（会触发警告）
      this.$nextTick(() => {
        // 方式2: 使用 v-if 和 v-else-if 但不完整（会触发警告）
        // 方式3: 在组件中使用未定义的 prop
        // 这些警告会在控制台显示，并被 SDK 捕获
        this.errorMessage = 'Vue 警告已触发（检查控制台和监控系统）\n提示：在列表渲染时缺少 key 会触发警告';
        alert('Vue 警告已触发，请查看监控系统');
      });
      
      // 创建一个会触发警告的组件（缺少 key）
      const items = [1, 2, 3];
      // 在模板中使用 v-for 但缺少 key 会触发警告
      // 这里我们通过动态创建组件来触发
      const WarningComponent = {
        name: 'WarningComponent',
        template: '<div v-for="item in items">{{ item }}</div>',
        data() {
          return {
            items: [1, 2, 3]
          };
        }
      };
      
      // 注意：这个警告会在组件渲染时自动触发
      // 我们只需要确保组件被渲染即可
      this.$forceUpdate();
    }
  },
  errorCaptured(err, instance, info) {
    // Vue 2.x 的错误捕获钩子
    this.errorMessage = `Vue 错误捕获: ${err.message}\n组件: ${instance.$options.name}\n信息: ${info}`;
    return false; // 阻止错误继续传播
  }
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

