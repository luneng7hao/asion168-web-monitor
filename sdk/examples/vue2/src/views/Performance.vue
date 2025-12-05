<template>
  <div class="performance">
    <div class="card">
      <h2>⚡ 性能测试页面</h2>
      <p>这个页面用于测试性能监控功能。</p>
      
      <div class="metrics">
        <div class="metric-item">
          <label>页面加载时间：</label>
          <span>{{ loadTime }}ms</span>
        </div>
        <div class="metric-item">
          <label>首次内容绘制 (FCP)：</label>
          <span>{{ fcp }}ms</span>
        </div>
        <div class="metric-item">
          <label>最大内容绘制 (LCP)：</label>
          <span>{{ lcp }}ms</span>
        </div>
        <div class="metric-item">
          <label>首次输入延迟 (FID)：</label>
          <span>{{ fid }}ms</span>
        </div>
        <div class="metric-item">
          <label>累积布局偏移 (CLS)：</label>
          <span>{{ cls }}</span>
        </div>
      </div>

      <div class="button-group">
        <button @click="reloadPage" class="btn btn-primary">
          重新加载页面（测试性能）
        </button>
        <button @click="simulateHeavyTask" class="btn btn-warning">
          模拟重任务（测试性能）
        </button>
        <button @click="testFID" class="btn btn-success">
          测试 FID（点击此按钮）
        </button>
        <button @click="testCLS" class="btn btn-info">
          测试 CLS（布局偏移）
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Performance',
  data() {
    return {
      loadTime: 0,
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0
    };
  },
  mounted() {
    this.collectPerformance();
  },
  methods: {
    collectPerformance() {
      const timing = performance.timing;
      if (timing.loadEventEnd > 0) {
        this.loadTime = timing.loadEventEnd - timing.navigationStart;
      }

      // 获取 Web Vitals
      if ('PerformanceObserver' in window) {
        try {
          // FCP 和 LCP
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                this.fcp = Math.round(entry.startTime);
              }
              if (entry.entryType === 'largest-contentful-paint') {
                this.lcp = Math.round(entry.startTime);
              }
            }
          });
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
          
          // FID (首次输入延迟)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fidEntry = entries[0];
            if (fidEntry) {
              this.fid = Math.round(fidEntry.processingStart - fidEntry.startTime);
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
          
          // CLS (累积布局偏移)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                this.cls = parseFloat(clsValue.toFixed(2));
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.error('Performance observer error:', e);
        }
      }
    },
    reloadPage() {
      location.reload();
    },
    simulateHeavyTask() {
      const start = Date.now();
      // 模拟重计算
      let result = 0;
      for (let i = 0; i < 10000000; i++) {
        result += Math.sqrt(i);
      }
      const duration = Date.now() - start;
      alert(`重任务完成，耗时: ${duration}ms`);
    },
    testFID() {
      // FID 会在用户首次交互时自动测量
      // 这个按钮的点击会触发 FID 测量
      alert('FID 会在首次点击时自动测量，请查看性能指标');
    },
    testCLS() {
      // 动态改变布局来触发 CLS
      const card = document.querySelector('.card');
      if (card) {
        // 添加一个会改变布局的元素
        const testDiv = document.createElement('div');
        testDiv.style.height = '200px';
        testDiv.style.width = '100%';
        testDiv.style.background = '#f0f0f0';
        testDiv.style.marginTop = '20px';
        testDiv.textContent = '这个元素会触发布局偏移（CLS）';
        card.appendChild(testDiv);
        
        // 延迟移除，观察 CLS 变化
        setTimeout(() => {
          if (card.contains(testDiv)) {
            card.removeChild(testDiv);
          }
        }, 2000);
        
        alert('已触发布局偏移，CLS 值会更新');
      }
    }
  }
};
</script>

<style scoped>
.performance {
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

.card p {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.metrics {
  background: #f7fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-item label {
  font-weight: 500;
  color: #4a5568;
}

.metric-item span {
  color: #667eea;
  font-weight: 600;
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

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd6;
}

.btn-warning {
  background: #ed8936;
  color: white;
}

.btn-warning:hover {
  background: #dd6b20;
}

.btn-success {
  background: #48bb78;
  color: white;
}

.btn-success:hover {
  background: #38a169;
}

.btn-info {
  background: #4299e1;
  color: white;
}

.btn-info:hover {
  background: #3182ce;
}
</style>

