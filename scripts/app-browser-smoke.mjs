import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const appDir = path.join(rootDir, "app");
const appIndexPath = path.join(appDir, "index.html");
const appUrlPath = "/index.html";
const browserName = String(process.argv[2] || "chromium").trim();

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8"
  }[ext] || "application/octet-stream";
}

function sendFile(res, filePath) {
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    "content-type": contentTypeFor(filePath),
    "cache-control": "no-store"
  });
  res.end(data);
}

function createServer(baseDir) {
  return http.createServer((req, res) => {
    const rawUrl = new URL(req.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(rawUrl.pathname);
    if (pathname === "/") pathname = "/index.html";
    const filePath = path.resolve(baseDir, "." + pathname);
    if (!filePath.startsWith(baseDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    sendFile(res, filePath);
  });
}

async function main() {
  const { chromium, firefox, webkit } = await import("playwright");
  const browserType = {
    chromium,
    firefox,
    webkit
  }[browserName];
  if (!browserType) {
    throw new Error(`Unbekannter Browser: ${browserName}`);
  }
  const server = createServer(appDir);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server address konnte nicht ermittelt werden.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      errors.push(`[console:${message.type()}] ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`[pageerror] ${error.message}`);
  });

  try {
    await page.goto(`${baseUrl}${appUrlPath}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    const title = await page.title();
    if (title !== "SMART RISK Risiko-Register") {
      throw new Error(`Unerwarteter Seitentitel: ${title}`);
    }

    const headerText = await page.locator("h1").innerText();
    if (!headerText.includes("SMART RISK") || !headerText.includes("Risiko-Register")) {
      throw new Error(`Headertext passt nicht: ${headerText}`);
    }

    const icon = page.locator(".header-brand-icon");
    await icon.waitFor({ state: "visible" });
    const iconBox = await icon.boundingBox();
    if (!iconBox || iconBox.width < 40 || iconBox.height < 40) {
      throw new Error("Header-Icon hat unerwartete Abmessungen.");
    }

    await page.locator('button[data-module="ai"]').click();
    await page.waitForSelector(".ai-chat-card");
    await page.getByRole("heading", { name: "Fach-Chat" }).waitFor({ state: "visible" });
    await page.getByRole("heading", { name: "Hilfe-Chat" }).waitFor({ state: "visible" });

    const cards = page.locator(".ai-chat-card");
    const cardCount = await cards.count();
    if (cardCount !== 2) {
      throw new Error(`Erwartet wurden 2 KI-Karten, gefunden: ${cardCount}`);
    }

    const boxes = await Promise.all([
      cards.nth(0).boundingBox(),
      cards.nth(1).boundingBox()
    ]);
    const heights = boxes.map((box) => Number(box?.height || 0));
    const delta = Math.abs(heights[0] - heights[1]);
    if (delta > 2) {
      throw new Error(`KI-Karten sind nicht gleich hoch genug: ${heights[0]} vs ${heights[1]}`);
    }

    if (errors.length) {
      throw new Error(`Browser meldet Fehler:\n${errors.join("\n")}`);
    }

    process.stdout.write([
      "Browser-Smoke-Test bestanden.",
      `Browser: ${browserName}`,
      `App geladen: ${baseUrl}${appUrlPath}`,
      `KI-Kartenhöhe: ${heights[0]} px`
    ].join("\n"));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(String(error?.stack || error?.message || error));
  process.exitCode = 1;
});
