import Vue from 'vue';
import App from './App.vue';
import router from './router';
import monitor, { Vue2Plugin } from '@monitor/vue';

// 初始化监控 SDK
Vue.use(Vue2Plugin, {
  router,
  config: {
    apiUrl: 'http://localhost:3000/api',
    projectId: '001',
    userId: 'vue2-user-001',
    enableError: true,
    enablePerformance: true,
    enableBehavior: true,
    enableApi: true,
    sampleRate: 1
  }
});

Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');

