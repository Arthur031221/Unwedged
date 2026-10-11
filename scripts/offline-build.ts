import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

async function files(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      return entry.isDirectory() ? files(root, path) : [path];
    }),
  );
  return groups.flat();
}

export function offlineBuild(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "unwedged-offline-assets",
    apply: "build",
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      const root = resolve(config.root, config.build.outDir);
      const assets = (await files(root))
        .filter((path) => path !== "sw.js" && path !== "offline-assets.json")
        .sort();
      const hash = createHash("sha256");
      for (const path of assets) {
        hash.update(path);
        hash.update(await readFile(join(root, path)));
      }
      const workerPath = join(root, "sw.js");
      const source = await readFile(workerPath, "utf8");
      hash.update(source);
      await writeFile(
        workerPath,
        source.replace("__UNWEDGED_BUILD__", hash.digest("hex").slice(0, 20)),
      );
      await writeFile(
        join(root, "offline-assets.json"),
        JSON.stringify(["./", ...assets]),
      );
    },
  };
}
