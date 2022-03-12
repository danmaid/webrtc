import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/cast', component: () => import('./views/Cast.vue') },
  { path: '/watch', component: () => import('./views/Watch.vue') },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
