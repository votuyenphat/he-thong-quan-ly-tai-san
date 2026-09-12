import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import syncPlugin from './server/syncPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), syncPlugin()],
})

