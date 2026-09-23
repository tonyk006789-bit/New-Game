import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)), plugins: [vue()],
  server: { host: '127.0.0.1', port: process.env.GAME_ENV==='staging'?5183:5173, strictPort: true, proxy: { '/v1': process.env.GAME_ENV==='staging'?'http://127.0.0.1:3001':'http://127.0.0.1:3000' } },
  build: { target: 'es2022' }
});
