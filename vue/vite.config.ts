import path from "node:path";
import { fileURLToPath } from "node:url";

import vue from "@vitejs/plugin-vue";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configDir = path.resolve(__dirname, "..", "frontend");

const envResult = loadEnv({ path: path.join(configDir, ".env") });
if (envResult.error) {
  loadEnv({ path: path.join(configDir, ".env.example") });
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3002,
  },
});
