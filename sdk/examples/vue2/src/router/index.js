import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import ErrorTest from '../views/ErrorTest.vue';
import Performance from '../views/Performance.vue';

Vue.use(VueRouter);

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

const router = new VueRouter({
  mode: 'history',
  routes
});

export default router;

