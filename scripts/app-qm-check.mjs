import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(process.cwd());
const appDir = path.join(rootDir, "app");
const indexPath = path.join(appDir, "index.html");
const appJsPath = path.join(appDir, "js", "app.r401.js");
const modulesJsPath = path.join(appDir, "js", "modules.r342.js");
const iconPath = path.join(appDir, "assets", "risk-register-icon.png");

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assertExists(filePath, label = filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Fehlende Datei: ${label}`);
  }
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    fail(`Erwarteter Inhalt fehlt in ${label}: ${needle}`);
  }
}

function stripQueryAndHash(ref) {
  return String(ref || "").split("#")[0].split("?")[0];
}

function isExternalRef(ref) {
  return /^(?:[a-z]+:)?\/\//i.test(ref)
    || ref.startsWith("data:")
    || ref.startsWith("mailto:")
    || ref.startsWith("tel:")
    || ref.startsWith("#");
}

function checkLocalReferences(html, baseDir) {
  const referencePattern = /\b(?:src|href)=["']([^"']+)["']/gi;
  const missing = [];
  const checked = [];
  for (const match of html.matchAll(referencePattern)) {
    const ref = String(match[1] || "").trim();
    if (!ref || isExternalRef(ref)) continue;
    const normalized = stripQueryAndHash(ref);
    if (!normalized || isExternalRef(normalized)) continue;
    const resolved = path.resolve(baseDir, normalized);
    checked.push(normalized);
    if (!fs.existsSync(resolved)) {
      missing.push(`${normalized} -> ${resolved}`);
    }
  }
  if (missing.length) {
    fail(`Folgende lokale Verweise aus index.html fehlen:\n- ${missing.join("\n- ")}`);
  }
  return checked;
}

function checkPngSignature(filePath) {
  const signature = fs.readFileSync(filePath);
  const expected = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (signature.length < expected.length || !signature.subarray(0, expected.length).equals(expected)) {
    fail(`Datei ist kein PNG: ${filePath}`);
  }
}

function checkSyntax(filePath) {
  execFileSync(process.execPath, ["--check", filePath], {
    cwd: rootDir,
    stdio: "pipe"
  });
}

assertExists(indexPath, "app/index.html");
assertExists(appJsPath, "app/js/app.r401.js");
assertExists(modulesJsPath, "app/js/modules.r342.js");
assertExists(iconPath, "app/assets/risk-register-icon.png");

const indexHtml = readText(indexPath);
assertIncludes(indexHtml, "<title>SMART RISK Risiko-Register</title>", "app/index.html");
assertIncludes(indexHtml, 'src="./assets/risk-register-icon.png"', "app/index.html");
if (!/src="\.\/js\/app\.r401\.js\?fresh=\d+"/.test(indexHtml)) {
  fail('Erwarteter Script-Import fehlt in app/index.html: src="./js/app.r401.js?fresh=<nummer>"');
}

checkPngSignature(iconPath);
checkLocalReferences(indexHtml, appDir);
checkSyntax(appJsPath);
checkSyntax(modulesJsPath);

const modulesJs = readText(modulesJsPath);
assertIncludes(modulesJs, 'title: "Fach-Chat"', "app/js/modules.r342.js");
assertIncludes(modulesJs, 'title: "Hilfe-Chat"', "app/js/modules.r342.js");
const outputMinHeightMatches = modulesJs.match(/outputMinHeight:\s*240/g) || [];
if (outputMinHeightMatches.length < 2) {
  fail("Die Chat-Karten sollten auf eine gemeinsame Mindesthöhe geprüft werden.");
}

process.stdout.write([
  "QM-Check bestanden.",
  `Geprüft: ${path.relative(rootDir, indexPath)}`,
  `Geprüft: ${path.relative(rootDir, appJsPath)}`,
  `Geprüft: ${path.relative(rootDir, modulesJsPath)}`,
  `Geprüft: ${path.relative(rootDir, iconPath)}`
].join("\n"));
