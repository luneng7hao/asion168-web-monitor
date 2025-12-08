import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  server: {
    port: 5177,
    open: true
  },
  resolve: {
    alias: {
      '@monitor': path.resolve(__dirname, '../../src')
    },
    extensions: ['.ts', '.js', '.json']
  },
  // 确保 Vite 能处理 TypeScript 文件
  esbuild: {
    loader: 'ts',
    include: /\.ts$/
  }
})

