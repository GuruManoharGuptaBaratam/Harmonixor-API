import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/harmonixor/users": {
        target: "https://harmonixor-api-r.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
