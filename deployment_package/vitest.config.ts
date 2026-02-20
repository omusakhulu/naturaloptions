import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/lib/**', 'src/app/api/**'],
      exclude: ['src/**/*.d.ts', 'src/__tests__/**', 'src/@core/**', 'src/@layouts/**', 'src/@menu/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@core': path.resolve(__dirname, 'src/@core'),
      '@configs': path.resolve(__dirname, 'src/configs'),
      '@layouts': path.resolve(__dirname, 'src/@layouts'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@hocs': path.resolve(__dirname, 'src/hocs'),
      '@menu': path.resolve(__dirname, 'src/@menu'),
      '@components': path.resolve(__dirname, 'src/components')
    }
  }
})
