import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, exclude: ['tests/e2e/**', 'node_modules/**'], environmentOptions: { jsdom: { url: 'http://localhost/' } }, setupFiles: ['./tests/setup.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
