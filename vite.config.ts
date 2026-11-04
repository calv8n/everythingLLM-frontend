import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDevServer = command === 'serve'
  const backendTarget = 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __API_BASE_URL__: JSON.stringify(
        isDevServer ? '' : env.VITE_API_BASE_URL || 'http://129.225.68.122:8080',
      ),
    },
    server: {
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/ws': { target: backendTarget.replace(/^http/, 'ws'), ws: true },
      },
    },
  }
})
