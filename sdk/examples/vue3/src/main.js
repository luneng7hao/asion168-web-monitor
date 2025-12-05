import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import monitor, { Vue3Plugin } from '@monitor/vue';

// 创建 Vue 应用
const app = createApp(App);

// 初始化监控 SDK
app.use(Vue3Plugin, {
  router,
  config: {
    apiUrl: 'http://localhost:3001/api',
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

