import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",

    https: {
      key: fs.readFileSync("./certs/dev-key.pem"),
      cert: fs.readFileSync("./certs/dev-cert.pem")
    },

    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      }
    }
  }
});