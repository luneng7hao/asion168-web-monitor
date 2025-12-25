import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import ErrorTest from '../views/ErrorTest.vue';
import Performance from '../views/Performance.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/error-test',
    name: 'ErrorTest',
    component: ErrorTest
  },
  {
    path: '/performance',
    name: 'Performance',
    component: Performance
  }
];

// 从环境变量读取 base，默认为 '/'
const base = import.meta.env.VITE_BASE || '/'

const router = createRouter({
  history: createWebHistory(base),
  routes
});

export default router;

