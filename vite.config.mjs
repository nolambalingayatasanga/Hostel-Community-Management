import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        // Forward real client IP for QR scan analytics without breaking auth rate-limit
        xfwd: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const clientIp =
              req.socket?.remoteAddress || req.connection?.remoteAddress || "";
            if (clientIp && !req.headers["x-real-ip"]) {
              proxyReq.setHeader("x-real-ip", clientIp);
            }
          });
        },
      },
    },
  },
});
