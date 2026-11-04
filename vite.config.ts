import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const headers = env.DEMO_TOKEN
    ? { Authorization: `Bearer ${env.DEMO_TOKEN}` }
    : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': { target: 'http://129.225.68.122:8080/', changeOrigin: true, headers },
        '/ws': { target: 'ws://129.225.68.122:8080', ws: true, headers },
      },
    },
  }
})