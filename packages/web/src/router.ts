import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('./components/HomeView.vue') },
  { path: '/cast', component: () => import('./components/CastView.vue') },
  { path: '/watch', component: () => import('./components/WatchView.vue') },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
