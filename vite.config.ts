/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Относительная база — ассеты грузятся относительно документа, что нужно для
  // GitHub Pages (проект публикуется в подпапке /<repo>/).
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
