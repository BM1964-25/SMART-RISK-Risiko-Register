#!/usr/bin/env node
import http from "node:http";
import https from "node:https";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const PORT = Number(process.env.AI_PROXY_PORT || 8171);
const STATIC_ROOT = resolve(__dirname, "..", "..");
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-4-20250514";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, payload) {
  setCors(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolveBody({});
        return;
      }
      try {
        resolveBody(JSON.parse(raw));
      } catch (error) {
        rejectBody(error);
      }
    });
    req.on("error", rejectBody);
  });
}

function proxyModelsRequest(provider, apiKey) {
  const isAnthropic = provider === "anthropic";
  const targetUrl = new URL(isAnthropic ? ANTHROPIC_MODELS_URL : OPENAI_MODELS_URL);
  const headers = isAnthropic
    ? {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      }
    : {
        Authorization: `Bearer ${apiKey}`
      };

  return new Promise((resolveResponse, rejectResponse) => {
    const request = https.request(
      targetUrl,
      { method: "GET", headers },
      (providerRes) => {
        const body = [];
        providerRes.on("data", (chunk) => body.push(chunk));
        providerRes.on("end", () => {
          resolveResponse({
            statusCode: providerRes.statusCode || 500,
            headers: providerRes.headers,
            body: Buffer.concat(body).toString("utf8")
          });
        });
      }
    );
    request.on("error", rejectResponse);
    request.end();
  });
}

function proxyAnthropicMessageRequest(apiKey, system, userPrompt, model = ANTHROPIC_DEFAULT_MODEL, maxTokens = 1200) {
  const targetUrl = new URL(ANTHROPIC_MESSAGES_URL);
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system,
    messages: [
      {
        role: "user",
        content: userPrompt
      }
    ]
  });

  return new Promise((resolveResponse, rejectResponse) => {
    const request = https.request(
      targetUrl,
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body)
        }
      },
      (providerRes) => {
        const chunks = [];
        providerRes.on("data", (chunk) => chunks.push(chunk));
        providerRes.on("end", () => {
          resolveResponse({
            statusCode: providerRes.statusCode || 500,
            headers: providerRes.headers,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    request.on("error", rejectResponse);
    request.write(body);
    request.end();
  });
}

function extractAnthropicText(rawBody) {
  try {
    const payload = JSON.parse(rawBody);
    if (!payload || !Array.isArray(payload.content)) return "";
    return payload.content
      .map((block) => (block && block.type === "text" ? String(block.text || "") : ""))
      .join("")
      .trim();
  } catch (_error) {
    return "";
  }
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  if (req.url === "/") {
    setCors(res);
    res.writeHead(302, { Location: "/Risiko%20Register/app/index.html?fresh=401" });
    res.end();
    return;
  }
  if (requestPath === "/Risiko%20Register/index.html" || requestPath === "/Risiko%20Register/") {
    setCors(res);
    res.writeHead(302, { Location: "/Risiko%20Register/app/index.html?fresh=401" });
    res.end();
    return;
  }
  const safePath = decodeURIComponent(requestPath.startsWith("/") ? requestPath.slice(1) : requestPath);
  const filePath = join(STATIC_ROOT, safePath);
  readFile(filePath)
    .then((content) => {
      const type = mimeTypes[extname(filePath)] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      res.end(content);
    })
    .catch(() => {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    });
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url && req.url.startsWith("/api/ai/test")) {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    try {
      const body = await readRequestBody(req);
      const provider = body.provider === "anthropic" ? "anthropic" : "openai";
      const apiKey = String(body.apiKey || "").trim();
      if (!apiKey) {
        sendJson(res, 400, { ok: false, error: "API key missing" });
        return;
      }
      const providerResponse = await proxyModelsRequest(provider, apiKey);
      if (providerResponse.statusCode < 200 || providerResponse.statusCode >= 300) {
        sendJson(res, 502, {
          ok: false,
          error: `Provider responded with HTTP ${providerResponse.statusCode}`,
          providerStatus: providerResponse.statusCode,
          providerBody: providerResponse.body.slice(0, 400)
        });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        provider,
        rawStatus: providerResponse.statusCode
      });
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: error?.message || "Proxy error"
      });
    }
    return;
  }

  if (req.url && req.url.startsWith("/api/ai/generate")) {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    try {
      const body = await readRequestBody(req);
      const apiKey = String(body.apiKey || "").trim();
      const system = String(body.system || "").trim();
      const userPrompt = String(body.userPrompt || "").trim();
      const model = String(body.model || ANTHROPIC_DEFAULT_MODEL).trim() || ANTHROPIC_DEFAULT_MODEL;
      const maxTokens = Math.max(256, Math.min(4096, Number(body.maxTokens) || 1200));
      if (!apiKey) {
        sendJson(res, 400, { ok: false, error: "API key missing" });
        return;
      }
      if (!userPrompt) {
        sendJson(res, 400, { ok: false, error: "Prompt missing" });
        return;
      }
      const providerResponse = await proxyAnthropicMessageRequest(apiKey, system, userPrompt, model, maxTokens);
      if (providerResponse.statusCode < 200 || providerResponse.statusCode >= 300) {
        process.stderr.write(`[ai-proxy] generate failed status=${providerResponse.statusCode}\n${providerResponse.body.slice(0, 1200)}\n`);
        sendJson(res, 502, {
          ok: false,
          error: `Provider responded with HTTP ${providerResponse.statusCode}`,
          providerStatus: providerResponse.statusCode,
          providerBody: providerResponse.body.slice(0, 1200)
        });
        return;
      }
      const text = extractAnthropicText(providerResponse.body);
      if (!text) {
        sendJson(res, 502, { ok: false, error: "No text returned by provider" });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        provider: "anthropic",
        model,
        text
      });
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: error?.message || "Proxy error"
      });
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`AI proxy listening on http://127.0.0.1:${PORT}\n`);
});
