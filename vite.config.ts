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
      protocolImports: true,
    }),
    // FIX: This manually creates the fake module so you don't need a physical file
    {
      name: "fix-bittorrent-dht",
      resolveId(id) {
        if (id === "bittorrent-dht") return "virtual:bittorrent-dht";
      },
      load(id) {
        if (id === "virtual:bittorrent-dht") {
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
});