/// <reference types="vitest/config" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Tauri 生产模式需要相对路径加载资源
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@animate-ui/components-buttons-theme-toggler": path.resolve(
        __dirname,
        "./src/components/animate-ui/components/buttons/theme-toggler",
      ),
      "@animate-ui/components-base-files": path.resolve(
        __dirname,
        "./src/components/animate-ui/components/radix/files",
      ),
    },
  },
  server: {
    // Tauri devUrl 需要固定端口
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:2778',
        changeOrigin: true,
      },
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  }
})
