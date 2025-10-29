import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "node:path";

const configDir = path.resolve(__dirname, "..", "frontend");
const env = dotenv.config({ path: path.join(configDir, ".env") });
if (env.error) {
  dotenv.config({ path: path.join(configDir, ".env.example") });
}

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
