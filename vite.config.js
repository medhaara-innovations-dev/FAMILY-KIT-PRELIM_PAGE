import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function familyKitServiceWorker() {
  return {
    name: "familykit-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const read = (path) => readFileSync(new URL(path, import.meta.url));
      const worker = read("./src/service-worker.js");
      const assets = Object.keys(bundle)
        .filter((name) => /^assets\/.*\.(?:js|css)$/.test(name))
        .map((name) => `/${name}`)
        .sort();
      const version = createHash("sha256")
        .update(worker)
        .update(read("./public/offline.html"))
        .update(assets.join("\n"))
        .digest("hex").slice(0, 16);

      this.emitFile({
        type: "asset",
        fileName: "service-worker.js",
        source: `const CACHE = "familykit-shell-${version}";\nconst ASSETS = ${JSON.stringify(assets)};\n${worker}`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), familyKitServiceWorker()],
});
