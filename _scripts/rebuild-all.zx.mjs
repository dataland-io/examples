#!/usr/bin/env zx

const repoRoot = (await $`git rev-parse --show-toplevel`).stdout.trim();

cd(repoRoot);

const entries = await fs.readdir(".");

for (const entry of entries) {
  if (entry.startsWith("_") || entry.startsWith(".")) {
    continue;
  }
  const stats = await fs.stat(entry);
  if (stats.isDirectory()) {
    console.log(`building ${entry}...`);

    cd(entry);

    const subEntries = await fs.readdir(".");
    if (subEntries.includes("package.json")) {
      await $`rm -rf dist node_modules package-lock.json`;
      await $`npm install`;
    }

    await $`dataland module build`;

    cd(repoRoot);

    console.log(`successfully built ${entry}`);
  }
}
