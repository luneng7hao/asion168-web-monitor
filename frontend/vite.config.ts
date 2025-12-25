import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 从环境变量读取 base，默认为 '/'
  const base = process.env.VITE_BASE || '/'
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      base: base
    },
    server: {
      port: 5173,
      proxy: {
        '/api/': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
})

