import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import monitor, { Vue3Plugin } from '@monitor/vue';

// 创建 Vue 应用
const app = createApp(App);

// 初始化监控 SDK
// 从环境变量读取 apiUrl，默认为本地开发地址
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
app.use(Vue3Plugin, {
  router,
  config: {
    apiUrl: apiUrl,  // 修复：后端运行在 3000 端口
    projectId: '001',
    userId: 'vue3-user-001',
    enableError: true,
    enablePerformance: true,
    enableBehavior: true,
    enableApi: true,
    sampleRate: 1
  }
});

// 使用路由
app.use(router);

app.mount('#app');

