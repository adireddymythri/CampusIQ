import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [
        'C:/Users/nagam/OneDrive/Desktop/campusIQ',
        'C:/Users/nagam/.cursor/projects/c-Users-nagam-OneDrive-Desktop-campusIQ/assets',
      ],
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})

