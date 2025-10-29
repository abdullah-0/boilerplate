import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnvFile } from "dotenv";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configDir = path.resolve(__dirname, "..", "frontend");

const envResult = loadEnvFile({ path: path.join(configDir, ".env") });
if (envResult.error) {
  loadEnvFile({ path: path.join(configDir, ".env.example") });
}

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 3001,
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.1.0"),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
