import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Improve production chunking and reduce large chunk warnings
  build: {
    // increase limit to a more generous size (in kB) or adjust as needed
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          // extract package name from node_modules path (handles scoped packages)
          const parts = id.split('node_modules/')[1]?.split('/');
          if (!parts || parts.length === 0) return 'vendor';
          const pkg = parts[0].startsWith('@') && parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0];
          // group a few known large libs into named chunks
          if (pkg === 'react' || pkg === 'react-dom') return 'vendor_react';
          if (pkg === 'framer-motion') return 'vendor_framer';
          if (pkg === 'lucide-react') return 'vendor_icons';
          if (pkg === 'chart.js' || pkg === 'apexcharts') return 'vendor_charts';
          // otherwise make a small per-package vendor chunk to avoid massive combined vendor
          return `vendor_${pkg.replace('@', '').replace('/', '_')}`;
        },
      },
    },
  },
}));
