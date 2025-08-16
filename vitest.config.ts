/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  esbuild: {
    target: 'esnext'
  }
})