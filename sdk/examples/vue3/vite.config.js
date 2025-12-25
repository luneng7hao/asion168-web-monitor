import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // 从环境变量读取 base，默认为 '/'
  const base = process.env.VITE_BASE || '/'
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@monitor': resolve(__dirname, '../../src')
      },
      extensions: ['.js', '.vue', '.json', '.ts']
    },
    build: {
      outDir: "dist",
      base: base
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    }
  };
});

