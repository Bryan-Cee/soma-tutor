import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@github/copilot-sdk", "koffi"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
