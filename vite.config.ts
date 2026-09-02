import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // 允许 Arena 预览域名 *.e2b.app，跳过 TCB 登录后本地演示也需要预览
    allowedHosts: true,
    headers: {
      "X-Frame-Options": "ALLOWALL",
    },
  },
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
