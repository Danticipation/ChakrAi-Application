// vite.config.ts
import { defineConfig } from "vite";
import path from "node:path";

// Optional React plugin loader: tries swc → classic → none
async function loadReactPlugin() {
  try {
    const mod = await import("@vitejs/plugin-react-swc");
    const react = (mod as any).default ?? mod;
    return react();
  } catch {
    try {
      const mod = await import("@vitejs/plugin-react");
      const react = (mod as any).default ?? mod;
      return react();
    } catch {
      console.warn("[vite] React plugin not found — starting without it.");
      return undefined;
    }
  }
}

// Custom plugin to fix MIME type issues for JS/TS files
function mimeTypeFix() {
  return {
    name: "mime-type-fix",
    configureServer(server: any) {
      const originalSetHeader = server.middlewares.setHeader;
      server.middlewares.setHeader = function (name: string, value: string) {
        const req = (this as any)?.req;
        if (
          name?.toLowerCase() === "content-type" &&
          req?.url &&
          (req.url.includes(".tsx") || req.url.includes(".ts") || req.url.includes(".js")) &&
          value?.includes("text/javascript") === false
        ) {
          return originalSetHeader.call(this, name, "application/javascript; charset=utf-8");
        }
        return originalSetHeader.call(this, name, value);
      };
    },
  };
}

export default defineConfig(async () => {
  const maybeReact = await loadReactPlugin();

  return {
    plugins: [maybeReact, mimeTypeFix()].filter(Boolean),
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
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
  };
});
