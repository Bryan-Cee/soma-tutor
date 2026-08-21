import { mkdirSync } from "node:fs";
import { hostname, networkInterfaces } from "node:os";
import { spawnSync } from "node:child_process";

const certificateDirectory = ".certificates";
const localHostname = hostname().replace(/\.local$/i, "");
const lanAddresses = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);
const hosts = [
  "localhost",
  "127.0.0.1",
  "::1",
  localHostname,
  `${localHostname}.local`,
  ...lanAddresses,
];

mkdirSync(certificateDirectory, { recursive: true });

const result = spawnSync(
  "mkcert",
  [
    "-cert-file",
    `${certificateDirectory}/soma-local.pem`,
    "-key-file",
    `${certificateDirectory}/soma-local-key.pem`,
    ...new Set(hosts),
  ],
  { stdio: "inherit" }
);

if (result.error) {
  throw new Error(
    "mkcert is required for LAN authentication. Install it with `brew install mkcert`.",
    { cause: result.error }
  );
}

if (result.status !== 0) {
  throw new Error(`mkcert exited with status ${result.status ?? "unknown"}`);
}
