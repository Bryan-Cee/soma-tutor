import type { NextConfig } from "next";
import { hostname, networkInterfaces } from "node:os";

const lanOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);

const localHostname = hostname();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...lanOrigins,
    localHostname,
    `${localHostname.replace(/\.local$/i, "")}.local`,
  ],
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
