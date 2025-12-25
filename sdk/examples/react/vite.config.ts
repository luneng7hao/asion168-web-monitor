import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // 从环境变量读取 base，默认为 '/'
  // 使用 loadEnv 确保正确读取 .env.sit 文件中的环境变量
  // 第三个参数 '' 表示读取所有环境变量（包括 VITE_ 前缀）
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/'
  
  return {
    plugins: [
      react({
        include: /\.(tsx|ts|jsx|js)$/,
        jsxRuntime: 'automatic',
      })
    ],
    resolve: {
      alias: {
        '@monitor/react': path.resolve(__dirname, '../../src/react.tsx')
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    esbuild: {
      loader: 'tsx',
      include: /.*\.tsx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.ts': 'tsx',
        },
      },
      include: ['react', 'react-dom', 'react-router-dom']
    },
    build: {
      outDir: "dist",
      base: base
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
})

