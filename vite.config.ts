import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The 3D tour (three.js) is a lazy chunk loaded only when the tour plays.
    chunkSizeWarningLimit: 800,
  },
})
