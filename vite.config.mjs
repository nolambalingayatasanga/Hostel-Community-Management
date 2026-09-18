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
        xfwd: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const clientIp =
              req.socket?.remoteAddress || req.connection?.remoteAddress || "";
            const existing = req.headers["x-forwarded-for"];
            const forwarded = existing ? `${existing}, ${clientIp}` : clientIp;

            if (forwarded) {
              proxyReq.setHeader("x-forwarded-for", forwarded);
            }
            if (clientIp) {
              proxyReq.setHeader("x-real-ip", clientIp);
            }
          });
        },
      },
    },
  },
});
