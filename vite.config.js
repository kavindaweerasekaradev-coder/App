import { defineConfig } from 'vite';

export default defineConfig({
  // three.js alone is ~600 kB minified; that's expected for a 3D hero.
  build: { chunkSizeWarningLimit: 800 },
});
