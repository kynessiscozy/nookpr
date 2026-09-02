import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { host: true, port: 5173, allowedHosts: ["5173-ir9o52xqxayzjaumulty6.e2b.app"] },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          tcb: ["@cloudbase/js-sdk"],
        },
      },
    },
  },
});
