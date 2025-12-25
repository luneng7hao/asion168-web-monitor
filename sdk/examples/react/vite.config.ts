import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
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
      outDir: "dist"
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

