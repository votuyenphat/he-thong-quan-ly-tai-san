import os from 'os'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import syncPlugin from './server/syncPlugin.js'

function detectLanIp() {
  const nets = os.networkInterfaces()
  const candidates = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push(net.address)
      }
    }
  }
  return candidates.find(ip => ip.startsWith('192.168.')) || candidates[0] || ''
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), syncPlugin()],
  define: {
    __APP_LAN_IP__: JSON.stringify(detectLanIp()),
  },
})
