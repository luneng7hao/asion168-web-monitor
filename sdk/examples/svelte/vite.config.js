import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [
    svelte({
      // svelte-routing 的警告是包本身的问题，不影响功能
    })
  ],
  resolve: {
    alias: {
      '@monitor/svelte': path.resolve(__dirname, '../../src/svelte.ts')
    }
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5176,
    strictPort: false, // 如果端口被占用，自动尝试下一个端口
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})

