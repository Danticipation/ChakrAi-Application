import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to fix MIME type issues for JavaScript files
    {
      name: 'mime-type-fix',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Store original setHeader method
          const originalSetHeader = res.setHeader;

          // Override setHeader to catch and modify MIME type
          res.setHeader = function(name, value) {
            if (name.toLowerCase() === 'content-type' && 
                (req.url?.includes('.tsx') || req.url?.includes('.ts') || req.url?.includes('.js')) &&
                value === 'text/javascript') {
              return originalSetHeader.call(this, name, 'application/javascript; charset=utf-8');
            }
            return originalSetHeader.call(this, name, value);
          };

          next();
        });
      }
    }
    // Disabled runtime error overlay to prevent loading issues
    // runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});