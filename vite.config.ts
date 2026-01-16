import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Forces these polyfills to be included in the production bundle
      include: ['buffer', 'process', 'util', 'stream', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // Inline plugin to fix the "Client" export error
    {
      name: "fix-bittorrent-dht",
      enforce: "pre",
      resolveId(id) {
        if (id === "bittorrent-dht") return "\0virtual:bittorrent-dht";
      },
      load(id) {
        if (id === "\0virtual:bittorrent-dht") {
          return "export class Client {}; export default Client;";
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  // Optimization to prevent crashing on large libraries
  optimizeDeps: {
    include: ['webtorrent', 'readable-stream', 'process']
  }
});