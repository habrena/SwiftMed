import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: {
  cwd: () => string
}

export default defineConfig(({ mode }) => {
  // Učitavamo ekološke varijable na osnovu toga da li je 'development' ili 'production'
  const env = loadEnv(mode, '.', '')
  

  return {
    plugins: [react()],
    build: {
      sourcemap: false,  // this is the only addition
    },
    server: {
      proxy: {
        // Proxy radi SAMO u lokalu (npm run dev)
        // Ako u .env fajlu nemaš VITE_API_TARGET, koristit će http://localhost:5000
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_API_TARGET || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  }
})
