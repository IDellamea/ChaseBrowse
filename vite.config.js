import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const TUNNEL_HOST = process.env.DEV_TUNNEL_HOST || '';
const useTunnel = !!TUNNEL_HOST;

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true, // permite escuchar en 0.0.0.0
    port: 5173,
    strictPort: true, // no intentar otro puerto
    hmr: useTunnel
      ? {
          protocol: 'wss',
          host: TUNNEL_HOST,
          port: 443,
        }
      : undefined,
  },
})
