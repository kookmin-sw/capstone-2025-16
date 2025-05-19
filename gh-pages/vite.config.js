import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: './', // 상대 경로로 설정하여 GitHub Pages에서 정상 작동하도록 함
})