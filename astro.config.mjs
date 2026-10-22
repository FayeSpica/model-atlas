import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://fayespica.github.io',
  base: '/model-atlas',
  output: 'static',
  integrations: [react()],
  vite: {
    cacheDir: `node_modules/.vite/model-atlas-${process.env.NODE_ENV || 'development'}`,
    plugins: [tailwindcss()],
    resolve: { dedupe: ['react', 'react-dom'] },
    optimizeDeps: { include: ['@radix-ui/react-tooltip', 'react', 'react-dom'] },
  },
});
