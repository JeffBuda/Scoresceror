import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/Scoresceror/', // This should match the repository name
  plugins: [react()],
});
