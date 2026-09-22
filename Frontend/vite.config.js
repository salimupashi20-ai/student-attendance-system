import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig(({ command }) => {
  const isDevelopment =
    command === "serve";

  return {
    plugins: [
      react()
    ],

    server: isDevelopment
      ? {
          host: "0.0.0.0",
          port: 5173,

          https: {
            key: fs.readFileSync(
              "./certs/dev-key.pem"
            ),

            cert: fs.readFileSync(
              "./certs/dev-cert.pem"
            )
          },

          proxy: {
            "/api": {
              target:
                "http://127.0.0.1:5000",

              changeOrigin: true,

              secure: false
            }
          }
        }
      : undefined
  };
});