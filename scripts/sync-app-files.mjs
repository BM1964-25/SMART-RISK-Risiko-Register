import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const sourceDir = path.join(rootDir, "platform", "js");
const targetDir = path.join(rootDir, "app", "js");
const filesToSync = ["app.r401.js", "modules.r342.js", "state.r342.js"];

fs.mkdirSync(targetDir, { recursive: true });

for (const fileName of filesToSync) {
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, fileName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Fehlende Quelldatei: ${path.relative(rootDir, sourcePath)}`);
  }
  fs.copyFileSync(sourcePath, targetPath);
}

process.stdout.write([
  "App-JS-Dateien synchronisiert.",
  ...filesToSync.map((fileName) => `- ${path.posix.join("app/js", fileName)}`)
].join("\n"));
