import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Errors from '../views/Errors.vue'
import Performance from '../views/Performance.vue'
import Behavior from '../views/Behavior.vue'
import Api from '../views/Api.vue'
import Logs from '../views/Logs.vue'

// 从环境变量读取 base，默认为 '/'
const base = import.meta.env.VITE_BASE || '/'

const router = createRouter({
  history: createWebHistory(base),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard
    },
    {
      path: '/errors',
      name: 'Errors',
      component: Errors
    },
    {
      path: '/performance',
      name: 'Performance',
      component: Performance
    },
    {
      path: '/behavior',
      name: 'Behavior',
      component: Behavior
    },
    {
      path: '/api-monitor',
      name: 'Api',
      component: Api
    },
    {
      path: '/logs',
      name: 'Logs',
      component: Logs
    }
  ]
})

export default router

