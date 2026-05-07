import { createStore, cloneState } from "./state.r342.js?fresh=425";
import { modules, riskCategoryOptions, normalizeRiskCategoryValue, normalizeRiskStatusValue, normalizeRiskRegisterPanelOpenStates, normalizeRiskRegisterPanelOrder, deriveRiskLikelihoodFromPercent, buildManagementReportData, buildSelectedReportData, renderRiskReportText } from "./modules.r342.js?fresh=932";

const store = createStore(cloneState());
if (typeof history !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
const CURRENT_SCHEMA_VERSION = 2;
const PROJECT_STATE_MIGRATIONS = Object.freeze({
  2: (state) => {
    const baseProject = cloneState().project;
    const project = normalizeProjectState(state?.project, baseProject);
    const reportProfile = normalizeReportProfileState(state?.reportProfile);
    return {
      ...state,
      meta: {
        ...state.meta,
        schemaVersion: 2
      },
      project,
      reportProfile
    };
  }
});
const AUTOSAVE_KEY = "project_controls_hub_autosave_v3";
const RECENT_PROJECT_FILES_KEY = "project_controls_hub_recent_project_files_v1";
const MAX_RECENT_PROJECT_FILES = 3;
const RECENT_PROJECT_FILES_DB_NAME = "project_controls_hub_recent_project_files_db_v1";
const RECENT_PROJECT_FILES_DB_STORE = "projectFiles";
const AI_SETTINGS_KEY = "project_controls_hub_ai_settings_v1";
const AI_CHAT_STATE_KEY = "project_controls_hub_ai_chats_v1";
const AI_PANEL_ORDER_KEY = "project_controls_hub_ai_panel_order_v1";
const DEFAULT_AI_PANEL_ORDER = ["aiConnectionPanel", "fachChatPanel", "hilfeChatPanel"];
const DEFAULT_AI_PROXY_BASE_URL = "http://127.0.0.1:8171";
let aiApiKeyVisible = false;
const uiDrafts = globalThis.__riskRegisterUiDrafts || (globalThis.__riskRegisterUiDrafts = {});
const aiChatDrafts = uiDrafts.aiChatDrafts || (uiDrafts.aiChatDrafts = {});
let aiWorkshopFreeTextPersistTimer = null;
let riskReportDraftPersistTimer = null;
let aiWorkshopProgressTimer = null;
let lastAutosavedAt = null;
let pendingReportDraftFocus = null;
let reportDraftSelectionRange = null;
let reportDraftBaselineHtml = "";
const reportDraftUndoStack = uiDrafts.riskReportDraftUndoStack || (uiDrafts.riskReportDraftUndoStack = []);
const reportDraftRedoStack = uiDrafts.riskReportDraftRedoStack || (uiDrafts.riskReportDraftRedoStack = []);
let suppressNextAutosave = 0;
let aiSettings = loadAiSettings();
let aiChats = loadAiChatsState();
globalThis.__riskRegisterAiChats = aiChats;
globalThis.__riskRegisterAiSettings = aiSettings;
let aiPanelOrder = loadAiPanelOrder();
globalThis.__riskRegisterAiPanelOrder = aiPanelOrder;
let aiConnectionAbortController = null;
let draggedAiPanelKey = null;
let draggedAiPanelPointerId = null;
let draggedAiPanelElement = null;
let draggedAiPanelStartX = 0;
let draggedAiPanelStartY = 0;
let draggedAiPanelPreviewOrder = null;
let draggedAiPanelPlaceholderElement = null;
let draggedAiPanelOriginalHeight = "";
let draggedAiPanelOriginalOverflow = "";
let draggedRiskPanelKey = null;
let draggedRiskPanelPointerId = null;
let draggedRiskPanelElement = null;
let draggedRiskPanelStartX = 0;
let draggedRiskPanelStartY = 0;
let draggedRiskPanelPreviewOrder = null;
let draggedRiskPanelPlaceholderElement = null;
let draggedRiskPanelOriginalHeight = "";
let draggedRiskPanelOriginalOverflow = "";
const suppressedRiskPanelCloseKeys = new Set();
let recentProjectFilesDbPromise = null;
const recentProjectPayloadCache = globalThis.__riskRegisterRecentProjectPayloadCache
  || (globalThis.__riskRegisterRecentProjectPayloadCache = new Map());

function setReportDraftBaselineHtml(value, projectName = store.getState()?.project?.name) {
  const normalized = ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(value), projectName);
  reportDraftBaselineHtml = sanitizeReportDraftMarkup(normalized);
  return reportDraftBaselineHtml;
}

function suppressRiskPanelClose(panelKey, durationMs = 1500) {
  if (!panelKey) return;
  suppressedRiskPanelCloseKeys.add(panelKey);
  window.setTimeout(() => suppressedRiskPanelCloseKeys.delete(panelKey), Math.max(250, durationMs));
}

function setRiskRegisterChartSort(sortBy, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const normalizedSortBy = sortBy === "value" ? "value" : "priority";
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      riskRegisterView: {
        ...state.ui.riskRegisterView,
        sortBy: normalizedSortBy,
        topSortBy: normalizedSortBy,
        panelOpenStates: {
          ...normalizeRiskRegisterPanelOpenStates(state.ui?.riskRegisterView?.panelOpenStates),
          chart: true
        },
        matrixSelection: null
      }
    }
  }));
  return false;
}

function setRiskRegisterChartLimit(limit, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const normalizedLimit = limit === 0 || limit === 5 || limit === 10 || limit === 20 ? limit : 5;
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      riskRegisterView: {
        ...state.ui.riskRegisterView,
        topLimit: normalizedLimit,
        panelOpenStates: {
          ...normalizeRiskRegisterPanelOpenStates(state.ui?.riskRegisterView?.panelOpenStates),
          chart: true
        },
        matrixSelection: null
      }
    }
  }));
  window.requestAnimationFrame(() => {
    const chartPanel = document.querySelector(".risk-fold-chart");
    chartPanel?.scrollIntoView?.({ block: "start", behavior: "auto" });
  });
  return false;
}

function safeJsonParse(raw, fallback = null) {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function readStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function writeStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (_error) {
    return false;
  }
}

function openRecentProjectFilesDb() {
  if (!("indexedDB" in globalThis)) return Promise.resolve(null);
  if (recentProjectFilesDbPromise) return recentProjectFilesDbPromise;
  recentProjectFilesDbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(RECENT_PROJECT_FILES_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(RECENT_PROJECT_FILES_DB_STORE)) {
          db.createObjectStore(RECENT_PROJECT_FILES_DB_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch (_error) {
      resolve(null);
    }
  }).then((db) => {
    if (!db) recentProjectFilesDbPromise = null;
    return db;
  });
  return recentProjectFilesDbPromise;
}

async function storeRecentProjectPayload(id, payload) {
  if (!id || typeof payload !== "string") return false;
  recentProjectPayloadCache.set(id, payload);
  const db = await openRecentProjectFilesDb();
  if (!db) return true;
  try {
    await new Promise((resolve) => {
      const transaction = db.transaction(RECENT_PROJECT_FILES_DB_STORE, "readwrite");
      const store = transaction.objectStore(RECENT_PROJECT_FILES_DB_STORE);
      const request = store.put({
        id,
        payload,
        savedAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
      transaction.onabort = () => resolve(false);
    });
    return true;
  } catch (_error) {
    return false;
  }
}

async function readRecentProjectPayload(id) {
  if (!id) return null;
  if (recentProjectPayloadCache.has(id)) {
    return recentProjectPayloadCache.get(id);
  }
  const db = await openRecentProjectFilesDb();
  if (!db) return null;
  try {
    const payload = await new Promise((resolve) => {
      const transaction = db.transaction(RECENT_PROJECT_FILES_DB_STORE, "readonly");
      const store = transaction.objectStore(RECENT_PROJECT_FILES_DB_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(typeof request.result?.payload === "string" ? request.result.payload : null);
      request.onerror = () => resolve(null);
      transaction.onerror = () => resolve(null);
      transaction.onabort = () => resolve(null);
    });
    if (typeof payload === "string" && payload) {
      recentProjectPayloadCache.set(id, payload);
      return payload;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

async function deleteRecentProjectPayload(id) {
  if (!id) return false;
  recentProjectPayloadCache.delete(id);
  const db = await openRecentProjectFilesDb();
  if (!db) return true;
  try {
    await new Promise((resolve) => {
      const transaction = db.transaction(RECENT_PROJECT_FILES_DB_STORE, "readwrite");
      const store = transaction.objectStore(RECENT_PROJECT_FILES_DB_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
      transaction.onabort = () => resolve(false);
    });
    return true;
  } catch (_error) {
    return false;
  }
}

function splitStreetAddress(rawValue) {
  const value = String(rawValue || "").trim().replace(/\s+/g, " ");
  const match = value.match(/^(.*\S)\s+(\d+\w*)$/);
  if (!match) return { street: value, houseNumber: "" };
  return {
    street: match[1],
    houseNumber: match[2]
  };
}

function formatTimestamp(value) {
  if (!value) return "noch nicht gespeichert";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Zeitstempel ungültig";
  return date.toLocaleString("de-DE");
}

function buildAiApiKeyPreview(value) {
  const key = String(value || "").trim();
  if (!key) return "";
  if (key.length <= 13) return key;
  return `${key.slice(0, 13)}...`;
}


function jumpToReportTarget(moduleKey, targetId) {
  if (!moduleKey || !targetId) return;
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      activeModule: moduleKey
    }
  }));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-anchor-highlight");
      window.setTimeout(() => target.classList.remove("jump-anchor-highlight"), 1600);
    });
  });
}

function jumpToRiskRegisterEditPanel(targetIndex = 0) {
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      activeModule: "riskRegister",
      riskRegisterView: {
        ...state.ui.riskRegisterView,
        editSortBy: "newest",
        panelOpenStates: {
          ...state.ui.riskRegisterView?.panelOpenStates,
          edit: true
        }
      }
    }
  }));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = document.querySelector('[data-risk-panel-key="edit"]');
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-anchor-highlight");
      window.setTimeout(() => target.classList.remove("jump-anchor-highlight"), 1600);
      window.setTimeout(() => {
        const targetField = document.getElementById(`risk_title_${targetIndex}`) || document.getElementById("risk_title_0");
        targetField?.focus?.();
      }, 250);
    });
  });
}

function jumpToAiWorkshopFreeText() {
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      activeModule: "riskRegister",
      riskRegisterView: {
        ...state.ui.riskRegisterView,
        panelOpenStates: {
          ...state.ui.riskRegisterView?.panelOpenStates,
          ai: true
        }
      },
      aiWorkshop: normalizeAiWorkshopState({
        ...state.ui.aiWorkshop,
        activeTask: "free-text-risks",
        resultTitle: "KI bereit",
        resultText: "Beschreibe das neue Risiko im Freitextfeld und lasse es von der KI ausarbeiten.",
        resultTone: "neutral"
      })
    }
  }));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = document.querySelector('[data-risk-panel-key="ai"]');
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("jump-anchor-highlight");
      window.setTimeout(() => target.classList.remove("jump-anchor-highlight"), 1600);
      window.setTimeout(() => document.getElementById("aiWorkshopFreeText")?.focus(), 250);
    });
  });
}

function closeRiskRegisterEditCard(index) {
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      riskRegisterView: {
        ...state.ui?.riskRegisterView,
        panelOpenStates: {
          ...state.ui?.riskRegisterView?.panelOpenStates,
          edit: false
        },
        editSortBy: ["newest", "id"].includes(state.ui?.riskRegisterView?.editSortBy) ? state.ui.riskRegisterView.editSortBy : "newest"
      }
    }
  }));
  requestAnimationFrame(() => {
    const card = document.querySelector(`.risk-edit-fold[data-risk-index="${index}"]`);
    card?.removeAttribute("open");
  });
}

function getNormalizedRiskArchiveStatus(risk) {
  const status = normalizeRiskStatusValue(risk?.status);
  return status === "archiviert" ? "archiviert" : "";
}

function archiveRiskRegisterItem(index) {
  const state = store.getState();
  const risk = state.riskRegister?.risks?.[index];
  if (!risk) return false;
  const currentStatus = normalizeRiskStatusValue(risk.status);
  if (currentStatus === "archiviert") return false;
  const reason = window.prompt(
    `Archivgrund für ${risk.id || "das Risiko"}:`,
    risk.archivedReason || "Nicht mehr eintretbar durch Baufortschritt"
  );
  if (reason === null) return false;
  const archivedReason = String(reason || "").trim() || "Nicht mehr eintretbar durch Baufortschritt";
  pushRiskRegisterUndoSnapshot(state);
  store.setState((current) => ({
    ...current,
    riskRegister: {
      ...current.riskRegister,
      risks: current.riskRegister.risks.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return {
          ...item,
          archivedAt: new Date().toISOString(),
          archivedReason,
          archivedFromStatus: currentStatus || "offen",
          status: "archiviert"
        };
      })
    }
  }));
  store.markSaved();
  persistAutosave(store.getState());
  updateStorageStatus(`Risiko ${risk.id} archiviert.`);
  closeRiskRegisterEditCard(index);
  focusRiskRegisterCardByIndex(index);
  return true;
}

function restoreRiskRegisterItem(index) {
  const state = store.getState();
  const risk = state.riskRegister?.risks?.[index];
  if (!risk) return false;
  if (normalizeRiskStatusValue(risk.status) !== "archiviert") return false;
  const restoreStatus = normalizeRiskStatusValue(risk.archivedFromStatus || "offen") || "offen";
  pushRiskRegisterUndoSnapshot(state);
  store.setState((current) => ({
    ...current,
    riskRegister: {
      ...current.riskRegister,
      risks: current.riskRegister.risks.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const nextItem = { ...item, status: restoreStatus };
        delete nextItem.archivedAt;
        delete nextItem.archivedReason;
        delete nextItem.archivedFromStatus;
        return nextItem;
      })
    }
  }));
  store.markSaved();
  persistAutosave(store.getState());
  updateStorageStatus(`Risiko ${risk.id} reaktiviert.`);
  closeRiskRegisterEditCard(index);
  jumpToRiskRegisterEditPanel(index);
  return true;
}

function focusRiskRegisterCardByIndex(index) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const cards = Array.from(document.querySelectorAll(".risk-edit-fold"));
      if (!cards.length) return;
      const targetCard = cards[Math.max(0, Math.min(index, cards.length - 1))];
      if (!(targetCard instanceof HTMLElement)) return;
      targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
      targetCard.classList.add("jump-anchor-highlight");
      window.setTimeout(() => targetCard.classList.remove("jump-anchor-highlight"), 1600);
    });
  });
}

function updateStorageStatus(message) {
  const target = document.getElementById("storageStatus");
  if (target) target.textContent = message;
}

function applyAiStatusAppearance(target, message) {
  if (!target) return;
  target.classList.remove("ai-status-success", "ai-status-danger", "ai-status-neutral");
  if (message === "Verbindung OK" || message === "Verbindung steht" || message === "Verbindung ok") {
    target.classList.add("ai-status-success");
  } else if (
    String(message).includes("fehlgeschlagen") ||
    String(message).includes("zu lange") ||
    String(message).includes("nicht erreichbar") ||
    String(message).includes("ungültig") ||
    String(message).includes("abgelehnt")
  ) {
    target.classList.add("ai-status-danger");
  } else {
    target.classList.add("ai-status-neutral");
  }
}

function updateAiStatus(message) {
  const target = document.getElementById("aiStatus");
  if (target) {
    target.textContent = message;
    applyAiStatusAppearance(target, message);
  }
}

function getDefaultAiSettings() {
  return {
    provider: "anthropic",
    apiKey: "",
    apiKeyPreview: "",
    proxyBaseUrl: DEFAULT_AI_PROXY_BASE_URL,
    budgetEur: 10,
    modelProfile: "balanced",
    connected: false,
    testing: false,
    lastSavedAt: null,
    lastTestAt: null,
    lastDisconnectAt: null,
    lastStatus: "Kein API-Schlüssel gespeichert."
  };
}

function normalizeAiSettings(raw = {}) {
  const provider = "anthropic";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey : "";
  return {
    ...getDefaultAiSettings(),
    provider,
    apiKey,
    apiKeyPreview: typeof raw.apiKeyPreview === "string" && raw.apiKeyPreview.trim() ? raw.apiKeyPreview.trim() : buildAiApiKeyPreview(apiKey),
    proxyBaseUrl: normalizeAiProxyBaseUrl(raw.proxyBaseUrl) || DEFAULT_AI_PROXY_BASE_URL,
    budgetEur: Number.isFinite(Number(raw.budgetEur)) ? Math.max(0, Number(raw.budgetEur)) : getDefaultAiSettings().budgetEur,
    modelProfile: "balanced",
    connected: raw.connected === true,
    testing: raw.testing === true,
    lastSavedAt: typeof raw.lastSavedAt === "string" ? raw.lastSavedAt : null,
    lastTestAt: typeof raw.lastTestAt === "string" ? raw.lastTestAt : null,
    lastDisconnectAt: typeof raw.lastDisconnectAt === "string" ? raw.lastDisconnectAt : null,
    lastStatus: typeof raw.lastStatus === "string" && raw.lastStatus.trim() ? raw.lastStatus : getDefaultAiSettings().lastStatus
  };
}

function normalizeAiPanelOpenStates(panelOpenStates) {
  const defaultOpenStates = {
    aiConnectionPanel: false,
    fachChatPanel: false,
    hilfeChatPanel: false
  };
  if (!panelOpenStates || typeof panelOpenStates !== "object") return defaultOpenStates;
  return Object.keys(defaultOpenStates).reduce((acc, key) => {
    acc[key] = panelOpenStates[key] === true;
    return acc;
  }, {});
}

function normalizeAiProxyBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, DEFAULT_AI_PROXY_BASE_URL);
    if (!/^https?:$/i.test(url.protocol)) return "";
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch (_error) {
    return "";
  }
}

function buildAiProxyUrl(pathname) {
  const proxyBaseUrl = normalizeAiProxyBaseUrl(aiSettings.proxyBaseUrl);
  const cleanPath = String(pathname || "").startsWith("/") ? String(pathname || "") : `/${String(pathname || "")}`;
  return proxyBaseUrl ? `${proxyBaseUrl}${cleanPath}` : cleanPath;
}

function loadAiSettings() {
  const raw = readStorageValue(AI_SETTINGS_KEY);
  if (!raw) return getDefaultAiSettings();
  return normalizeAiSettings(safeJsonParse(raw, {}));
}

function persistAiSettings(nextSettings) {
  aiSettings = normalizeAiSettings(nextSettings);
  globalThis.__riskRegisterAiSettings = aiSettings;
  return writeStorageValue(AI_SETTINGS_KEY, JSON.stringify(aiSettings));
}

function normalizeAiPanelOrder(panelOrder) {
  if (!Array.isArray(panelOrder)) return [...DEFAULT_AI_PANEL_ORDER];
  const normalizedIncoming = panelOrder.map((value) => String(value || "").trim()).filter(Boolean);
  const seen = new Set();
  const filtered = [];
  for (const value of normalizedIncoming) {
    if (!DEFAULT_AI_PANEL_ORDER.includes(value) || seen.has(value)) continue;
    seen.add(value);
    filtered.push(value);
  }
  const trailing = DEFAULT_AI_PANEL_ORDER.filter((value) => !seen.has(value));
  return [...filtered, ...trailing];
}

function loadAiPanelOrder() {
  const raw = readStorageValue(AI_PANEL_ORDER_KEY);
  if (!raw) return [...DEFAULT_AI_PANEL_ORDER];
  return normalizeAiPanelOrder(safeJsonParse(raw, []));
}

function persistAiPanelOrder(nextOrder) {
  aiPanelOrder = normalizeAiPanelOrder(nextOrder);
  globalThis.__riskRegisterAiPanelOrder = aiPanelOrder;
  return writeStorageValue(AI_PANEL_ORDER_KEY, JSON.stringify(aiPanelOrder));
}

function moveAiPanelRelative(list, itemValue, targetValue, placeAfter = false) {
  const items = Array.isArray(list) ? [...list] : [];
  const fromIndex = items.indexOf(itemValue);
  const targetIndex = items.indexOf(targetValue);
  if (fromIndex < 0 || targetIndex < 0 || itemValue === targetValue) return items;
  const [item] = items.splice(fromIndex, 1);
  const nextTargetIndex = items.indexOf(targetValue);
  const insertIndex = Math.max(0, placeAfter ? nextTargetIndex + 1 : nextTargetIndex);
  items.splice(insertIndex, 0, item);
  return items;
}

function sameAiPanelOrder(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function applyAiPanelOrder(order) {
  const panelOrder = normalizeAiPanelOrder(order);
  const panelRank = new Map(panelOrder.map((key, index) => [key, index]));
  const stack = document.querySelector(".ai-hub-grid");
  const panels = [...document.querySelectorAll?.(".ai-hub-grid > [data-ai-panel-key], .ai-hub-grid > [data-ai-panel-placeholder]") || []]
    .filter((panel) => panel instanceof HTMLElement);
  panels.forEach((panel) => {
    const key = panel.getAttribute("data-ai-panel-key");
    panel.style.order = String(key ? (panelRank.get(key) ?? 999) : Number(panel.style.order || 999));
  });
  if (stack instanceof HTMLElement && panels.length) {
    const orderedNodes = [...panels].sort((left, right) => {
      const leftOrder = Number(left.style.order || 999);
      const rightOrder = Number(right.style.order || 999);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return 0;
    });
    orderedNodes.forEach((node) => stack.appendChild(node));
  }
}

function clearAiDropIndicator() {
  if (draggedAiPanelPlaceholderElement instanceof HTMLElement) {
    draggedAiPanelPlaceholderElement.remove();
  }
  draggedAiPanelPlaceholderElement = null;
}

function restoreDraggedAiPanelStyles() {
  if (!(draggedAiPanelElement instanceof HTMLElement)) return;
  draggedAiPanelElement.style.pointerEvents = "";
  draggedAiPanelElement.style.position = "";
  draggedAiPanelElement.style.left = "";
  draggedAiPanelElement.style.top = "";
  draggedAiPanelElement.style.width = "";
  draggedAiPanelElement.style.margin = "";
  draggedAiPanelElement.style.zIndex = "";
  draggedAiPanelElement.style.transform = "";
  draggedAiPanelElement.style.height = draggedAiPanelOriginalHeight;
  draggedAiPanelElement.style.overflow = draggedAiPanelOriginalOverflow;
  draggedAiPanelElement.classList.remove("is-dragging");
  draggedAiPanelOriginalHeight = "";
  draggedAiPanelOriginalOverflow = "";
}

function setAiDropIndicator(_targetKey, _placeAfter, _pointerY = null) {
  const draggedKey = draggedAiPanelKey;
  const previewOrder = normalizeAiPanelOrder(draggedAiPanelPreviewOrder || aiPanelOrder);
  const placeholderOrder = Math.max(0, previewOrder.indexOf(draggedKey));
  const panel = draggedAiPanelElement;
  if (!(panel instanceof HTMLElement)) return;
  const stack = panel.closest?.(".ai-hub-grid");
  if (!(stack instanceof HTMLElement)) return;
  if (!(draggedAiPanelPlaceholderElement instanceof HTMLElement)) {
    const placeholder = document.createElement("div");
    placeholder.className = "risk-panel-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.setAttribute("data-ai-panel-placeholder", "true");
    stack.appendChild(placeholder);
    draggedAiPanelPlaceholderElement = placeholder;
  }
  const rect = panel.getBoundingClientRect();
  draggedAiPanelPlaceholderElement.style.height = `${Math.max(72, Math.round(rect.height))}px`;
  draggedAiPanelPlaceholderElement.style.order = String(placeholderOrder);
  draggedAiPanelPlaceholderElement.style.display = "block";
}

function getAiPanelsByPosition() {
  return [...document.querySelectorAll?.(".ai-hub-grid > [data-ai-panel-key]") || []]
    .filter((panel) => panel instanceof HTMLElement)
    .map((panel) => ({ panel, rect: panel.getBoundingClientRect() }))
    .filter(({ rect }) => rect && rect.width > 0 && rect.height > 0)
    .sort((a, b) => a.rect.top - b.rect.top);
}

function normalizeAiChatId(chatId) {
  return String(chatId || "").trim() === "hilfe" ? "hilfe" : "fach";
}

function normalizeAiChatMessage(message) {
  if (!message || typeof message !== "object") return null;
  const role = message.role === "assistant" ? "assistant" : "user";
  const content = String(message.content || "").trim();
  if (!content) return null;
  return {
    id: String(message.id || `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    role,
    content,
    createdAt: Number.isFinite(Number(message.createdAt)) ? Number(message.createdAt) : Date.now()
  };
}

function normalizeAiChatThread(thread = {}) {
  const source = thread && typeof thread === "object" ? thread : {};
  const messages = Array.isArray(source.messages)
    ? source.messages.map((message) => normalizeAiChatMessage(message)).filter(Boolean).slice(-30)
    : [];
  return {
    messages,
    status: typeof source.status === "string" && source.status.trim() ? source.status.trim() : "Bereit",
    busy: source.busy === true,
    error: typeof source.error === "string" && source.error.trim() ? source.error.trim() : "",
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : 0
  };
}

function normalizeAiChatsState(chats = {}) {
  const source = chats && typeof chats === "object" ? chats : {};
  return {
    fach: normalizeAiChatThread(source.fach),
    hilfe: normalizeAiChatThread(source.hilfe)
  };
}

function loadAiChatsState() {
  const raw = readStorageValue(AI_CHAT_STATE_KEY);
  if (!raw) return normalizeAiChatsState();
  return normalizeAiChatsState(safeJsonParse(raw, {}));
}

function persistAiChatsState(nextChats) {
  aiChats = normalizeAiChatsState(nextChats);
  globalThis.__riskRegisterAiChats = aiChats;
  writeStorageValue(AI_CHAT_STATE_KEY, JSON.stringify(aiChats));
  return aiChats;
}

function getAiChatThread(chatId) {
  return normalizeAiChatThread(aiChats?.[normalizeAiChatId(chatId)] || {});
}

function updateAiChatThread(chatId, updater) {
  const normalizedChatId = normalizeAiChatId(chatId);
  const currentThread = getAiChatThread(normalizedChatId);
  const nextThread = normalizeAiChatThread(typeof updater === "function" ? updater(currentThread) : updater);
  persistAiChatsState({
    ...normalizeAiChatsState(aiChats),
    [normalizedChatId]: nextThread
  });
  return nextThread;
}

function getAiChatDraft(chatId) {
  return String(aiChatDrafts[normalizeAiChatId(chatId)] ?? "");
}

function setAiChatDraft(chatId, value) {
  aiChatDrafts[normalizeAiChatId(chatId)] = String(value ?? "");
}

function clearAiChatDraft(chatId) {
  aiChatDrafts[normalizeAiChatId(chatId)] = "";
}

function appendAiChatMessage(chatId, message) {
  return updateAiChatThread(chatId, (thread) => ({
    ...thread,
    messages: [...thread.messages, normalizeAiChatMessage(message)].filter(Boolean).slice(-30),
    updatedAt: Date.now()
  }));
}

function getAiProviderLabel(provider) {
  return "Anthropic";
}

function getAiProfileLabel(profile) {
  return "Ausgewogen";
}

function normalizeAiWorkshopState(workshop = {}) {
  const activeTask = ["risk-report", "free-text-risks", "measures-residual", "question-critical-risks", "question-phase-measures", "question-register-additions", "question-missing-project-data", "question-project-summary", "question-next-checks"].includes(workshop.activeTask)
    ? workshop.activeTask
    : "risk-report";
  const rawResultText = typeof workshop.resultText === "string" && workshop.resultText.trim()
    ? workshop.resultText.trim()
    : "";
  const isQuestionTask = String(activeTask || "").startsWith("question-");
  return {
    activeTask,
    freeText: typeof workshop.freeText === "string" ? workshop.freeText : "",
    selectedRiskId: typeof workshop.selectedRiskId === "string" ? workshop.selectedRiskId : "",
    busy: workshop.busy === true,
    progressPercent: Number.isFinite(Number(workshop.progressPercent))
      ? Math.max(0, Math.min(100, Number(workshop.progressPercent)))
      : 0,
    resultTitle: typeof workshop.resultTitle === "string" && workshop.resultTitle.trim() ? workshop.resultTitle : "KI bereit",
    resultText: activeTask === "risk-report"
      ? (rawResultText ? ensureRiskReportDraftHintSection(rawResultText) : "Risikobericht ist ausgewählt. Bitte auf Bericht generieren klicken.")
      : (rawResultText || (isQuestionTask ? "Wähle eine Frage-Chip für die KI-Ausgabe." : "Wähle eine Funktion für die KI-Startstufe.")),
    resultTone: ["neutral", "success", "danger"].includes(workshop.resultTone) ? workshop.resultTone : "neutral",
    resultData: workshop.resultData && typeof workshop.resultData === "object" ? workshop.resultData : null
  };
}

function getRiskReportDraftText(state) {
  const draft = String(uiDrafts.riskReportDraft || "");
  if (uiDrafts.riskReportDraftDirty) return stripHtmlToPlainText(ensureRiskReportProjectLine(draft, state?.project?.name));
  if (state?.ui?.reportDraftCleared === true) return "";
  const stateDraft = String(state?.ui?.reportDraft || "");
  return stripHtmlToPlainText(ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(normalizeRiskReportDraftText(stateDraft || renderRiskReportText(state))), state?.project?.name));
}

function setRiskReportDraftText(value, dirty = true) {
  uiDrafts.riskReportDraft = ensureRiskReportDraftHintSection(value);
  uiDrafts.riskReportDraftDirty = dirty;
}

function ensureRiskReportDraftHintSection(value) {
  const text = normalizeRiskReportDraftText(value);
  if (!text) return "";
  if (isHtmlLikeDraft(text)) return sanitizeReportDraftMarkup(text);
  const lines = text.split("\n");
  const hintIndex = lines.findIndex((line) => /^\s*\d+\.\s*Hinweise\b/i.test(line));
  const prefix = hintIndex >= 0 ? lines.slice(0, hintIndex).join("\n").trimEnd() : text;
  return normalizeRiskReportDraftText(`${prefix}\n\n13. Hinweise\nDieser Bericht zeigt ausschließlich die im Risikoregister erfassten Risiken zum angegebenen Betrachtungszeitpunkt.\nDie Einordnung richtet sich nach Risikowert, Status und Zieltermin; weitere, außerhalb des Registers bekannte Sachverhalte sind nicht Bestandteil dieses Berichtes.`);
}

function ensureRiskReportProjectLine(value, projectName) {
  const text = normalizeRiskReportDraftText(value);
  const project = String(projectName || "").trim();
  if (!text || !project) return text;
  if (isHtmlLikeDraft(text)) return text;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  while (lines.length && !String(lines[0] || "").trim()) {
    lines.shift();
  }
  while (lines.length && /^\s*Projekt:\s*/i.test(String(lines[0] || ""))) {
    lines.shift();
  }
  return normalizeRiskReportDraftText(`Projekt: ${project}\n${lines.join("\n").trimStart()}`);
}

function stripRedundantReportLeadInLines(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  while (lines.length) {
    const first = String(lines[0] || "").trim();
    if (!first) {
      lines.shift();
      continue;
    }
    if (/^Risikobericht(?:\s+(?:für\s+)?\S.*)?$/i.test(first)) {
      lines.shift();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

function ensureReportIntroSentence(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  if (/Dieser Bericht stellt die aktuelle Risikolage des Projekts zum angegebenen Betrachtungszeitpunkt/i.test(normalized)) {
    return normalized;
  }
  const lines = normalized.split("\n");
  const reportDateIndex = lines.findIndex((line) => /^\s*Berichtsdatum:\s*/i.test(String(line || "")));
  if (reportDateIndex < 0) return normalized;
  const introLines = [
    "Dieser Bericht stellt die aktuelle Risikolage des Projekts zum angegebenen Betrachtungszeitpunkt wie folgt dar:"
  ];
  const nextLines = lines.slice(reportDateIndex + 1);
  const cleanedNextLines = nextLines.filter((line, index, array) => {
    if (index === 0 && !String(line || "").trim()) return false;
    return true;
  });
  return [
    ...lines.slice(0, reportDateIndex + 1).map((line) => String(line || "").trimEnd()),
    "",
    ...introLines,
    "",
    ...cleanedNextLines.map((line) => String(line || "").trimEnd())
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeRiskReportDraftText(value) {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  if (isHtmlLikeDraft(text)) return sanitizeReportDraftMarkup(text);
  const stripped = stripRedundantReportLeadInLines(text);
  if (!stripped) return "";
  const withIntro = ensureReportIntroSentence(stripped);
  const lines = withIntro
    .split("\n")
    .map((line) => String(line || "")
      .replace(/\*\*/g, "")
      .replace(/^\s*#+\s*/gm, "")
      .replace(/^\s*[-*+•]+\s*/, "")
      .trimEnd());
  const extractValue = (line, pattern) => {
    const match = String(line || "").trim().match(pattern);
    return match ? match[1].trim() : "";
  };
  const header = {
    projectName: "",
    projectAddress: "",
    client: "",
    projectLead: "",
    analysisDate: "",
    reportDate: "",
    intro: ""
  };
  const body = [];
  let introSeen = false;
  for (const line of lines) {
    const cleaned = String(line || "").trimEnd();
    if (!cleaned) {
      if (introSeen) body.push("");
      continue;
    }
    if (/^Risikobericht(?:\s+(?:für\s+)?\S.*)?$/i.test(cleaned)) {
      continue;
    }
    if (/^Projekt:\s*/i.test(cleaned)) {
      header.projectName = `Projekt: ${extractValue(cleaned, /^Projekt:\s*(.*)$/i)}`;
      continue;
    }
    if (/^Projektadresse:\s*/i.test(cleaned)) {
      header.projectAddress = `Projektadresse: ${extractValue(cleaned, /^Projektadresse:\s*(.*)$/i)}`;
      continue;
    }
    if (/^Auftraggeber:\s*/i.test(cleaned)) {
      header.client = `Auftraggeber: ${extractValue(cleaned, /^Auftraggeber:\s*(.*)$/i)}`;
      continue;
    }
    if (/^Projektleitung:\s*/i.test(cleaned)) {
      header.projectLead = `Projektleitung: ${extractValue(cleaned, /^Projektleitung:\s*(.*)$/i)}`;
      continue;
    }
    if (/^(Analysestichtag|Betrachtungszeitpunkt):\s*/i.test(cleaned)) {
      header.analysisDate = `Analysestichtag: ${extractValue(cleaned, /^(?:Analysestichtag|Betrachtungszeitpunkt):\s*(.*)$/i)}`;
      continue;
    }
    if (/^Berichtsdatum:\s*/i.test(cleaned)) {
      header.reportDate = `Berichtsdatum: ${extractValue(cleaned, /^Berichtsdatum:\s*(.*)$/i)}`;
      continue;
    }
    if (/^Dieser Bericht stellt die aktuelle Risikolage des Projekts zum angegebenen Betrachtungszeitpunkt/i.test(cleaned)) {
      header.intro = "Dieser Bericht stellt die aktuelle Risikolage des Projekts zum angegebenen Betrachtungszeitpunkt wie folgt dar:";
      introSeen = true;
      continue;
    }
    body.push(cleaned);
    introSeen = true;
  }
  if (header.projectName || header.projectAddress || header.client || header.projectLead || header.analysisDate || header.reportDate || header.intro) {
    const ordered = [];
    if (header.projectName) ordered.push(header.projectName);
    if (header.projectAddress) ordered.push(header.projectAddress);
    if (header.client) ordered.push(header.client);
    if (header.projectLead) ordered.push(header.projectLead);
    if (header.analysisDate) ordered.push(header.analysisDate);
    if (header.reportDate) ordered.push(header.reportDate);
    ordered.push("");
    ordered.push(header.intro || "Dieser Bericht stellt die aktuelle Risikolage des Projekts zum angegebenen Betrachtungszeitpunkt wie folgt dar:");
    ordered.push("");
    ordered.push(...body.filter((line, index) => !(index === 0 && !String(line || "").trim())));
    return ordered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  const compacted = [];
  let previousBlank = false;
  for (const line of lines) {
    const cleaned = line.trimEnd();
    if (!cleaned) {
      if (!previousBlank) compacted.push("");
      previousBlank = true;
      continue;
    }
    compacted.push(cleaned);
    previousBlank = false;
  }
  return compacted.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function sanitizeReportDraftMarkup(value) {
  if (typeof globalThis.__riskSanitizeReportDraftHtml === "function") {
    return globalThis.__riskSanitizeReportDraftHtml(value);
  }
  return stripHtmlToPlainText(value);
}

function scheduleRiskReportDraftPersist(delay = 1400) {
  if (riskReportDraftPersistTimer) {
    window.clearTimeout(riskReportDraftPersistTimer);
  }
  riskReportDraftPersistTimer = window.setTimeout(() => {
    riskReportDraftPersistTimer = null;
    persistAutosave(store.getState());
  }, delay);
}

function commitRiskReportDraft() {
  if (!uiDrafts.riskReportDraftDirty) return;
  if (riskReportDraftPersistTimer) {
    window.clearTimeout(riskReportDraftPersistTimer);
    riskReportDraftPersistTimer = null;
  }
  const nextValue = ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(uiDrafts.riskReportDraft || ""), store.getState()?.project?.name);
  const nextValuePlain = normalizeRiskReportDraftText(nextValue);
  uiDrafts.riskReportDraftDirty = false;
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      reportDraft: nextValue,
      reportDraftCleared: nextValuePlain.length === 0
    }
  }));
}

function syncRiskReportDraftFromState(state) {
  uiDrafts.riskReportDraft = ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(state?.ui?.reportDraft || ""), state?.project?.name);
  uiDrafts.riskReportDraftDirty = false;
  if (state?.ui?.reportDraftCleared === true) {
    reportDraftBaselineHtml = "";
  } else if (!reportDraftBaselineHtml) {
    setReportDraftBaselineHtml(uiDrafts.riskReportDraft || "", state?.project?.name);
  }
}

function mergeRiskReportDraftIntoState(state) {
  const current = state && typeof state === "object" ? state : {};
  const reportDraft = uiDrafts.riskReportDraftDirty
    ? ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(uiDrafts.riskReportDraft || ""), current?.project?.name)
    : ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(current?.ui?.reportDraft || ""), current?.project?.name);
  const reportDraftCleared = uiDrafts.riskReportDraftDirty
    ? reportDraft.trim().length === 0
    : current?.ui?.reportDraftCleared === true;
  return {
    ...current,
    ui: {
      ...current.ui,
      reportDraft,
      reportDraftCleared
    }
  };
}

function getAiWorkshopFreeTextDraft() {
  return String(uiDrafts.aiWorkshopFreeText || "");
}

function setAiWorkshopFreeTextDraft(value, dirty = true) {
  uiDrafts.aiWorkshopFreeText = String(value || "");
  uiDrafts.aiWorkshopFreeTextDirty = dirty;
}

function scheduleAiWorkshopFreeTextPersist(delay = 1400) {
  if (aiWorkshopFreeTextPersistTimer) {
    window.clearTimeout(aiWorkshopFreeTextPersistTimer);
  }
  aiWorkshopFreeTextPersistTimer = window.setTimeout(() => {
    aiWorkshopFreeTextPersistTimer = null;
    persistAutosave(store.getState());
  }, delay);
}

function commitAiWorkshopFreeTextDraft() {
  if (!uiDrafts.aiWorkshopFreeTextDirty) return;
  if (aiWorkshopFreeTextPersistTimer) {
    window.clearTimeout(aiWorkshopFreeTextPersistTimer);
    aiWorkshopFreeTextPersistTimer = null;
  }
  const nextValue = getAiWorkshopFreeTextDraft();
  uiDrafts.aiWorkshopFreeTextDirty = false;
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      aiWorkshop: normalizeAiWorkshopState({
        ...state.ui?.aiWorkshop,
        freeText: nextValue
      })
    }
  }));
}

function syncAiWorkshopFreeTextDraftFromState(state) {
  uiDrafts.aiWorkshopFreeText = String(state?.ui?.aiWorkshop?.freeText || "");
  uiDrafts.aiWorkshopFreeTextDirty = false;
}

function mergeAiWorkshopFreeTextDraftIntoState(state) {
  const current = state && typeof state === "object" ? state : {};
  const freeText = uiDrafts.aiWorkshopFreeTextDirty
    ? getAiWorkshopFreeTextDraft()
    : String(current?.ui?.aiWorkshop?.freeText || "");
  return {
    ...current,
    ui: {
      ...current.ui,
      aiWorkshop: normalizeAiWorkshopState({
        ...current.ui?.aiWorkshop,
        freeText
      })
    }
  };
}

function normalizeRiskRegisterUndoStack(stack) {
  if (!Array.isArray(stack)) return [];
  return stack
    .filter((entry) => Array.isArray(entry) && entry.length)
    .map((entry) => JSON.parse(JSON.stringify(entry)))
    .slice(-20);
}

function normalizeRiskRegisterRedoStack(stack) {
  if (!Array.isArray(stack)) return [];
  return stack
    .filter((entry) => Array.isArray(entry) && entry.length)
    .map((entry) => JSON.parse(JSON.stringify(entry)))
    .slice(-20);
}

function pushRiskRegisterUndoSnapshot(state) {
  const currentRisks = JSON.parse(JSON.stringify(state.riskRegister?.risks || []));
  const currentStack = normalizeRiskRegisterUndoStack(state.ui?.riskRegisterUndoStack);
  const nextStack = [...currentStack, currentRisks].slice(-20);
  store.setState((current) => ({
    ...current,
    ui: {
      ...current.ui,
      riskRegisterUndoStack: nextStack,
      riskRegisterRedoStack: []
    }
  }));
}

function applyRiskRegisterUndo() {
  const state = store.getState();
  const stack = normalizeRiskRegisterUndoStack(state.ui?.riskRegisterUndoStack);
  if (!stack.length) return false;
  const previousRisks = stack[stack.length - 1];
  const nextStack = stack.slice(0, -1);
  const currentRisks = JSON.parse(JSON.stringify(state.riskRegister?.risks || []));
  const redoStack = normalizeRiskRegisterRedoStack(state.ui?.riskRegisterRedoStack);
  const nextRedoStack = [...redoStack, currentRisks].slice(-20);
  store.setState((current) => ({
    ...current,
    riskRegister: {
      ...current.riskRegister,
      risks: JSON.parse(JSON.stringify(previousRisks))
    },
    ui: {
      ...current.ui,
      riskRegisterUndoStack: nextStack,
      riskRegisterRedoStack: nextRedoStack
    }
  }));
  return true;
}

function applyRiskRegisterRedo() {
  const state = store.getState();
  const stack = normalizeRiskRegisterRedoStack(state.ui?.riskRegisterRedoStack);
  if (!stack.length) return false;
  const nextRisks = stack[stack.length - 1];
  const nextRedoStack = stack.slice(0, -1);
  const currentRisks = JSON.parse(JSON.stringify(state.riskRegister?.risks || []));
  const undoStack = normalizeRiskRegisterUndoStack(state.ui?.riskRegisterUndoStack);
  const nextUndoStack = [...undoStack, currentRisks].slice(-20);
  store.setState((current) => ({
    ...current,
    riskRegister: {
      ...current.riskRegister,
      risks: JSON.parse(JSON.stringify(nextRisks))
    },
    ui: {
      ...current.ui,
      riskRegisterUndoStack: nextUndoStack,
      riskRegisterRedoStack: nextRedoStack
    }
  }));
  return true;
}

function getAiStatusLabel(settings = aiSettings) {
  const hasKey = String(settings.apiKey || "").trim().length > 0;
  if (settings.testing) return "Verbindung wird geprüft ...";
  if (settings.connected) return "Verbindung OK";
  if (settings.lastStatus && settings.lastStatus !== getDefaultAiSettings().lastStatus) return settings.lastStatus;
  if (!hasKey) return "Kein API-Schlüssel gespeichert.";
  return "Bereit zur Prüfung.";
}

function setSecondaryPanelVisibility(panelId, visible) {
  const panelIds = ["aiConnectionPanel"];
  panelIds.forEach((currentId) => {
    const panel = document.getElementById(currentId);
    if (!panel) return;
    const shouldShow = visible && currentId === panelId;
    panel.open = shouldShow;
  });
}

function renderAiSettingsPanel() {
  const panel = document.getElementById("aiConnectionPanel");
  const apiKeyInput = document.getElementById("aiApiKey");
  const apiKeyToggle = document.getElementById("aiApiKeyToggle");
  const budgetDisplay = document.getElementById("aiBudgetDisplay");
  const statusTarget = document.getElementById("aiStatus");
  const testButton = document.getElementById("testAiSettingsBtn");
  const disconnectButton = document.getElementById("disconnectAiSettingsBtn");
  const deleteButton = document.getElementById("deleteAiSettingsBtn");
  if (panel) {
    panel.classList.remove("ai-connected", "ai-disconnected");
    panel.classList.remove("card-neutral", "card-info", "card-warn", "card-critical", "card-success");
    panel.classList.add(aiSettings.connected ? "ai-connected" : "ai-disconnected");
    panel.classList.add(aiSettings.connected ? "card-success" : aiSettings.testing ? "card-info" : "card-warn");
  }
  if (apiKeyInput) {
    apiKeyInput.type = aiApiKeyVisible ? "text" : "password";
    const hasApiKey = String(aiSettings.apiKey || "").trim().length > 0;
    if (document.activeElement !== apiKeyInput) {
      apiKeyInput.value = aiApiKeyVisible && hasApiKey ? aiSettings.apiKey || "" : "";
    }
    apiKeyInput.placeholder = String(aiSettings.apiKeyPreview || "").trim() || "sk- ...";
  }
  if (apiKeyToggle) {
    apiKeyToggle.textContent = aiApiKeyVisible ? "🙈" : "👁";
    apiKeyToggle.setAttribute("aria-label", aiApiKeyVisible ? "Schlüssel verbergen" : "Schlüssel anzeigen");
    apiKeyToggle.setAttribute("aria-pressed", String(aiApiKeyVisible));
  }
  if (budgetDisplay) {
    const budgetValue = Number(aiSettings.budgetEur) || 0;
    const budgetText = budgetValue > 0
      ? new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0
        }).format(budgetValue)
      : "Guthaben aufgebraucht";
    budgetDisplay.textContent = budgetText;
  }
  if (statusTarget) {
    const statusText = getAiStatusLabel(aiSettings);
    statusTarget.textContent = statusText;
    applyAiStatusAppearance(statusTarget, statusText);
  }
  if (testButton) {
    testButton.textContent = aiSettings.testing ? "Verbindung wird geprüft ..." : (aiSettings.connected ? "Erneut prüfen" : "Verbindung prüfen");
    testButton.disabled = aiSettings.testing;
    testButton.classList.toggle("is-loading", aiSettings.testing);
  }
  if (disconnectButton) {
    disconnectButton.style.display = "flex";
    const hasStoredKey = Boolean(String(aiSettings.apiKey || "").trim() || String(aiSettings.apiKeyPreview || "").trim() || aiSettings.connected || aiSettings.testing);
    disconnectButton.disabled = !hasStoredKey;
  }
  if (deleteButton) {
    deleteButton.style.display = "flex";
    const hasStoredKey = Boolean(String(aiSettings.apiKey || "").trim() || String(aiSettings.apiKeyPreview || "").trim() || aiSettings.connected || aiSettings.testing);
    deleteButton.disabled = !hasStoredKey;
  }
}

function refreshAiModuleView() {
  const activeModule = String(store.getState()?.ui?.activeModule || "project");
  if (activeModule !== "ai") return;
  renderView(store.getState());
  renderAiSettingsPanel();
}

function resetAiApiKeyInput(placeholderPreview = "") {
  const apiKeyInput = document.getElementById("aiApiKey");
  if (!apiKeyInput) return;
  const freshInput = apiKeyInput.cloneNode(true);
  freshInput.value = "";
  freshInput.defaultValue = "";
  freshInput.setAttribute("value", "");
  freshInput.setAttribute("autocomplete", "new-password");
  freshInput.type = "password";
  freshInput.placeholder = String(placeholderPreview || "").trim() || "sk- ...";
  apiKeyInput.replaceWith(freshInput);
}

function readAiSettingsFromPanel() {
  const apiKey = String(document.getElementById("aiApiKey")?.value || "");
  const storedApiKey = String(aiSettings.apiKey || "");
  const effectiveApiKey = apiKey.trim() ? apiKey : storedApiKey;
  return normalizeAiSettings({
    provider: "anthropic",
    modelProfile: "balanced",
    apiKey: effectiveApiKey,
    apiKeyPreview: effectiveApiKey ? buildAiApiKeyPreview(effectiveApiKey) : aiSettings.apiKeyPreview,
    proxyBaseUrl: aiSettings.proxyBaseUrl || DEFAULT_AI_PROXY_BASE_URL,
    budgetEur: Number(aiSettings.budgetEur) || getDefaultAiSettings().budgetEur,
    connected: aiSettings.connected,
    testing: aiSettings.testing,
    lastSavedAt: aiSettings.lastSavedAt,
    lastTestAt: aiSettings.lastTestAt,
    lastDisconnectAt: aiSettings.lastDisconnectAt,
    lastStatus: aiSettings.lastStatus
  });
}

function applyAiSettings(nextAiSettings, statusMessage) {
  const saved = persistAiSettings(nextAiSettings);
  aiSettings = saved ? loadAiSettings() : normalizeAiSettings(nextAiSettings);
  if (statusMessage) updateAiStatus(statusMessage);
  renderAiSettingsPanel();
  refreshAiModuleView();
}

async function startAiConnectionTest() {
  if (aiConnectionAbortController) return;
  const nextAiSettings = readAiSettingsFromPanel();
  const snapshot = normalizeAiSettings({
    ...nextAiSettings,
    testing: true,
    connected: false,
    lastStatus: "Verbindung wird geprüft ..."
  });
  if (!String(snapshot.apiKey || "").trim()) {
    aiSettings = normalizeAiSettings({
      ...snapshot,
      testing: false,
      connected: false,
      lastStatus: "Bitte zuerst einen API-Schlüssel eingeben."
    });
    persistAiSettings(aiSettings);
    renderAiSettingsPanel();
    updateAiStatus(aiSettings.lastStatus);
    refreshAiModuleView();
    return;
  }

  aiSettings = snapshot;
  persistAiSettings(aiSettings);
  renderAiSettingsPanel();
  updateAiStatus(aiSettings.lastStatus);
  refreshAiModuleView();

  if (aiConnectionAbortController) {
    aiConnectionAbortController.abort();
  }
  aiConnectionAbortController = new AbortController();
  const connectionTimeout = window.setTimeout(() => aiConnectionAbortController?.abort(), 12000);

  try {
    const response = await fetch(buildAiProxyUrl("/api/ai/test"), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        provider: "anthropic",
        apiKey: snapshot.apiKey,
        modelProfile: "balanced"
      }),
      signal: aiConnectionAbortController.signal
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const extra = errorPayload?.providerBody ? `\n${String(errorPayload.providerBody).trim()}` : "";
      throw new Error(`${errorPayload?.error || `HTTP ${response.status}`}${extra}`);
    }

    aiSettings = normalizeAiSettings({
      ...snapshot,
      testing: false,
      connected: true,
      lastTestAt: new Date().toISOString(),
      lastSavedAt: aiSettings.lastSavedAt || new Date().toISOString(),
      lastStatus: "Verbindung OK"
    });
    persistAiSettings(aiSettings);
    renderAiSettingsPanel();
    updateAiStatus(aiSettings.lastStatus);
    refreshAiModuleView();
  } catch (error) {
    const errorMessage = String(error?.message || "");
    const message = error?.name === "AbortError"
      ? "KI-Verbindung hat zu lange gedauert."
      : errorMessage.includes("fetch")
        ? "KI-Verbindung nicht erreichbar. Schlüssel gespeichert."
        : /API key missing/i.test(errorMessage)
          ? "Bitte zuerst einen API-Schlüssel eingeben."
          : /401|403/i.test(errorMessage) || /invalid|unauthorized/i.test(errorMessage)
            ? "API-Schlüssel ungültig oder nicht freigeschaltet."
          : /Provider responded with HTTP/i.test(errorMessage)
              ? "Provider hat die Verbindung abgelehnt. Schlüssel gespeichert."
              : "KI-Verbindung fehlgeschlagen. Schlüssel gespeichert.";
    aiSettings = normalizeAiSettings({
      ...snapshot,
      testing: false,
      connected: false,
      lastStatus: message
    });
    persistAiSettings(aiSettings);
    renderAiSettingsPanel();
    updateAiStatus(message);
    refreshAiModuleView();
  } finally {
    window.clearTimeout(connectionTimeout);
    aiConnectionAbortController = null;
  }
}

function disconnectAiConnection() {
  if (aiConnectionAbortController) {
    aiConnectionAbortController.abort();
    aiConnectionAbortController = null;
  }
  aiApiKeyVisible = false;
  const currentApiKey = String(document.getElementById("aiApiKey")?.value || aiSettings.apiKey || "");
  aiSettings = normalizeAiSettings({
    ...readAiSettingsFromPanel(),
    apiKey: currentApiKey || aiSettings.apiKey || "",
    apiKeyPreview: buildAiApiKeyPreview(currentApiKey) || aiSettings.apiKeyPreview || "",
    connected: false,
    testing: false,
    lastDisconnectAt: new Date().toISOString(),
    lastStatus: "Offline geschaltet. Schlüssel bleibt gespeichert."
  });
  persistAiSettings(aiSettings);
  resetAiApiKeyInput(aiSettings.apiKeyPreview || buildAiApiKeyPreview(currentApiKey));
  renderAiSettingsPanel();
  updateAiStatus(aiSettings.lastStatus);
  refreshAiModuleView();
  document.getElementById("aiApiKey")?.blur();
  store.setState((current) => ({
    ...current,
    ui: {
      ...current.ui,
      aiWorkshop: normalizeAiWorkshopState({
        ...current.ui?.aiWorkshop,
        activeTask: "free-text-risks",
        selectedRiskId: "",
        busy: false,
        resultTitle: "KI bereit",
        resultText: "Freitext wird hier in genau ein neues Risiko übersetzt.",
        resultTone: "neutral",
        resultData: null
      })
    }
  }));
}

function deleteAiApiKey() {
  if (aiConnectionAbortController) {
    aiConnectionAbortController.abort();
    aiConnectionAbortController = null;
  }
  aiApiKeyVisible = false;
  aiSettings = normalizeAiSettings({
    ...readAiSettingsFromPanel(),
    apiKey: "",
    apiKeyPreview: "",
    connected: false,
    testing: false,
    lastDisconnectAt: new Date().toISOString(),
    lastStatus: "API-Schlüssel gelöscht."
  });
  persistAiSettings(aiSettings);
  resetAiApiKeyInput("sk- ...");
  renderAiSettingsPanel();
  updateAiStatus(aiSettings.lastStatus);
  refreshAiModuleView();
  document.getElementById("aiApiKey")?.blur();
}

function buildAiWorkshopPayload(state, task) {
  const baseReport = buildManagementReportData(state);
  const selectedReport = buildSelectedReportData({
    ...state,
    ui: {
      ...state.ui,
      reportMode: "risk"
    }
  });
  return {
    task,
    reportMode: "risk",
    project: selectedReport.project,
    report: selectedReport.report,
    reportDraft: getRiskReportDraftText(state),
    modules: selectedReport.modules,
    selectedRisk: state.riskRegister?.risks?.find((risk) => risk.id === state.ui?.aiWorkshop?.selectedRiskId) || null,
    context: {
      topline: baseReport.topline,
      timeContext: baseReport.timeContext,
      summaryCards: baseReport.summaryCards,
      focusPoints: baseReport.focusPoints,
      nextSteps: baseReport.nextSteps,
      topRisks: baseReport.topRisks,
      riskRegister: baseReport.raw?.riskRegister,
      selectedModules: selectedReport.report?.selectedModules || []
    }
  };
}

const AI_WORKSHOP_QUESTION_CONFIGS = Object.freeze({
  "question-critical-risks": {
    title: "Kritische Risiken",
    question: "Welche Risiken sind aktuell am kritischsten?",
    extraInstruction: "Priorisiere hart nach Kritikalität, Wirkung und Dringlichkeit."
  },
  "question-phase-measures": {
    title: "Maßnahmen zur Phase",
    question: "Welche Maßnahmen passen zur aktuellen Phase?",
    extraInstruction: "Nenne nur fachlich sinnvolle Maßnahmen für die aktuelle Projektphase."
  },
  "question-register-additions": {
    title: "Risikoregister ergänzen",
    question: "Was sollte ins Risikoregister ergänzt werden?",
    extraInstruction: "Nenne fehlende Risiken, Ursachen, Auswirkungen, Maßnahmen, Verantwortliche und Termine."
  },
  "question-missing-project-data": {
    title: "Fehlende Angaben",
    question: "Welche Angaben fehlen noch im Bauprojekt?",
    extraInstruction: "Nenne die fachlich relevanten Lücken nach Stammdaten, Terminen, Beteiligten, Standort und Projektstand."
  },
  "question-project-summary": {
    title: "Kurzfassung",
    question: "Fasse das Bauprojekt kurz zusammen.",
    extraInstruction: "Halte die Antwort knapp und auf maximal fünf Sätze verdichtet."
  },
  "question-next-checks": {
    title: "Nächste Prüfung",
    question: "Welche Punkte sollte ich als Nächstes prüfen?",
    extraInstruction: "Erstelle eine priorisierte Prüfliste."
  }
});

function buildAiWorkshopQuestionConfig(task) {
  return AI_WORKSHOP_QUESTION_CONFIGS[task] || AI_WORKSHOP_QUESTION_CONFIGS["question-critical-risks"];
}

function buildAiWorkshopQuestionPayload(state) {
  const baseReport = buildManagementReportData(state);
  const project = state?.project || {};
  const risks = Array.isArray(state?.riskRegister?.risks) ? state.riskRegister.risks : [];
  return {
    project: {
      name: String(project.name || ""),
      type: String(project.type || ""),
      bauart: String(project.bauart || ""),
      phase: String(project.phase || ""),
      status: String(project.status || ""),
      budget: Number(project.budget) || 0,
      location: {
        street: String(project.location?.street || ""),
        houseNumber: String(project.location?.houseNumber || ""),
        postalCode: String(project.location?.postalCode || ""),
        city: String(project.location?.city || "")
      },
      client: String(project.client || ""),
      projectLead: String(project.projectLead || "")
    },
    projectDetails: project,
    reportProfile: {
      company: String(state?.reportProfile?.company || ""),
      author: String(state?.reportProfile?.author || ""),
      clientName: String(state?.reportProfile?.clientName || ""),
      confidentiality: String(state?.reportProfile?.confidentiality || "")
    },
    reportContext: {
      topline: baseReport.topline,
      timeContext: baseReport.timeContext,
      summaryCards: baseReport.summaryCards,
      focusPoints: baseReport.focusPoints,
      nextSteps: baseReport.nextSteps,
      topRisks: baseReport.topRisks
    },
    riskRegister: {
      total: risks.length,
      items: risks.map((risk) => ({
        id: String(risk.id || ""),
        title: String(risk.title || ""),
        description: String(risk.description || ""),
        phase: String(risk.phase || ""),
        category: String(risk.category || ""),
        status: String(risk.status || ""),
        owner: String(risk.owner || ""),
        dueDate: String(risk.dueDate || ""),
        likelihood: Number(risk.likelihood) || 0,
        impact: Number(risk.impact) || 0,
        probabilityPercent: Number(risk.probabilityPercent) || 0,
        financialImpact: Number(risk.financialImpact) || 0,
        expectedDamage: Number(risk.expectedDamage) || 0,
        measures: String(risk.measures || ""),
        residualRisk: String(risk.residualRisk || "")
      }))
    }
  };
}

function buildAiWorkshopQuestionSystemPrompt(task) {
  const config = buildAiWorkshopQuestionConfig(task);
  return [
    "Du bist Senior Advisor für Projektsteuerung und Risikomanagement.",
    "Arbeite ausschließlich mit den bereitgestellten Projekt- und Risikodaten.",
    "Erfinde keine Fakten, Termine, Personen oder Maßnahmen.",
    "Wenn Angaben fehlen, benenne sie klar als Lücke.",
    "Antworte fachlich, präzise, priorisiert und managementtauglich.",
    "Keine Floskeln, keine Wiederholungen, keine langen Einleitungen.",
    "Ausgabe immer genau in 3 Blöcken: 1. Kurzfazit 2. Kritische Punkte 3. Nächste Schritte.",
    "Jeder Block darf maximal 3 Stichpunkte enthalten.",
    "Priorisiere hart nach Kritikalität, Wirkung und Dringlichkeit.",
    `Spezifisch: ${config.extraInstruction}`
  ].join(" ");
}

function buildAiWorkshopQuestionUserPrompt(state, task) {
  const config = buildAiWorkshopQuestionConfig(task);
  const payload = buildAiWorkshopQuestionPayload(state);
  return [
    `Aufgabe: ${config.question}`,
    "",
    "Kontext:",
    JSON.stringify(payload, null, 2),
    "",
    "Antworte exakt in 3 Blöcken:",
    "1. Kurzfazit",
    "2. Kritische Punkte",
    "3. Nächste Schritte",
    "",
    "Jeder Block darf maximal 3 Stichpunkte enthalten."
  ].join("\n");
}

async function runAiWorkshopQuestionTask(task) {
  const currentState = store.getState();
  const config = buildAiWorkshopQuestionConfig(task);
  const hasKey = String(aiSettings.apiKey || "").trim().length > 0;
  if (!hasKey) {
    stopAiWorkshopProgressTimer();
    setAiWorkshopState({
      ...currentState.ui?.aiWorkshop,
      activeTask: task,
      busy: false,
      progressPercent: 0,
      resultTitle: "API-Schlüssel fehlt",
      resultText: "Bitte zuerst den Anthropic API-Schlüssel speichern und die Verbindung prüfen.",
      resultTone: "danger",
      resultData: null
    });
    return;
  }

  // Schnellfragen brauchen keinen laufenden Fortschritts-Timer.
  // Ein statischer Busy-State vermeidet unnötige Re-Renders der gesamten Kachel,
  // die den geklickten Chip optisch "zittern" lassen können.
  setAiWorkshopState({
    ...currentState.ui?.aiWorkshop,
    activeTask: task,
    busy: true,
    progressPercent: 14,
    resultTitle: `${config.title} wird erzeugt ...`,
    resultText: "Die ausgewählte Frage wird gerade fachlich beantwortet.",
    resultTone: "danger",
    resultData: null
  });

  try {
    const response = await fetch(buildAiProxyUrl("/api/ai/generate"), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        apiKey: aiSettings.apiKey,
        model: "claude-sonnet-4-20250514",
        maxTokens: 1200,
        system: buildAiWorkshopQuestionSystemPrompt(task),
        userPrompt: buildAiWorkshopQuestionUserPrompt(currentState, task)
      })
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const providerSnippet = String(errorPayload?.providerBody || "").trim();
      const extra = providerSnippet ? `\n${providerSnippet.slice(0, 500)}` : "";
      throw new Error(`${errorPayload?.error || `HTTP ${response.status}`}${extra}`);
    }

    const payload = await response.json();
    const answer = String(payload?.text || "").trim() || "Die KI hat keine verwertbare Antwort zurückgegeben.";
    setAiWorkshopState({
      ...currentState.ui?.aiWorkshop,
      activeTask: task,
      busy: false,
      progressPercent: 100,
      resultTitle: config.title,
      resultText: answer,
      resultTone: "success",
      resultData: null
    });
  } catch (error) {
    setAiWorkshopState({
      ...currentState.ui?.aiWorkshop,
      activeTask: task,
      busy: false,
      progressPercent: 0,
      resultTitle: `${config.title} fehlgeschlagen`,
      resultText: String(error?.message || "Unbekannter Fehler"),
      resultTone: "danger",
      resultData: null
    });
    return;
  }
}

function buildAiWorkshopSystemPrompt(task) {
  switch (task) {
    case "risk-report":
      return [
        "Du bist ein operativer Assistent für die Erstellung eines vollständigen Risikoberichts.",
        "Schreibe auf Deutsch, klar, professionell und handlungsorientiert.",
        "Nutze ausschließlich die gelieferten Daten und den mitgelieferten Berichtsdraft.",
        "Erstelle keinen Kurztext, sondern einen gut ausformulierten Bericht mit erkennbarer Struktur.",
        "Struktur: Executive Summary, Lagebild, Risikoregister im Fokus, Kritische Risiken in Bearbeitung, Kritische offene Risiken, Erhöhte offene Risiken, Überfällige Risiken, Priorisierte Risiken, Maßnahmen, Restgefahr, Steuerungsprioritäten, Nächste Schritte, Hinweise.",
        "Nutze die exakten Abschnittsüberschriften und schreibe keine Vorrede vor dem ersten Abschnitt.",
        "Stil-Muster: Jeder Abschnitt beginnt mit einer klaren Lageaussage, nennt dann die fachliche Bedeutung und endet mit einer konkreten Konsequenz oder Empfehlung.",
        "Stil-Muster: Wenn Daten fehlen, formuliere kurz und sachlich, zum Beispiel: 'Für diesen Abschnitt liegen derzeit keine belastbaren Angaben vor; die fachliche Wirkung bleibt damit vorläufig offen.'",
        "Stil-Muster: Ein guter Absatz ist knapp, präzise und ohne Füllwörter, zum Beispiel: 'Der Schwerpunkt liegt derzeit auf den Risiken mit unmittelbarer Steuerungsrelevanz. Mehrere Maßnahmen laufen bereits, die verbleibende Unsicherheit bleibt jedoch hoch.'",
        "Arbeite priorisiert von belastbaren Fakten zu abgeleiteten Einschätzungen und dann zu konkreten Handlungsmaßnahmen.",
        "Wenn ein Abschnitt keine belastbaren Inhalte hat, sage das kurz und fachlich sauber statt zu füllen oder zu wiederholen.",
        "Formuliere wie in einem Managementbericht: präzise, konsistent, ohne Werbesprache und ohne lockere Umgangssprache.",
        "Wenn Informationen fehlen, erwähne die Lücke in sachlicher Form und nenne die fachliche Auswirkung.",
        "Vermeide Wiederholungen zwischen den Abschnitten. Jeder Abschnitt soll einen eigenen fachlichen Mehrwert haben.",
        "Bevorzuge belastbare Aussagen, klare Prioritäten und konkrete Handlungsempfehlungen gegenüber allgemeinen Formulierungen.",
        "Nutze möglichst neutrale, gut prüfbare Formulierungen und vermeide spekulative Spitzenbegriffe.",
        "Schreibe in zusammenhängender Prosa mit kurzen, abgeschlossenen Absätzen und ohne Aufzählungszeichen.",
        "Nutze keine Markdown-Zeichen wie # oder ähnliche technische Markierungen.",
        "Formuliere nicht nur Stichpunkte, sondern kurze erläuternde Absätze pro Abschnitt.",
        "Halte die Schlusskapitel sachlich und in derselben ruhigen Tonlage, aber nicht unnötig knapp.",
        "Jeder Abschnitt soll sauber abgeschlossen werden und darf nicht mitten im Satz enden.",
        "Die Abschnitte sollen inhaltlich vollständig bleiben, auch wenn der Bericht dadurch deutlich länger wird."
      ].join(" ");
    case "free-text-risks":
      return [
        "Du extrahierst aus Freitext strukturierte Risiken.",
        "Antworte ausschließlich als JSON ohne Markdown und ohne Fließtext außerhalb des JSON.",
        "Form: {\"resultType\":\"risk-suggestion\",\"items\":[{\"title\":\"\",\"description\":\"\",\"category\":\"\",\"phase\":\"\",\"owner\":\"\",\"probabilityPercent\":0,\"likelihood\":0,\"impact\":0,\"financialImpact\":0,\"measures\":\"\",\"residualRisk\":\"\"}]}",
        "Der Vorschlag soll die Werte 'Schaden in Euro', 'Eintrittswahrscheinlichkeit in %' und 'Erwarteter Schaden' untereinander darstellen.",
        "Die Eintrittswahrscheinlichkeit (1-5) und der Erwartete Schaden werden von der App abgeleitet bzw. angezeigt.",
        "Fülle title, description und measures so, dass sie unmittelbar in einem professionellen Risikoregister verwendbar sind.",
        "Verwende bei category möglichst prägnante Fachkategorien wie technisch, terminlich, kostenbezogen, vertraglich, genehmigungsbezogen, qualität, stakeholder, schnittstellenbezogen oder sonstige.",
        "Wenn owner, phase oder financialImpact nicht sicher ableitbar sind, lasse das Feld leer oder setze 0 bei Zahlenfeldern.",
        "Das Feld 'residualRisk' ist ausschließlich qualitativ zu formulieren. Keine Euro-Beträge und keine Scheingenauigkeit.",
        "Liefere genau einen Eintrag. Dieser Flow erzeugt immer genau ein neues Risiko."
      ].join(" ");
    case "measures-residual":
      return [
        "Du leitest aus den gelieferten Risiken konkrete Maßnahmen und eine plausible Restgefahr ab.",
        "Antworte ausschließlich als JSON ohne Markdown und ohne Fließtext außerhalb des JSON.",
        "Form: {\"resultType\":\"risk-measures\",\"items\":[{\"riskId\":\"\",\"measures\":\"\",\"residualRisk\":\"\",\"owner\":\"\",\"dueDate\":\"\"}]}",
        "Erzeuge genau einen Eintrag für genau ein Zielrisiko.",
        "Verwende ausschließlich das ausgewählte Zielrisiko aus dem Kontext und nenne dessen riskId im Feld riskId.",
        "Formuliere measures als konkrete, prüfbare Maßnahmen mit klaren Verben und fachlicher Zuständigkeit.",
        "Wenn owner nicht ableitbar ist, lasse das Feld leer statt zu raten.",
        "Wenn dueDate nicht belastbar ableitbar ist, lasse das Feld leer statt ein Fantasiedatum zu erzeugen.",
        "Das Feld 'residualRisk' ist ausschließlich qualitativ zu formulieren. Keine Euro-Beträge und keine Scheingenauigkeit."
      ].join(" ");
    default:
      return "Du bist ein präziser Projektassistenz für den Risikobericht. Antworte auf Deutsch, fachlich sauber und knapp.";
  }
}

function buildAiWorkshopUserPrompt(state, task) {
  const payload = buildAiWorkshopPayload(state, task);
  const freeText = String(document.getElementById("aiWorkshopFreeText")?.value || getAiWorkshopFreeTextDraft() || state.ui?.aiWorkshop?.freeText || "").trim();
  const summary = {
    projekt: payload.project,
    projektDetails: payload.projectDetails,
    bericht: {
      mode: payload.reportMode,
      selectedModules: payload.report.selectedModules,
      timeContext: payload.context.timeContext,
      topRisks: payload.context.topRisks,
      focusPoints: payload.context.focusPoints,
      nextSteps: payload.context.nextSteps,
      selectedRisk: payload.selectedRisk
    },
    berichtsdraft: payload.reportDraft
  };

  return [
    `Aufgabe: ${task}`,
    "",
    "Erstelle einen vollständigen, fachlich präzisen Berichtsdraft auf Deutsch.",
    "Nutze die folgenden Daten und den vorhandenen Draft als Grundlage.",
    "Verwende keine Aufzählungszeichen wie -, *, + oder nummerierte Listen.",
    "Antworte nur mit dem Ergebnis, ohne Meta-Erklärungen.",
    "",
    JSON.stringify(summary, null, 2),
    "",
    "Vorhandener Berichtsdraft:",
    payload.reportDraft,
    freeText ? "" : "",
    freeText ? "Freitext:" : "",
    freeText ? freeText : ""
  ].filter((part) => part !== "").join("\n");
}

function setAiWorkshopState(nextWorkshop) {
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      aiWorkshop: normalizeAiWorkshopState(nextWorkshop)
    }
  }));
}

function stopAiWorkshopProgressTimer() {
  if (aiWorkshopProgressTimer) {
    window.clearInterval(aiWorkshopProgressTimer);
    aiWorkshopProgressTimer = null;
  }
}

function startAiWorkshopProgressTimer(task) {
  stopAiWorkshopProgressTimer();
  const initialProgress = task === "risk-report" ? 12 : 18;
  setAiWorkshopState({
    ...store.getState().ui?.aiWorkshop,
    progressPercent: initialProgress
  });
  aiWorkshopProgressTimer = window.setInterval(() => {
    const current = normalizeAiWorkshopState(store.getState().ui?.aiWorkshop || {});
    if (!current.busy) {
      stopAiWorkshopProgressTimer();
      return;
    }
    const ceiling = 92;
    const currentProgress = Number(current.progressPercent) || initialProgress;
    const remaining = Math.max(0, ceiling - currentProgress);
    const step = Math.max(0.5, remaining * (task === "risk-report" ? 0.07 : 0.09));
    const nextProgress = Math.min(ceiling, currentProgress + step);
    setAiWorkshopState({
      ...current,
      activeTask: task,
      progressPercent: nextProgress
    });
  }, task === "risk-report" ? 360 : 300);
}

function parseAiWorkshopResult(text, task) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;
  try {
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    if (task === "free-text-risks" && parsed?.resultType === "risk-suggestion") return parsed;
    if (task === "measures-residual" && parsed?.resultType === "risk-measures") return parsed;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function normalizeResidualRiskText(value) {
  const text = String(value || "").trim();
  if (!text) return "Nach Maßnahmen bleibt ein qualitativ reduziertes Rest-Risiko bestehen.";
  const containsCurrency = /(?:\d[\d.\s]*,\d+|\d[\d.\s]*)\s*(?:€|EUR)\b|€|\bEUR\b/i.test(text);
  const cleaned = text
    .replace(/(?:\d[\d.\s]*,\d+|\d[\d.\s]*)\s*(?:€|EUR)\b/gi, "")
    .replace(/€|\bEUR\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
  if (containsCurrency) {
    return cleaned && cleaned.length >= 18
      ? cleaned
      : "Nach Maßnahmen bleibt ein qualitativ reduziertes Rest-Risiko bestehen.";
  }
  return cleaned || "Nach Maßnahmen bleibt ein qualitativ reduziertes Rest-Risiko bestehen.";
}

function sanitizeAiWorkshopResult(result, task) {
  if (!result || !Array.isArray(result.items)) return result;
  if (task !== "free-text-risks" && task !== "measures-residual") return result;
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      residualRisk: normalizeResidualRiskText(item?.residualRisk)
    }))
  };
}

function narrowAiWorkshopMeasuresResult(result, selectedRiskId = "") {
  if (!result || result.resultType !== "risk-measures" || !Array.isArray(result.items) || !result.items.length) return result;
  const targetId = String(selectedRiskId || "").trim().toLowerCase();
  if (!targetId) {
    return {
      ...result,
      items: [result.items[0]]
    };
  }
  const matched = result.items.find((item) => String(item?.riskId || "").trim().toLowerCase() === targetId);
  return {
    ...result,
    items: [matched || result.items[0]]
  };
}

function buildAiWorkshopFallbackResult(state, task, responseText = "") {
  const aiWorkshop = state.ui?.aiWorkshop || {};
  const freeText = String(aiWorkshop.freeText || "").trim();
  const selectedRisk = state.riskRegister?.risks?.find((risk) => String(risk.id || "") === String(aiWorkshop.selectedRiskId || "")) || null;
  const descriptionSource = [freeText, responseText].map((value) => String(value || "").trim()).find(Boolean) || "";
  if (task === "free-text-risks") {
    const titleSource = freeText.split(/\r?\n/)[0] || descriptionSource.split(/\r?\n/)[0] || "Neues Risiko";
    return {
      resultType: "risk-suggestion",
      items: [
        {
          title: String(titleSource).trim().slice(0, 120) || "Neues Risiko",
          description: descriptionSource || "Aus dem Freitext wurde ein Risikoentwurf vorbereitet.",
          category: normalizeRiskCategoryValue(riskCategoryOptions[4] || "Projekt- und Managementrisiken"),
          phase: "",
          owner: "",
          probabilityPercent: 50,
          likelihood: 3,
          impact: 3,
          financialImpact: 0,
          measures: "",
          residualRisk: normalizeResidualRiskText("")
        }
      ]
    };
  }
  if (task === "measures-residual") {
    const riskId = String(aiWorkshop.selectedRiskId || selectedRisk?.id || "").trim();
    if (!riskId) return null;
    return {
      resultType: "risk-measures",
      items: [
        {
          riskId,
          measures: descriptionSource || selectedRisk?.measures || "Maßnahmen bitte fachlich prüfen und ergänzen.",
          residualRisk: normalizeResidualRiskText(selectedRisk?.residualRisk || "Rest-Risiko bitte fachlich prüfen."),
          owner: selectedRisk?.owner || "",
          dueDate: selectedRisk?.dueDate || ""
        }
      ]
    };
  }
  return null;
}

function mapSuggestedRiskToRegisterItem(suggestion = {}, fallbackId = "") {
  const hasProbabilityPercent = suggestion.probabilityPercent !== undefined && suggestion.probabilityPercent !== null && String(suggestion.probabilityPercent).trim() !== "";
  const explicitProbabilityPercent = Number(suggestion.probabilityPercent);
  const likelihood = hasProbabilityPercent
    ? deriveRiskLikelihoodFromPercent(explicitProbabilityPercent, Number(suggestion.likelihood) || 1)
    : Math.max(1, Math.min(5, Number(suggestion.likelihood) || Number(suggestion.probability) || 1));
  const probabilityPercent = Math.max(
    0,
    Math.min(
      100,
      hasProbabilityPercent ? explicitProbabilityPercent : (Number.isFinite(likelihood) ? likelihood * 20 : 0)
    )
  );
  return {
    id: fallbackId || nextRiskRegisterId(store.getState().riskRegister.risks),
    title: String(suggestion.title || "Neues Risiko").trim() || "Neues Risiko",
    description: String(suggestion.description || "").trim(),
    phase: String(suggestion.phase || "").trim(),
    category: normalizeRiskCategoryValue(suggestion.category || riskCategoryOptions[4] || "Projekt- und Managementrisiken"),
    area: "",
    financialImpact: Math.max(0, Number(suggestion.financialImpact) || 0),
    probabilityPercent,
    expectedDamage: Math.max(0, (Number(suggestion.financialImpact) || 0) * (probabilityPercent / 100)),
    likelihood,
    impact: Math.max(1, Math.min(5, Number(suggestion.impact) || 3)),
    qualitativeRiskValue: Math.max(1, Math.min(25, likelihood * (Math.max(1, Math.min(5, Number(suggestion.impact) || 3))))),
    owner: String(suggestion.owner || "").trim(),
    measures: String(suggestion.measures || "").trim(),
    dueDate: String(suggestion.dueDate || "").trim(),
    status: "offen",
    residualRisk: normalizeResidualRiskText(suggestion.residualRisk || "")
  };
}

function updateRiskRegisterFromAiSuggestion(suggestion, mode = "append") {
  const state = store.getState();
  const items = Array.isArray(suggestion?.items) ? suggestion.items : [];
  if (!items.length) return false;
  if (mode === "append") {
    const nextRisks = items.map((entry, index) => mapSuggestedRiskToRegisterItem(entry, `R-${String(state.riskRegister.risks.length + index + 1).padStart(4, "0")}`));
    store.setState((current) => ({
      ...current,
      riskRegister: {
        ...current.riskRegister,
        risks: [...nextRisks, ...current.riskRegister.risks]
      }
    }));
    return true;
  }
  const selectedId = String(suggestion.riskId || suggestion.id || "").trim();
  if (!selectedId) return false;
  store.setState((current) => ({
    ...current,
    riskRegister: {
      ...current.riskRegister,
      risks: current.riskRegister.risks.map((risk) => risk.id === selectedId ? {
        ...risk,
        measures: String(suggestion.measures || risk.measures || ""),
        residualRisk: normalizeResidualRiskText(suggestion.residualRisk || risk.residualRisk || ""),
        owner: String(suggestion.owner || risk.owner || ""),
        dueDate: String(suggestion.dueDate || risk.dueDate || "")
      } : risk)
    }
  }));
  return true;
}

function applyAiWorkshopRisksToRegister() {
  const state = store.getState();
  const aiWorkshop = state.ui?.aiWorkshop || {};
  const suggestion = aiWorkshop.resultData || buildAiWorkshopFallbackResult(state, "free-text-risks", aiWorkshop.resultText);
  if (!suggestion?.items?.length) return false;
  pushRiskRegisterUndoSnapshot(state);
  const mappedRisk = mapSuggestedRiskToRegisterItem(suggestion.items[0], `R-${String(state.riskRegister.risks.length + 1).padStart(4, "0")}`);
  store.setState((state) => ({
    ...state,
    riskRegister: {
      ...state.riskRegister,
      risks: [mappedRisk, ...state.riskRegister.risks]
    },
    ui: {
      ...state.ui,
      activeModule: "riskRegister",
      riskRegisterView: {
        ...state.ui?.riskRegisterView,
        editSortBy: "newest",
        panelOpenStates: {
          ...state.ui?.riskRegisterView?.panelOpenStates,
          edit: true
        }
      },
      aiWorkshop: normalizeAiWorkshopState({
        ...state.ui.aiWorkshop,
        resultTitle: "Risiko übernommen",
        resultText: "1 neues Risiko wurde ins Register übernommen.",
        resultTone: "success"
      })
    }
  }));
  jumpToRiskRegisterEditPanel();
  return true;
}

function applyAiWorkshopMeasuresToRisk() {
  const state = store.getState();
  const aiWorkshop = state.ui?.aiWorkshop || {};
  const suggestion = aiWorkshop.resultData || buildAiWorkshopFallbackResult(state, "measures-residual", aiWorkshop.resultText);
  if (!suggestion?.items?.length) return false;
  const targetRiskId = String(aiWorkshop.selectedRiskId || "").trim();
  if (!targetRiskId) return false;
  const first = suggestion.items[0];
  pushRiskRegisterUndoSnapshot(state);
  store.setState((current) => ({
    ...current,
    riskRegister: {
      ...current.riskRegister,
      risks: current.riskRegister.risks.map((risk) => {
        if (risk.id !== targetRiskId) return risk;
        return {
          ...risk,
          owner: String(first.owner || risk.owner || "").trim(),
          measures: String(first.measures || risk.measures || "").trim(),
          residualRisk: String(first.residualRisk || risk.residualRisk || "").trim(),
          dueDate: String(first.dueDate || risk.dueDate || "").trim()
        };
      })
    },
    ui: {
      ...current.ui,
      aiWorkshop: normalizeAiWorkshopState({
        ...current.ui.aiWorkshop,
        resultTitle: "Maßnahmen übernommen",
        resultText: `Die KI-Vorschläge wurden in ${targetRiskId} übernommen. Bitte die Werte noch fachlich prüfen.`,
        resultTone: "success"
      })
    }
  }));
  return true;
}

function applyAiWorkshopFreeTextToRisk() {
  const state = store.getState();
  const aiWorkshop = state.ui?.aiWorkshop || {};
  const suggestion = aiWorkshop.resultData || buildAiWorkshopFallbackResult(state, "free-text-risks", aiWorkshop.resultText);
  if (!suggestion?.items?.length) return false;
  const targetRiskId = String(aiWorkshop.selectedRiskId || "").trim();
  if (!targetRiskId) return false;
  const first = suggestion.items[0];
  pushRiskRegisterUndoSnapshot(state);
  store.setState((current) => ({
    ...current,
    riskRegister: {
      ...current.riskRegister,
      risks: current.riskRegister.risks.map((risk) => {
        if (risk.id !== targetRiskId) return risk;
        const hasProbabilityPercent = first.probabilityPercent !== undefined && first.probabilityPercent !== null && String(first.probabilityPercent).trim() !== "";
        const nextLikelihood = hasProbabilityPercent
          ? deriveRiskLikelihoodFromPercent(first.probabilityPercent, first.likelihood || risk.likelihood || 1)
          : Math.max(1, Math.min(5, Number(first.likelihood) || risk.likelihood || 1));
        const nextImpact = Math.max(1, Math.min(5, Number(first.impact) || risk.impact || 3));
        const nextFinancialImpact = Math.max(0, Number(first.financialImpact) || risk.financialImpact || 0);
        const nextProbabilityPercent = hasProbabilityPercent
          ? Math.max(0, Math.min(100, Number(first.probabilityPercent)))
          : Math.max(0, Math.min(100, nextLikelihood * 20));
        return {
          ...risk,
          title: String(first.title || risk.title || "").trim(),
          description: String(first.description || risk.description || "").trim(),
          phase: String(first.phase || risk.phase || "").trim(),
          category: normalizeRiskCategoryValue(first.category || risk.category || riskCategoryOptions[4] || "Projekt- und Managementrisiken"),
          financialImpact: nextFinancialImpact,
          probabilityPercent: nextProbabilityPercent,
          expectedDamage: Math.max(0, nextFinancialImpact * (nextProbabilityPercent / 100)),
          likelihood: nextLikelihood,
          impact: nextImpact,
          qualitativeRiskValue: Math.max(1, Math.min(25, nextLikelihood * nextImpact)),
          owner: String(first.owner || risk.owner || "").trim(),
          measures: String(first.measures || risk.measures || "").trim(),
          dueDate: String(first.dueDate || risk.dueDate || "").trim(),
          residualRisk: normalizeResidualRiskText(first.residualRisk || risk.residualRisk || ""),
          status: risk.status || "offen"
        };
      })
    },
    ui: {
      ...current.ui,
      aiWorkshop: normalizeAiWorkshopState({
        ...current.ui.aiWorkshop,
        resultTitle: "Risiko übernommen",
        resultText: `Die KI-Vorschläge wurden in ${targetRiskId} übernommen. Bitte die Werte noch fachlich prüfen.`,
        resultTone: "success"
      })
    }
  }));
  return true;
}

function applyAiWorkshopSelectedResult() {
  const aiWorkshop = store.getState().ui?.aiWorkshop || {};
  if (aiWorkshop.activeTask === "measures-residual") {
    const targetRiskId = String(aiWorkshop.selectedRiskId || "").trim();
    if (!targetRiskId) return false;
    return applyAiWorkshopMeasuresToRisk();
  }
  return applyAiWorkshopRisksToRegister();
}

async function runAiWorkshopTask(task) {
  if (String(task || "").startsWith("question-")) {
    await runAiWorkshopQuestionTask(task);
    return;
  }
  const currentState = store.getState();
  const hasKey = String(aiSettings.apiKey || "").trim().length > 0;
  if (!hasKey) {
    stopAiWorkshopProgressTimer();
    setAiWorkshopState({
      ...currentState.ui?.aiWorkshop,
      activeTask: task,
      busy: false,
      progressPercent: 0,
      resultTitle: "API-Schlüssel fehlt",
      resultText: "Bitte zuerst den Anthropic API-Schlüssel speichern und die Verbindung prüfen.",
      resultTone: "danger"
    });
    return;
  }

  setAiWorkshopState({
    ...currentState.ui?.aiWorkshop,
    activeTask: task,
    selectedRiskId: task === "measures-residual" ? String(currentState.ui?.aiWorkshop?.selectedRiskId || "") : "",
    busy: true,
    progressPercent: 10,
    resultTitle: "KI verarbeitet ...",
    resultText: "Die gewählte Funktion wird gerade ausgeführt.",
    resultTone: "danger"
  });
  startAiWorkshopProgressTimer(task);

  try {
    const response = await fetch(buildAiProxyUrl("/api/ai/generate"), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        apiKey: aiSettings.apiKey,
        model: "claude-sonnet-4-20250514",
        maxTokens: task === "risk-report" ? 12000 : 1200,
        system: buildAiWorkshopSystemPrompt(task),
        userPrompt: buildAiWorkshopUserPrompt(currentState, task)
      })
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const providerSnippet = String(errorPayload?.providerBody || "").trim();
      const extra = providerSnippet ? `\n${providerSnippet.slice(0, 500)}` : "";
      throw new Error(`${errorPayload?.error || `HTTP ${response.status}`}${extra}`);
    }

    const payload = await response.json();
    const parsedResult = narrowAiWorkshopMeasuresResult(
      sanitizeAiWorkshopResult(
        parseAiWorkshopResult(payload.text, task) || ((task === "free-text-risks" || task === "measures-residual") ? buildAiWorkshopFallbackResult(currentState, task, payload.text) : null),
        task
      ),
      currentState.ui?.aiWorkshop?.selectedRiskId || ""
    );
    setAiWorkshopState({
      ...currentState.ui?.aiWorkshop,
      activeTask: task,
      selectedRiskId: task === "measures-residual" ? String(currentState.ui?.aiWorkshop?.selectedRiskId || "") : "",
      busy: false,
      progressPercent: 100,
      resultTitle: {
        "risk-report": "Berichtsvorschlag erzeugt",
        "free-text-risks": "Freitext ausgewertet",
        "measures-residual": "Maßnahmen und Rest-Risiko erzeugt"
      }[task] || "KI-Ergebnis",
      resultText: task === "risk-report"
        ? ensureRiskReportProjectLine(
            ensureRiskReportDraftHintSection(String(payload.text || "").trim() || "Die KI hat keine verwertbare Ausgabe zurückgegeben."),
            currentState?.project?.name
          )
        : String(payload.text || "").trim() || "Die KI hat keine verwertbare Ausgabe zurückgegeben.",
      resultTone: "success",
      resultData: parsedResult
    });
  } catch (error) {
    stopAiWorkshopProgressTimer();
    const fallbackResult = (task === "free-text-risks" || task === "measures-residual")
      ? narrowAiWorkshopMeasuresResult(
          sanitizeAiWorkshopResult(buildAiWorkshopFallbackResult(currentState, task, String(error?.message || "")), task),
          currentState.ui?.aiWorkshop?.selectedRiskId || ""
        )
      : null;
    setAiWorkshopState({
      ...currentState.ui?.aiWorkshop,
      activeTask: task,
      selectedRiskId: task === "measures-residual" ? String(currentState.ui?.aiWorkshop?.selectedRiskId || "") : "",
      busy: false,
      progressPercent: 0,
      resultTitle: fallbackResult ? "KI-Vorschlag vorbereitet" : "KI-Verarbeitung fehlgeschlagen",
      resultText: fallbackResult
        ? "Die KI-Ausgabe war nicht vollständig strukturiert. Ein prüfbarer Vorschlag wurde vorbereitet."
        : String(error?.message || "Unbekannter Fehler"),
      resultTone: fallbackResult ? "success" : "danger",
      resultData: fallbackResult
    });
    return;
  }
  stopAiWorkshopProgressTimer();
}

function focusAiChatDraftField(chatId) {
  window.setTimeout(() => {
    document.querySelector(`[data-ai-chat-id="${normalizeAiChatId(chatId)}"][data-ai-chat-field="draft"]`)?.focus?.();
  }, 60);
}

function getAiChatRisksSummary(state) {
  const risks = Array.isArray(state?.riskRegister?.risks) ? [...state.riskRegister.risks] : [];
  return risks
    .sort((left, right) => Number(right?.qualitativeRiskValue || 0) - Number(left?.qualitativeRiskValue || 0))
    .slice(0, 5)
    .map((risk) => ({
      id: String(risk.id || ""),
      title: String(risk.title || ""),
      status: normalizeRiskStatusValue(risk.status),
      category: String(risk.category || ""),
      phase: String(risk.phase || ""),
      owner: String(risk.owner || ""),
      dueDate: String(risk.dueDate || ""),
      measures: String(risk.measures || ""),
      residualRisk: String(risk.residualRisk || "")
    }));
}

function buildAiChatContext(state, chatId) {
  const project = state?.project || {};
  const reportProfile = state?.reportProfile || {};
  const activeModule = String(state?.ui?.activeModule || "project");
  if (normalizeAiChatId(chatId) === "hilfe") {
    return {
      activeModule,
      visibleModules: Array.isArray(state?.ui?.visibleModules) ? state.ui.visibleModules : [],
      modules: [
        { key: "project", label: "Projekt", purpose: "Stammdaten, Projektname, Standort, Beteiligte" },
        { key: "reports", label: "Berichte", purpose: "Berichtsentwurf, Berichtsbearbeitung, Export" },
        { key: "riskRegister", label: "Risikoregister", purpose: "Risiken, Maßnahmen, Prioritäten und Auswertung" },
        { key: "ai", label: "KI", purpose: "Fach-Chat und Hilfe-Chat" },
        { key: "files", label: "Dateien", purpose: "Speichern, Laden und zuletzt gespeicherte Projektstände" }
      ],
      coreFlow: [
        "Projekt füllen",
        "Bericht oder Risikoregister öffnen",
        "KI-Chat für Hilfe nutzen",
        "Projekt als JSON speichern oder laden"
      ]
    };
  }
  return {
    activeModule,
    project: {
      name: String(project.name || ""),
      type: String(project.type || ""),
      bauart: String(project.bauart || ""),
      phase: String(project.phase || ""),
      status: String(project.status || ""),
      budget: Number(project.budget) || 0,
      landArea: Number(project.landArea) || 0,
      bgf: Number(project.bgf) || 0,
      floorsAboveGround: Number(project.floorsAboveGround) || 0,
      floorsBelowGround: Number(project.floorsBelowGround) || 0,
      location: {
        street: String(project.location?.street || ""),
        houseNumber: String(project.location?.houseNumber || ""),
        postalCode: String(project.location?.postalCode || ""),
        city: String(project.location?.city || "")
      },
      client: String(project.client || ""),
      clientRoles: Array.isArray(project.clientRoles) ? project.clientRoles : [],
      clientFunctions: Array.isArray(project.clientFunctions) ? project.clientFunctions : [],
      projectLead: String(project.projectLead || "")
    },
    reportProfile: {
      company: String(reportProfile.company || ""),
      author: String(reportProfile.author || ""),
      clientName: String(reportProfile.clientName || ""),
      confidentiality: String(reportProfile.confidentiality || "")
    },
    riskRegister: {
      total: Array.isArray(state?.riskRegister?.risks) ? state.riskRegister.risks.length : 0,
      topRisks: getAiChatRisksSummary(state)
    }
  };
}

function buildAiChatSystemPrompt(chatId) {
  if (normalizeAiChatId(chatId) === "hilfe") {
    return [
      "Du bist der Hilfe-Chat dieser Anwendung.",
      "Erkläre die Bedienung der Software, Menüs, Felder, Buttons, Speicherwege und den Weg zwischen Projekt, Berichten, Risikoregister und KI.",
      "Antworte auf Deutsch, freundlich, klar und schrittweise.",
      "Nutze einen professionellen Support-Stil: zuerst die direkte Antwort, danach 2 bis 5 konkrete Schritte oder Hinweise.",
      "Gib die Antwort in dieser Reihenfolge aus: Kurzantwort, Schritte, kurzer Hinweis.",
      "Nenne Menüs, Schaltflächen und Bereiche exakt so, wie sie in der Anwendung heißen.",
      "Wenn eine Frage fachlich über die Bedienung hinausgeht, sage das kurz und verweise an den Fach-Chat.",
      "Wenn die Frage fachlich zu Bauprojekten oder Risikomanagement gehört, verweise kurz auf den Fach-Chat.",
      "Bleibe sachlich, präzise und lösungsorientiert; keine Floskeln, kein Smalltalk, keine Abschweifungen.",
      "Nutze knappe, aber vollständige Sätze. Wenn etwas unklar ist, stelle genau eine präzise Rückfrage statt zu raten.",
      "Erfinde keine Funktionen, die in der Anwendung nicht vorhanden sind."
    ].join(" ");
  }
  return [
    "Du bist der Fach-Chat für Bauprojekte und Risikomanagement.",
    "Beantworte Fragen zu Risiken, Maßnahmen, Projektphasen, Bauabläufen, Berichtsinhalten und Plausibilität.",
    "Antworte auf Deutsch, fachlich präzise und praxisnah.",
    "Nutze einen beratungsnahen Stil: zuerst die Kernaussage, dann die fachliche Einordnung und zum Schluss die empfohlenen nächsten Schritte.",
    "Gib die Antwort in dieser Reihenfolge aus: Kernaussage, fachliche Einordnung, konkrete Empfehlung.",
    "Wenn Daten fehlen oder die Lage unsicher ist, benenne die Unsicherheit klar statt zu spekulieren.",
    "Bevorzuge konkrete Formulierungen, Prioritäten und nachvollziehbare Empfehlungen statt allgemeiner Floskeln.",
    "Formuliere so, dass die Antwort unmittelbar in einem professionellen Projektkontext verwendbar ist.",
    "Nutze kurze Absätze, vermeide unnötige Wiederholungen und nenne bei Bedarf eine priorisierte To-do-Liste mit maximal drei Punkten.",
    "Nutze den gelieferten Projektkontext und die Risikosituation.",
    "Wenn die Frage nur die Bedienung der Software betrifft, verweise kurz auf den Hilfe-Chat."
  ].join(" ");
}

function buildAiChatUserPrompt(state, chatId, question) {
  const normalizedChatId = normalizeAiChatId(chatId);
  const thread = getAiChatThread(normalizedChatId);
  const recentConversation = thread.messages.slice(-8).map((message) => ({
    role: message.role,
    content: message.content
  }));
  const context = buildAiChatContext(state, normalizedChatId);
  return [
    `Chat: ${normalizedChatId}`,
    `Frage: ${String(question || "").trim()}`,
    "",
    "Antwortregeln:",
    "- Antworte direkt auf die Frage.",
    "- Nutze den Kontext, aber erfinde keine fehlenden Daten.",
    "- Wenn Angaben fehlen, nenne das klar.",
    "- Schreibe auf Deutsch und nutze nur so viel Struktur wie nötig.",
    "- Halte die Antwort knapp, aber vollständig. Keine Meta-Hinweise, keine Floskeln, keine Wiederholungen.",
    normalizedChatId === "hilfe"
      ? "- Format: Kurzantwort, dann Schritte, dann ein kurzer Hinweis."
      : "- Format: Kernaussage, dann fachliche Einordnung, dann konkrete Empfehlung.",
    "",
    "Kontext:",
    JSON.stringify(context, null, 2),
    "",
    "Bisheriger Verlauf:",
    JSON.stringify(recentConversation, null, 2)
  ].join("\n");
}

function getKnownHelpAnswer(question, state) {
  const normalized = String(question || "").trim().toLowerCase();
  const matches = (...parts) => parts.every((part) => normalized.includes(part));
  const baseUrl = "https://docs.anthropic.com/en/docs/about-claude/pricing";
  const projectName = String(state?.project?.name || "diese App").trim();
  if (matches("wie", "speichere", "projekt", "dauerhaft")) {
    return [
      "Projekt dauerhaft speichern",
      "1. Öffne den Bereich „Dateien“ im Projekt.",
      "2. Prüfe oder ergänze den vorgeschlagenen Dateinamen.",
      "3. Klicke auf „Projektdatei speichern (.json)“. Die App legt die JSON-Datei im Downloads-Ordner ab und merkt sich den Stand zusätzlich im Browser.",
      "",
      "Empfehlung",
      "Verwende für die sichere Ablage immer die gespeicherte JSON-Datei. Der Browser-Verlauf ist praktisch, aber an Gerät und Browserprofil gebunden."
    ].join("\n");
  }
  if (matches("wie", "lade", "json-datei") || matches("wie", "lade", "json")) {
    return [
      "JSON-Datei laden",
      "1. Öffne den Bereich „Dateien“ im Projekt.",
      "2. Klicke auf „Projektdatei laden (.json)“ und wähle die gewünschte Datei auf deinem Rechner aus.",
      "3. Die App übernimmt die Datei als aktuellen Projektstand und wechselt danach zurück in die Projektansicht.",
      "",
      "Hinweis",
      "Wenn du eine ältere Sicherung laden willst, nimm immer die gespeicherte JSON-Datei. So stellst du sicher, dass Projekt- und Risikodaten vollständig übernommen werden."
    ].join("\n");
  }
  if (matches("wie", "prüfe", "fehlende", "eingaben")) {
    return [
      "Fehlende Eingaben prüfen",
      "1. Öffne den Projektbereich und kontrolliere die Felder mit roter Kennzeichnung oder Platzhaltern wie „nicht gepflegt“.",
      "2. Prüfe die fachlich wichtigsten Stammdaten zuerst: Projektname, Projektart, Standort, Auftraggeber, Projektleitung und Termine.",
      "3. Nutze zusätzlich den Berichtsbereich und das Risikoregister, um Lücken in Maßnahmen, Verantwortlichkeiten und Status zu erkennen.",
      "",
      "Empfehlung",
      "Arbeite von oben nach unten: erst Stammdaten, dann Termine, dann Risiken und zuletzt Bericht und Export. So reduzierst du Nacharbeiten deutlich."
    ].join("\n");
  }
  if (matches("wie", "übernehme", "ki-vorschlag")) {
    return [
      "KI-Vorschlag übernehmen",
      "1. Lies das KI-Ergebnis vollständig durch und prüfe, ob Inhalt, Verantwortliche, Maßnahmen und Rest-Risiko fachlich plausibel sind.",
      "2. Wähle bei Bedarf ein Zielrisiko aus, wenn der Vorschlag ein bestehendes Risiko ergänzen soll.",
      "3. Klicke anschließend auf „Vorschlag übernehmen“. Die App übernimmt den geprüften Vorschlag in den Bericht oder ins Risikoregister, je nach gewähltem KI-Flow.",
      "",
      "Empfehlung",
      "Übernimm KI-Inhalte nie ungeprüft. Die KI beschleunigt die Vorbereitung, die fachliche Verantwortung bleibt aber bei dir."
    ].join("\n");
  }
  if (matches("wie", "ki-verbindung") || (matches("wie", "ki") && matches("verbindung")) || (matches("kosten") && matches("verbindung"))) {
    return [
      "KI-Verbindung herstellen",
      "1. Öffne die Kachel „KI-Verbindung“.",
      "2. Trage dort deinen technischen Anthropic-API-Schlüssel ein. Das ist kein normaler Benutzer- oder Claude-Account, sondern der Zugang für die automatische KI-Anbindung im Browser.",
      "3. Klicke auf „Einstellungen speichern“ und danach auf „Verbindung erneut prüfen“. Erst dann ist die Verbindung für die KI-Funktionen aktiv.",
      "",
      "Kosten",
      "Für den Einstieg empfehle ich ein Startbudget von etwa 10 Euro. Das reicht in der Regel für Tests und erste Analysen.",
      "Bei regelmäßiger Nutzung oder längeren Berichten kann das Budget jederzeit angepasst werden. Die Abrechnung erfolgt nutzungsabhängig direkt über Anthropic.",
      "",
      "Information",
      "Die offizielle Preisübersicht findest du in der Anthropic-Dokumentation zur Preisübersicht: " + baseUrl
    ].join("\n");
  }
  return "";
}

function updateAiChatStatus(chatId, status, busy = false) {
  return updateAiChatThread(chatId, (thread) => ({
    ...thread,
    status: String(status || "Bereit"),
    busy: busy === true,
    error: busy ? "" : String(thread.error || "")
  }));
}

async function runAiChatQuestion(chatId, question, keepDraft = false) {
  const normalizedChatId = normalizeAiChatId(chatId);
  const draft = String(question || "").trim();
  if (!draft) {
    updateAiChatStatus(normalizedChatId, "Bitte eine Frage eingeben.", false);
    renderAppSafe();
    focusAiChatDraftField(normalizedChatId);
    return;
  }

  const hasKey = String(aiSettings.apiKey || "").trim().length > 0;
  if (!hasKey) {
    appendAiChatMessage(normalizedChatId, {
      role: "assistant",
      content: "Bitte zuerst in der KI-Verbindung den API-Schlüssel speichern und die Verbindung prüfen."
    });
    updateAiChatStatus(normalizedChatId, "API-Schlüssel fehlt", false);
    renderAppSafe();
    focusAiChatDraftField(normalizedChatId);
    return;
  }

  if (!keepDraft) {
    clearAiChatDraft(normalizedChatId);
  }
  appendAiChatMessage(normalizedChatId, {
    role: "user",
    content: draft
  });
  updateAiChatStatus(normalizedChatId, "KI antwortet ...", true);
  renderAppSafe();

  if (normalizedChatId === "hilfe") {
    const cachedAnswer = getKnownHelpAnswer(draft, store.getState());
    if (cachedAnswer) {
      appendAiChatMessage(normalizedChatId, {
        role: "assistant",
        content: cachedAnswer
      });
      updateAiChatStatus(normalizedChatId, "Antwort bereit", false);
      renderAppSafe();
      focusAiChatDraftField(normalizedChatId);
      return;
    }
  }

  try {
    const currentState = store.getState();
    const response = await fetch(buildAiProxyUrl("/api/ai/generate"), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        apiKey: aiSettings.apiKey,
        model: "claude-sonnet-4-20250514",
        maxTokens: normalizedChatId === "hilfe" ? 1200 : 1600,
        system: buildAiChatSystemPrompt(normalizedChatId),
        userPrompt: buildAiChatUserPrompt(currentState, normalizedChatId, draft)
      })
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const providerSnippet = String(errorPayload?.providerBody || "").trim();
      const extra = providerSnippet ? `\n${providerSnippet.slice(0, 500)}` : "";
      throw new Error(`${errorPayload?.error || `HTTP ${response.status}`}${extra}`);
    }

    const payload = await response.json();
    const answer = String(payload?.text || "").trim() || "Die KI hat keine verwertbare Antwort zurückgegeben.";
    appendAiChatMessage(normalizedChatId, {
      role: "assistant",
      content: answer
    });
    updateAiChatStatus(normalizedChatId, "Antwort bereit", false);
  } catch (error) {
    const message = String(error?.message || "Unbekannter Fehler").trim();
    appendAiChatMessage(normalizedChatId, {
      role: "assistant",
      content: `Fehler bei der KI-Antwort: ${message}`
    });
    setAiChatDraft(normalizedChatId, draft);
    updateAiChatStatus(normalizedChatId, "KI-Antwort fehlgeschlagen", false);
  }

  renderAppSafe();
  focusAiChatDraftField(normalizedChatId);
}

async function runAiChatConversation(chatId) {
  const normalizedChatId = normalizeAiChatId(chatId);
  await runAiChatQuestion(normalizedChatId, getAiChatDraft(normalizedChatId), false);
}

function clearAiChatConversation(chatId) {
  const normalizedChatId = normalizeAiChatId(chatId);
  clearAiChatDraft(normalizedChatId);
  updateAiChatThread(normalizedChatId, (thread) => ({
    ...thread,
    messages: [],
    busy: false,
    error: "",
    status: "Bereit",
    updatedAt: Date.now()
  }));
  renderAppSafe();
  focusAiChatDraftField(normalizedChatId);
}

function prefillAiChatDraft(chatId, value) {
  const normalizedChatId = normalizeAiChatId(chatId);
  setAiChatDraft(normalizedChatId, value);
  renderAppSafe();
  focusAiChatDraftField(normalizedChatId);
}

async function askAiChatPrompt(chatId, prompt) {
  const normalizedChatId = normalizeAiChatId(chatId);
  await runAiChatQuestion(normalizedChatId, prompt, true);
}

function createNeutralProjectState() {
  const next = cloneState();
  next.project = {
    name: "",
    type: "",
    bauart: "",
    phase: "",
    landArea: 0,
    bgf: 0,
    floorsAboveGround: 0,
    floorsBelowGround: 0,
    budget: 0,
    costBasis: "netto",
    currency: "EUR",
    location: {
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: ""
    },
    client: "",
    clientRoles: [],
    clientFunctions: [],
    clientAddressLine: "",
    clientPostalCode: "",
    clientCity: "",
    projectLead: "",
    startDate: "",
    endDate: "",
    analysisDate: "",
    description: ""
  };
  next.reportProfile = {
    ...next.reportProfile,
    company: "",
    companyAddress: "",
    author: "",
    clientName: "",
    clientAddress: "",
    projectAddress: "",
    confidentiality: "Vertraulich",
    notes: "",
    logoDataUrl: null
  };
  next.riskRegister = {
    ...next.riskRegister,
    risks: []
  };
  next.ui = {
    ...next.ui,
    activeModule: "project",
    projectExportName: "",
    reportExportName: "",
    reportExportFormat: "txt",
    reportMode: "risk",
    riskRegisterView: {
      search: "",
      status: "alle",
      owner: "alle",
      category: "alle",
      criticalOnly: false,
      showArchived: false,
      visibleColumns: ["select", "priority", "status", "value", "category", "phase", "impact", "owner", "dueDate", "measures"],
      topLimit: 5,
      sortBy: "priority",
      dueFrom: "",
      dueTo: "",
      matrixSelection: null
    },
    reportDraft: "",
    reportDraftCleared: false,
    aiWorkshop: normalizeAiWorkshopState(),
    dirty: false
  };
  return next;
}

function moveItemRelative(list, itemValue, targetValue, placeAfter = false) {
  const items = Array.isArray(list) ? [...list] : [];
  const fromIndex = items.indexOf(itemValue);
  const targetIndex = items.indexOf(targetValue);
  if (fromIndex < 0 || targetIndex < 0 || itemValue === targetValue) return items;
  const [item] = items.splice(fromIndex, 1);
  const nextTargetIndex = items.indexOf(targetValue);
  const insertIndex = Math.max(0, placeAfter ? nextTargetIndex + 1 : nextTargetIndex);
  items.splice(insertIndex, 0, item);
  return items;
}

function sameRiskPanelOrder(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function applyRiskRegisterPanelOrder(order) {
  const panelOrder = normalizeRiskRegisterPanelOrder(order);
  const panelRank = new Map(panelOrder.map((key, index) => [key, index]));
  const stack = document.querySelector(".risk-register-panel-stack");
  const panels = [...document.querySelectorAll?.(".risk-register-panel-stack > [data-risk-panel-key], .risk-register-panel-stack > [data-risk-panel-placeholder]") || []]
    .filter((panel) => panel instanceof HTMLElement);
  panels.forEach((panel) => {
    const key = panel.getAttribute("data-risk-panel-key");
    panel.style.order = String(key ? (panelRank.get(key) ?? 999) : Number(panel.style.order || 999));
  });
  if (stack instanceof HTMLElement && panels.length) {
    const orderedNodes = [...panels].sort((left, right) => {
      const leftOrder = Number(left.style.order || 999);
      const rightOrder = Number(right.style.order || 999);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return 0;
    });
    orderedNodes.forEach((node) => stack.appendChild(node));
  }
}

function clearRiskRegisterDropIndicator() {
  if (draggedRiskPanelPlaceholderElement instanceof HTMLElement) {
    draggedRiskPanelPlaceholderElement.remove();
  }
  draggedRiskPanelPlaceholderElement = null;
}

function restoreDraggedRiskPanelStyles() {
  if (!(draggedRiskPanelElement instanceof HTMLElement)) return;
  draggedRiskPanelElement.style.pointerEvents = "";
  draggedRiskPanelElement.style.position = "";
  draggedRiskPanelElement.style.left = "";
  draggedRiskPanelElement.style.top = "";
  draggedRiskPanelElement.style.width = "";
  draggedRiskPanelElement.style.margin = "";
  draggedRiskPanelElement.style.zIndex = "";
  draggedRiskPanelElement.style.transform = "";
  draggedRiskPanelElement.style.height = draggedRiskPanelOriginalHeight;
  draggedRiskPanelElement.style.overflow = draggedRiskPanelOriginalOverflow;
  draggedRiskPanelElement.classList.remove("is-dragging");
  draggedRiskPanelOriginalHeight = "";
  draggedRiskPanelOriginalOverflow = "";
}

function setRiskRegisterDropIndicator(_targetKey, _placeAfter, _pointerY = null) {
  const draggedKey = draggedRiskPanelKey;
  const previewOrder = normalizeRiskRegisterPanelOrder(draggedRiskPanelPreviewOrder || store.getState().ui?.riskRegisterView?.panelOrder);
  const placeholderOrder = Math.max(0, previewOrder.indexOf(draggedKey));
  const panel = draggedRiskPanelElement;
  if (!(panel instanceof HTMLElement)) return;
  const stack = panel.closest?.(".risk-register-panel-stack");
  if (!(stack instanceof HTMLElement)) return;
  if (!(draggedRiskPanelPlaceholderElement instanceof HTMLElement)) {
    const placeholder = document.createElement("div");
    placeholder.className = "risk-panel-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.setAttribute("data-risk-panel-placeholder", "true");
    stack.appendChild(placeholder);
    draggedRiskPanelPlaceholderElement = placeholder;
  }
  const rect = panel.getBoundingClientRect();
  draggedRiskPanelPlaceholderElement.style.height = `${Math.max(72, Math.round(rect.height))}px`;
  draggedRiskPanelPlaceholderElement.style.order = String(placeholderOrder);
  draggedRiskPanelPlaceholderElement.style.display = "block";
}

function getRiskRegisterPanelsByPosition() {
  return [...document.querySelectorAll?.("[data-risk-panel-key]") || []]
    .filter((panel) => panel instanceof HTMLElement)
    .map((panel) => ({ panel, rect: panel.getBoundingClientRect() }))
    .filter(({ rect }) => rect && rect.width > 0 && rect.height > 0)
    .sort((a, b) => a.rect.top - b.rect.top);
}

function normalizeRiskRegisterMatrixSelection(matrixSelection) {
  if (!matrixSelection || typeof matrixSelection !== "object") return null;
  const likelihood = Number(matrixSelection.likelihood);
  const impact = Number(matrixSelection.impact);
  if (!Number.isInteger(likelihood) || !Number.isInteger(impact)) return null;
  if (likelihood < 1 || likelihood > 5 || impact < 1 || impact > 5) return null;
  return { likelihood, impact };
}

function normalizeImportedProjectState(parsed) {
  if (!isValidProjectState(parsed)) return null;
  const importedSchemaVersion = normalizeSchemaVersion(parsed.meta?.schemaVersion);
  const migrated = migrateProjectState(parsed, importedSchemaVersion, CURRENT_SCHEMA_VERSION);
  if (!isValidProjectState(migrated)) return null;
  const importEditSort = String(migrated.ui?.riskRegisterView?.editSortBy || "newest").toLowerCase() === "id"
    ? "id"
    : "newest";
  const schemaVersion = normalizeSchemaVersion(migrated.meta?.schemaVersion);
  const riskRegister = {
    ...migrated.riskRegister,
    risks: Array.isArray(migrated.riskRegister?.risks) && migrated.riskRegister.risks.length
      ? sortRiskRegisterEntriesForEdit(normalizeRiskRegisterEntries(migrated.riskRegister.risks), importEditSort)
      : cloneState().riskRegister.risks
  };
  return {
    ...migrated,
    meta: {
      ...cloneState().meta,
      ...migrated.meta,
      schemaVersion
    },
    riskRegister,
    ui: migrated.ui
  };
}

function normalizeImportedProjectStateWithDefaults(parsed) {
  const source = parsed && typeof parsed === "object" ? parsed : {};
  const base = cloneState();
  const reportProfileSource = source.reportProfile && typeof source.reportProfile === "object"
    ? source.reportProfile
    : {
        ...base.reportProfile,
        companyAddress: normalizeReportProfileState({ companyAddress: source.companyAddress }).companyAddress || base.reportProfile.companyAddress
      };
  const candidate = {
    ...base,
    ...source,
    meta: {
      ...base.meta,
      ...(source.meta && typeof source.meta === "object" ? source.meta : {})
    },
    project: normalizeProjectState(source.project && typeof source.project === "object" ? source.project : source, base.project),
    reportProfile: normalizeReportProfileState(reportProfileSource),
    riskRegister: source.riskRegister && typeof source.riskRegister === "object" ? { ...base.riskRegister, ...source.riskRegister } : base.riskRegister,
    aiWorkshop: source.aiWorkshop && typeof source.aiWorkshop === "object" ? { ...base.aiWorkshop, ...source.aiWorkshop } : base.aiWorkshop,
    ui: source.ui && typeof source.ui === "object" ? { ...base.ui, ...source.ui } : base.ui
  };
  candidate.meta = {
    ...base.meta,
    ...candidate.meta,
    schemaVersion: normalizeSchemaVersion(candidate.meta?.schemaVersion)
  };
  candidate.project = normalizeProjectState(candidate.project, base.project);
  candidate.reportProfile = normalizeReportProfileState(candidate.reportProfile);
  if (!String(candidate.reportProfile.clientAddress || "").trim()) {
    candidate.reportProfile = {
      ...candidate.reportProfile,
      clientAddress: deriveReportClientAddress(candidate.project)
    };
  }
  candidate.riskRegister = {
    ...candidate.riskRegister,
    risks: Array.isArray(candidate.riskRegister?.risks) && candidate.riskRegister.risks.length
      ? normalizeRiskRegisterEntries(candidate.riskRegister.risks)
      : base.riskRegister.risks
  };
  if (!isValidProjectState(candidate)) return null;
  return candidate;
}

function collectProjectFileAudit(state) {
  const project = state?.project || {};
  const reportProfile = state?.reportProfile || {};
  const missing = [];
  const hasText = (value) => String(value || "").trim().length > 0;
  const hasPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  if (!hasPositiveNumber(project.landArea)) missing.push("Grundstücksgröße");
  if (!hasPositiveNumber(project.floorsAboveGround)) missing.push("GESCHOSSE OBERIRD.");
  if (!hasPositiveNumber(project.floorsBelowGround)) missing.push("GESCHOSSE UNTERIRD.");
  if (!Array.isArray(project.clientRoles) || !project.clientRoles.length) missing.push("Rollen");
  if (!hasText(project.location?.street)) missing.push("Straße");
  if (!hasText(project.location?.houseNumber)) missing.push("Hausnummer");
  if (!hasText(project.location?.postalCode)) missing.push("Postleitzahl");
  if (!hasText(project.location?.city)) missing.push("Ort");
  if (!hasText(project.clientAddressLine)) missing.push("Auftraggeberanschrift Straße / Hausnummer");
  if (!hasText(project.clientPostalCode)) missing.push("Auftraggeberanschrift Postleitzahl");
  if (!hasText(project.clientCity)) missing.push("Auftraggeberanschrift Ort");
  if (!hasText(reportProfile.companyAddress)) missing.push("Anschrift erstellende Stelle");
  return missing;
}

function formatProjectFileAuditMessage(prefix, missing) {
  if (!missing.length) return prefix;
  return `${prefix}\nHinweis: Fehlende Angaben: ${missing.join(", ")}.`;
}

function formatTolerancePercent(value) {
  return `${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)} %`;
}

function formatToleranceCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function isValidProjectState(payload) {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    payload.project &&
    payload.reportProfile &&
    payload.riskRegister
  );
}

function normalizeSchemaVersion(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) return 1;
  return numeric;
}

function normalizeReportProfileState(reportProfile) {
  const base = cloneState().reportProfile;
  const source = reportProfile && typeof reportProfile === "object" ? reportProfile : {};
  const normalizeText = (value) => String(value || "").trim();
  const confidentiality = normalizeReportProfileConfidentiality(source.confidentiality);
  return {
    ...base,
    ...source,
    author: normalizeText(source.author),
    company: normalizeText(source.company),
    companyAddress: normalizeText(source.companyAddress),
    clientName: normalizeText(source.clientName),
    clientAddress: normalizeText(source.clientAddress),
    projectAddress: normalizeText(source.projectAddress),
    notes: normalizeText(source.notes),
    confidentiality
  };
}

function deriveReportClientAddress(project = {}) {
  const line = String(project.clientAddressLine || "").trim();
  const postalCode = String(project.clientPostalCode || "").trim();
  const city = String(project.clientCity || "").trim();
  return [line, [postalCode, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

function normalizeProjectState(project, baseProject = cloneState().project) {
  const source = project && typeof project === "object" ? project : {};
  const sourceLocation = source.location && typeof source.location === "object" ? source.location : source;
  const normalizeText = (value) => String(value || "").trim();
  const normalizeCount = (value, fallback = 0) => {
    const normalized = String(value ?? "").trim().replace(/[^\d-]/g, "");
    if (!normalized) return Number(fallback) || 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : Number(fallback) || 0;
  };
  const nextName = normalizeText(source.name);
  const nextPhase = normalizeText(source.phase);
  const nextStatus = normalizeText(source.status);
  return {
    ...baseProject,
    ...source,
    name: nextName && nextName.toLowerCase() !== "risiko register" ? nextName : baseProject.name,
    phase: nextPhase || baseProject.phase,
    status: nextStatus || baseProject.status,
    landArea: normalizeCount(source.landArea, baseProject.landArea),
    clientRoles: normalizeClientRoles(source.clientRoles || source.clientRole || baseProject.clientRoles),
    clientFunctions: normalizeClientFunctions(source.clientFunctions || source.clientFunction || baseProject.clientFunctions),
    clientAddressLine: normalizeText(source.clientAddressLine || [source.clientStreet, source.clientHouseNumber].filter(Boolean).join(" ")) || baseProject.clientAddressLine || "",
    clientPostalCode: normalizeText(source.clientPostalCode) || baseProject.clientPostalCode || "",
    clientCity: normalizeText(source.clientCity) || baseProject.clientCity || "",
    floorsAboveGround: normalizeCount(source.floorsAboveGround, baseProject.floorsAboveGround),
    floorsBelowGround: normalizeCount(source.floorsBelowGround, baseProject.floorsBelowGround),
    location: {
      ...baseProject.location,
      ...source.location,
      street: normalizeText(sourceLocation.street || source.street) || baseProject.location?.street || "",
      houseNumber: normalizeText(sourceLocation.houseNumber || source.houseNumber) || baseProject.location?.houseNumber || "",
      postalCode: normalizeText(sourceLocation.postalCode || source.postalCode) || baseProject.location?.postalCode || "",
      city: normalizeText(sourceLocation.city || source.city) || baseProject.location?.city || "",
      country: normalizeText(sourceLocation.country || source.country) || baseProject.location?.country || "DE"
    }
  };
}

function normalizeReportProfileConfidentiality(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Vertraulich";
  if (normalized.includes("streng")) return "Streng vertraulich";
  if (normalized.includes("intern")) return "Intern";
  return "Vertraulich";
}

function migrateProjectState(state, fromVersion = normalizeSchemaVersion(state?.meta?.schemaVersion), toVersion = CURRENT_SCHEMA_VERSION) {
  if (!state || typeof state !== "object") return state;
  let migrated = state;
  for (let version = fromVersion + 1; version <= toVersion; version += 1) {
    const migrate = PROJECT_STATE_MIGRATIONS[version];
    if (typeof migrate === "function") {
      migrated = migrate(migrated) || migrated;
    }
  }
  return migrated;
}

function persistAutosave(state) {
  if (suppressNextAutosave > 0) {
    suppressNextAutosave -= 1;
    return;
  }
  const saved = writeStorageValue(
    AUTOSAVE_KEY,
    serializeProject(mergeRiskReportDraftIntoState(mergeAiWorkshopFreeTextDraftIntoState(state)))
  );
  if (saved) {
    lastAutosavedAt = new Date().toISOString();
    updateStorageStatus(formatProjectFileAuditMessage(`Autosave aktiv · ${formatTimestamp(lastAutosavedAt)}`, collectProjectFileAudit(state)));
  } else {
    updateStorageStatus("Autosave konnte im Browser nicht gespeichert werden.");
  }
}

function restoreAutosave() {
  const raw = readStorageValue(AUTOSAVE_KEY);
  if (!raw) {
    updateStorageStatus("Autosave bereit.");
    return;
  }
  const parsed = safeJsonParse(raw, null);
  if (!parsed) {
    updateStorageStatus("Vorhandener Autosave war unvollständig und wurde ignoriert.");
    return;
  }
  const nextState = normalizeImportedProjectState(parsed) || normalizeImportedProjectStateWithDefaults(parsed);
  if (!nextState) {
    updateStorageStatus("Vorhandener Autosave war unvollständig und wurde ignoriert.");
    return;
  }
  nextState.ui = {
    ...nextState.ui,
    aiPanelOpenStates: normalizeAiPanelOpenStates({}),
    riskRegisterView: {
      ...nextState.ui?.riskRegisterView,
      panelOpenStates: {
        overview: false,
        edit: false,
        ai: false,
        table: false,
        chart: false,
        matrix: false
      }
    }
  };
  nextState.riskRegister = {
    ...nextState.riskRegister,
    risks: normalizeRiskRegisterEntries(nextState.riskRegister?.risks).map((risk) =>
      normalizeRiskStatusValue(risk.status) === "archiviert"
        ? {
            ...risk,
            archivedAt: typeof risk.archivedAt === "string" && risk.archivedAt.trim() ? risk.archivedAt : new Date().toISOString(),
            archivedReason: typeof risk.archivedReason === "string" && risk.archivedReason.trim()
              ? risk.archivedReason
              : "Nicht mehr eintretbar durch Baufortschritt",
            archivedFromStatus: typeof risk.archivedFromStatus === "string" && risk.archivedFromStatus.trim()
              ? risk.archivedFromStatus
              : "offen"
          }
        : risk
    )
  };
  nextState.riskRegister = {
    ...nextState.riskRegister,
    risks: sortRiskRegisterEntriesForEdit(
      normalizeRiskRegisterEntries(nextState.riskRegister?.risks),
      nextState.ui?.riskRegisterView?.editSortBy || "newest"
    )
  };
  store.setState(nextState);
  syncAiWorkshopFreeTextDraftFromState(nextState);
  syncRiskReportDraftFromState(nextState);
  store.markSaved();
  lastAutosavedAt = nextState.meta?.savedAt || new Date().toISOString();
  updateStorageStatus(formatProjectFileAuditMessage(`Autosave geladen · ${formatTimestamp(lastAutosavedAt)}`, collectProjectFileAudit(nextState)));
}

function readFileText(file) {
  if (file && typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Die Projektdatei konnte nicht gelesen werden."));
      reader.readAsText(file, "utf-8");
    } catch (error) {
      reject(error);
    }
  });
}

async function importProjectFile(file) {
  if (!file) {
    updateStorageStatus("Keine Projektdatei ausgewählt.");
    return;
  }
  try {
    const fileText = await readFileText(file);
    const parsed = safeJsonParse(String(fileText || ""), null);
    if (!parsed) {
      updateStorageStatus("Die Projektdatei konnte nicht gelesen werden.");
      return;
    }
    const nextState = normalizeImportedProjectState(parsed) || normalizeImportedProjectStateWithDefaults(parsed);
    if (!nextState) {
      updateStorageStatus("Die gewählte Datei ist keine gültige Projektdatei.");
      return;
    }
    nextState.ui = {
      ...nextState.ui,
      aiPanelOpenStates: normalizeAiPanelOpenStates({}),
      riskRegisterView: {
        ...nextState.ui?.riskRegisterView,
        panelOpenStates: {
          overview: false,
          edit: false,
          ai: false,
          table: false,
          chart: false,
          matrix: false
        }
      }
    };
    nextState.ui = {
      ...nextState.ui,
      activeModule: "project",
      aiPanelOpenStates: normalizeAiPanelOpenStates({}),
      riskRegisterView: {
        ...nextState.ui?.riskRegisterView,
        panelOpenStates: {
          overview: false,
          edit: false,
          ai: false,
          table: false,
          chart: false,
          matrix: false
        }
      }
    };
    store.setState(nextState);
    syncAiWorkshopFreeTextDraftFromState(nextState);
    syncRiskReportDraftFromState(nextState);
    store.markSaved();
    persistAutosave(store.getState());
    rememberRecentProjectFile(nextState, "geladen", file.name);
    updateStorageStatus(formatProjectFileAuditMessage(`Projektdatei geladen · ${file.name}`, collectProjectFileAudit(nextState)));
  } catch (error) {
    const details = error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error || "unbekannter Fehler");
    console.error("Projektdatei-Import fehlgeschlagen:", error);
    updateStorageStatus(`Die Projektdatei konnte nicht gelesen werden. (${details})`);
  }
}

function openProjectFilePicker() {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.setAttribute("autocomplete", "off");
  picker.setAttribute("spellcheck", "false");
  picker.setAttribute("aria-hidden", "true");
  picker.style.position = "fixed";
  picker.style.left = "-9999px";
  picker.style.top = "0";
  picker.style.width = "1px";
  picker.style.height = "1px";
  picker.style.opacity = "0";
  document.body.appendChild(picker);

  const cleanup = () => {
    picker.removeEventListener("change", onChange);
    picker.remove();
  };

  async function onChange() {
    const selectedFile = picker.files?.[0] || null;
    if (!selectedFile) {
      updateStorageStatus("Keine Projektdatei ausgewählt.");
      cleanup();
      return;
    }
    updateStorageStatus(`Projektdatei wird geladen · ${selectedFile.name}`);
    try {
      await importProjectFile(selectedFile);
    } finally {
      cleanup();
    }
  }

  picker.addEventListener("change", onChange, { once: true });
  try {
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
    } else {
      picker.click();
    }
  } catch (_error) {
    picker.click();
  }
}

function serializeProject(state) {
  return JSON.stringify(mergeRiskReportDraftIntoState(mergeAiWorkshopFreeTextDraftIntoState(state)), null, 2);
}

function readRecentProjectFiles() {
  const raw = readStorageValue(RECENT_PROJECT_FILES_KEY);
  const parsed = safeJsonParse(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((entry) => entry && typeof entry === "object" && typeof entry.id === "string")
    .slice(0, MAX_RECENT_PROJECT_FILES)
    .map((entry) => ({
      id: entry.id,
      fileName: typeof entry.fileName === "string" ? entry.fileName : "Projektdatei.json",
      projectName: typeof entry.projectName === "string" ? entry.projectName : "Projekt",
      savedAt: typeof entry.savedAt === "string" ? entry.savedAt : "",
      savedAtLabel: typeof entry.savedAtLabel === "string" ? entry.savedAtLabel : "",
      origin: typeof entry.origin === "string" ? entry.origin : "gespeichert",
      hasPayload: typeof entry.data === "string" || Boolean(entry.hasPayload),
      data: typeof entry.data === "string" ? entry.data : ""
    }));
}

function writeRecentProjectFiles(entries) {
  const compactEntries = entries.slice(0, MAX_RECENT_PROJECT_FILES).map((entry) => ({
    id: entry.id,
    fileName: entry.fileName,
    projectName: entry.projectName,
    savedAt: entry.savedAt,
    savedAtLabel: entry.savedAtLabel,
    origin: entry.origin,
    data: typeof entry.data === "string" ? entry.data : ""
  }));
  return writeStorageValue(RECENT_PROJECT_FILES_KEY, JSON.stringify(compactEntries));
}

function rememberRecentProjectFile(state, origin = "gespeichert", explicitFileName = "") {
  const serialized = serializeProject(state);
  const projectName = String(state.project?.name || "Projekt").trim() || "Projekt";
  const fileNameBase = sanitizeExportFileName(explicitFileName || state.ui?.projectExportName || state.project?.name || "Projekt", state.project?.name || "Projekt");
  const savedAt = new Date().toISOString();
  const nextEntry = {
    id: `${savedAt}_${Math.random().toString(36).slice(2, 8)}`,
    fileName: `${fileNameBase}.json`,
    projectName,
    savedAt,
    savedAtLabel: new Date(savedAt).toLocaleString("de-DE"),
    origin,
    data: serialized
  };
  const current = readRecentProjectFiles().filter((entry) => entry.fileName !== nextEntry.fileName);
  const next = [nextEntry, ...current].slice(0, MAX_RECENT_PROJECT_FILES);
  writeRecentProjectFiles(next);
  const nextIds = new Set(next.map((entry) => entry.id));
  current.filter((entry) => !nextIds.has(entry.id)).forEach((entry) => {
    void deleteRecentProjectPayload(entry.id);
  });
  void storeRecentProjectPayload(nextEntry.id, serialized);
}

async function loadRecentProjectFileById(id) {
  const entry = readRecentProjectFiles().find((item) => item.id === id);
  if (!entry) return false;
  const payload = typeof entry.data === "string" && entry.data
    ? entry.data
    : await readRecentProjectPayload(entry.id);
  if (typeof entry.data === "string" && entry.data) {
    void storeRecentProjectPayload(entry.id, entry.data);
  }
  const parsed = safeJsonParse(payload, null);
  if (!parsed) {
    updateStorageStatus("Die gespeicherte Projektdatei konnte nicht geladen werden.");
    return false;
  }
  const nextState = normalizeImportedProjectState(parsed) || normalizeImportedProjectStateWithDefaults(parsed);
  if (!nextState) {
    updateStorageStatus("Die gespeicherte Projektdatei konnte nicht geladen werden.");
    return false;
  }
  nextState.ui = {
    ...nextState.ui,
    activeModule: "project",
    aiPanelOpenStates: normalizeAiPanelOpenStates(nextState.ui?.aiPanelOpenStates)
  };
  store.setState(nextState);
  syncAiWorkshopFreeTextDraftFromState(nextState);
  syncRiskReportDraftFromState(nextState);
  store.markSaved();
  persistAutosave(store.getState());
  rememberRecentProjectFile(nextState, "geladen", entry.fileName);
  updateStorageStatus(formatProjectFileAuditMessage(`Zuletzt gespeichertes Projekt geladen · ${entry.fileName}`, collectProjectFileAudit(nextState)));
  return true;
}

async function deleteRecentProjectFileById(id) {
  const entry = readRecentProjectFiles().find((item) => item.id === id);
  if (!entry) return false;
  const nextEntries = readRecentProjectFiles().filter((item) => item.id !== id);
  writeRecentProjectFiles(nextEntries);
  await deleteRecentProjectPayload(id);
  updateStorageStatus(`Eintrag aus dem Browser-Verlauf entfernt · ${entry.fileName}`);
  return true;
}

function saveProjectFile(state) {
  const safeName = sanitizeExportFileName(state.ui?.projectExportName || state.project.name || "project-controls-hub", state.project.name || "project-controls-hub");
  const blob = new Blob([serializeProject(state)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  rememberRecentProjectFile(state, "gespeichert", safeName);
  const auditMissing = collectProjectFileAudit(state);
  if (auditMissing.length) {
    updateStorageStatus(formatProjectFileAuditMessage(`Projektdatei exportiert · ${formatTimestamp(state.ui?.lastSavedAt)}`, auditMissing));
  }
}

function sanitizeExportFileName(value, fallback) {
  const raw = String(value || "").trim().replace(/\s+/g, " ");
  const withoutExtension = raw.replace(/\.(json|doc|pdf)$/i, "");
  const safe = withoutExtension
    .replace(/[^\wäöüÄÖÜß.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || fallback;
}

function formatProjectExportFileName(value, fallback) {
  return sanitizeExportFileName(value, fallback).replace(/\s+/g, "_");
}

function getActiveReportTitle(state) {
  return "Risikobericht";
}

function getDefaultReportExportName(state) {
  const projectName = String(state.project?.name || "Projekt").trim();
  return `Risikobericht für ${projectName}`;
}

function getReportExportBaseName(state) {
  const fallback = getDefaultReportExportName(state);
  return sanitizeExportFileName(state.ui?.reportExportName, fallback);
}

function getReportExportFormat(state) {
  const format = String(state.ui?.reportExportFormat || "").toLowerCase();
  if (["json", "txt", "doc", "pdf"].includes(format)) return format;
  return "txt";
}

function getReportExportSelection(state) {
  const fileNameInput = document.getElementById("reportExportFileName");
  const formatSelect = document.getElementById("reportExportFormat");
  return {
    fileName: fileNameInput?.value ?? state.ui?.reportExportName ?? "",
    format: (formatSelect?.value || state.ui?.reportExportFormat || "txt").toLowerCase()
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isHtmlLikeDraft(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function stripHtmlToPlainText(value) {
  const text = String(value || "");
  if (!text) return "";
  if (!isHtmlLikeDraft(text)) return text;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = text;
  const blockTags = new Set([
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "DIV",
    "DL",
    "DT",
    "DD",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HR",
    "LI",
    "MAIN",
    "NAV",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TBODY",
    "TD",
    "TH",
    "THEAD",
    "TR",
    "UL"
  ]);
  const lines = [];
  let currentLine = "";
  let lastWasBlank = false;
  const flushLine = () => {
    const normalized = currentLine.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    if (normalized) lines.push(normalized);
    currentLine = "";
    lastWasBlank = false;
  };
  const pushBlankLine = () => {
    flushLine();
    if (!lastWasBlank) {
      lines.push("");
      lastWasBlank = true;
    }
  };
  const appendText = (chunk) => {
    const normalized = String(chunk || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ");
    if (!normalized.trim()) {
      if (currentLine && !currentLine.endsWith(" ")) currentLine += " ";
      return;
    }
    currentLine += normalized;
  };
  const walk = (node) => {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      appendText(node.textContent || "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = String(node.tagName || "").toUpperCase();
    if (tag === "BR") {
      flushLine();
      return;
    }
    const className = String(node.getAttribute?.("class") || "");
    const isDocumentTitle = tag === "DIV" && className.includes("report-document-title");
    const isSectionHeading = tag === "DIV" && className.includes("report-section-heading");
    if (isDocumentTitle) {
      flushLine();
      for (const child of Array.from(node.childNodes || [])) walk(child);
      flushLine();
      pushBlankLine();
      return;
    }
    if (isSectionHeading) {
      pushBlankLine();
      for (const child of Array.from(node.childNodes || [])) walk(child);
      flushLine();
      return;
    }
    if (tag === "LI") {
      flushLine();
      currentLine = "- ";
      for (const child of Array.from(node.childNodes || [])) walk(child);
      flushLine();
      return;
    }
    const isBlock = blockTags.has(tag);
    if (isBlock && currentLine.trim()) flushLine();
    if (tag === "HR") {
      flushLine();
      return;
    }
    for (const child of Array.from(node.childNodes || [])) walk(child);
    if (isBlock && currentLine.trim()) flushLine();
  };
  for (const child of Array.from(wrapper.childNodes || [])) {
    walk(child);
  }
  flushLine();
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildPrintableReportHtml(title, subtitle, reportContent, fileName, allowMarkup = false) {
  const body = allowMarkup ? String(reportContent || "") : escapeHtml(reportContent);
  const copyWhiteSpace = allowMarkup ? "normal" : "pre-wrap";
  const subtitleMarkup = String(subtitle || "").trim() ? `<div class="meta">${escapeHtml(subtitle)}</div>` : "";
  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(fileName || title)}</title>
    <style>
      html, body { background: #ffffff; color: #08131d; }
      @page { margin: 0; }
      body { font-family: "Source Sans 3", "Segoe UI", sans-serif; margin: 0; padding: 20mm; box-sizing: border-box; }
      h1 { font-family: "DM Serif Display", Georgia, serif; font-size: 30px; margin: 0; color: #091f33; }
      .report-title-spacer { height: 18px; line-height: 18px; font-size: 18px; font-weight: 400; }
      .meta { color: #425466; margin-bottom: 12px; line-height: 1.6; }
      .copy { white-space: ${copyWhiteSpace}; line-height: 1.7; font-size: 15px; }
      .copy ul, .copy ol { margin: 0 0 12px 1.25em; padding-left: 1.1em; }
      .copy li { margin: 0 0 5px; }
      .copy .report-section-heading {
        margin: 18px 0 6px;
      }
      .copy .report-section-heading:first-of-type {
        margin-top: 0;
      }
      .copy .report-project-line {
        margin: 0 0 5px;
        color: #091f33;
        line-height: 1.45;
        font-weight: 400;
      }
      .copy .report-project-line-main {
        font-size: 1.18rem;
        font-weight: 800;
      }
      .copy .report-project-line-secondary {
        font-size: 1rem;
        font-weight: 400;
      }
      .copy .report-project-line-main strong,
      .copy .report-project-line-main span {
        font-weight: 800;
      }
      .copy blockquote {
        margin: 0 0 12px;
        padding: 2px 0 2px 14px;
        border-left: 3px solid #9fb3c6;
        color: #334454;
        font-style: italic;
      }
      .copy font[size="5"] { font-size: 1.18em; }
      .copy font[size="4"] { font-size: 1.08em; }
      .copy font[size="3"] { font-size: 1em; }
      .copy font[size="2"] { font-size: 0.9em; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <div class="report-title-spacer" aria-hidden="true">&nbsp;</div>
    ${subtitleMarkup}
    <div class="copy">${body}</div>
  </body>
</html>`;
}

function openPrintableReport(state, reportTitle, reportMarkup, fileName) {
  const printWindow = window.open("", "_blank", "width=960,height=1200");
  if (!printWindow) {
    updateStorageStatus("Druckansicht konnte nicht geöffnet werden.");
    return false;
  }

  printWindow.document.write(buildPrintableReportHtml(reportTitle, "", reportMarkup, fileName, true));
  printWindow.document.close();
  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("printable-report-print-failed", error);
      updateStorageStatus("Druckansicht konnte nicht geöffnet werden.");
    }
  };
  if (printWindow.document.readyState === "complete") {
    window.setTimeout(triggerPrint, 120);
  } else {
    printWindow.addEventListener("load", () => window.setTimeout(triggerPrint, 120), { once: true });
  }
  return true;
}

function jumpToReportExportSection() {
  const target = document.getElementById("reportExportSection") || document.getElementById("reportExportButton");
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("jump-anchor-highlight");
  window.setTimeout(() => target.classList.remove("jump-anchor-highlight"), 1500);
  return true;
}

function exportSelectedReportByFormat(state) {
  try {
    updateStorageStatus("Berichtsexport wird vorbereitet ...");
    const reportState = mergeRiskReportDraftIntoState(mergeAiWorkshopFreeTextDraftIntoState(state));
    const reportTitle = getActiveReportTitle(reportState);
    const selection = getReportExportSelection(state);
    const baseName = sanitizeExportFileName(selection.fileName, reportTitle);
    const format = ["json", "txt", "doc", "pdf"].includes(selection.format) ? selection.format : getReportExportFormat(state);
    const rawReportDraft = normalizeRiskReportDraftText(String(reportState?.ui?.reportDraft || ""));
    const reportDraftCleared = reportState?.ui?.reportDraftCleared === true;
    const reportMarkup = rawReportDraft
      ? sanitizeReportDraftMarkup(rawReportDraft)
      : reportDraftCleared
        ? ""
        : sanitizeReportDraftMarkup(renderRiskReportText(reportState));
    const reportPlainText = reportDraftCleared
      ? ""
      : stripHtmlToPlainText(reportMarkup) || getRiskReportDraftText(reportState) || renderRiskReportText(reportState);

    if (format === "json") {
      const payload = {
        reportMode: "risk",
        reportTitle,
        generatedAt: new Date().toISOString(),
        reportText: reportPlainText,
        ...buildSelectedReportData(reportState)
      };
      if (!downloadFile(
        `${baseName}.json`,
        "application/json",
        JSON.stringify(payload, null, 2)
      )) return;
      updateStorageStatus("Bericht exportiert.");
      return;
    }

    if (format === "txt") {
      if (!downloadFile(
        `${baseName}.txt`,
        "text/plain",
        reportPlainText
      )) return;
      updateStorageStatus("Bericht exportiert.");
      return;
    }

    if (format === "doc") {
      if (!downloadFile(
        `${baseName}.doc`,
        "application/msword",
        buildPrintableReportHtml(reportTitle, "", reportMarkup, baseName, true)
      )) return;
      updateStorageStatus("Bericht exportiert.");
      return;
    }

    if (!openPrintableReport(reportState, reportTitle, reportMarkup, `${baseName}.pdf`)) {
      return;
    }
    updateStorageStatus("Bericht exportiert.");
  } catch (error) {
    console.error("report-export-failed", error);
    updateStorageStatus("Berichtsexport fehlgeschlagen.");
  }
}

function downloadFile(name, type, content) {
  try {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.rel = "noopener";
    link.style.position = "fixed";
    link.style.left = "-9999px";
    link.style.top = "0";
    document.body.appendChild(link);
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    });
    link.dispatchEvent(clickEvent);
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (error) {
    console.error("report-file-download-failed", error);
    updateStorageStatus("Berichtsexport fehlgeschlagen.");
    return false;
  }
}

const reportExportObjectUrls = new Set();

function createReportExportObjectUrl(content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  reportExportObjectUrls.add(url);
  return url;
}

function revokeReportExportObjectUrls() {
  for (const url of reportExportObjectUrls) {
    URL.revokeObjectURL(url);
  }
  reportExportObjectUrls.clear();
}

globalThis.__riskCreateReportExportObjectUrl = createReportExportObjectUrl;
globalThis.__riskRevokeReportExportObjectUrls = revokeReportExportObjectUrls;
globalThis.__riskExportSelectedReport = () => exportSelectedReportByFormat(store.getState());
globalThis.__riskJumpToReportExport = () => jumpToReportExportSection();
globalThis.__riskRegisterRecentProjectFiles = readRecentProjectFiles;
globalThis.__riskRegisterLoadRecentProjectFile = loadRecentProjectFileById;
globalThis.__riskRegisterDeleteRecentProjectFile = deleteRecentProjectFileById;
globalThis.__riskCollectProjectFileAudit = collectProjectFileAudit;
globalThis.__riskSetActiveModule = setActiveModule;
globalThis.__riskSaveAiSettings = () => {
  const nextAiSettings = normalizeAiSettings({
    ...readAiSettingsFromPanel(),
    apiKeyPreview: buildAiApiKeyPreview(String(document.getElementById("aiApiKey")?.value || "")) || aiSettings.apiKeyPreview || "",
    connected: aiSettings.connected,
    testing: false,
    lastStatus: aiSettings.lastStatus
  });
  nextAiSettings.lastSavedAt = new Date().toISOString();
  nextAiSettings.lastStatus = "Gespeichert. Verbindung wird geprüft ...";
  applyAiSettings(nextAiSettings, nextAiSettings.lastStatus);
  void startAiConnectionTest();
};
globalThis.__riskTestAiSettings = () => startAiConnectionTest();
globalThis.__riskDisconnectAiConnection = () => disconnectAiConnection();
globalThis.__riskDeleteAiApiKey = () => deleteAiApiKey();
globalThis.__riskToggleAiApiKeyVisibility = () => {
  aiApiKeyVisible = !aiApiKeyVisible;
  renderAiSettingsPanel();
};
globalThis.__riskBuildReportDraft = () => {
  const currentState = store.getState();
  const reportText = ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(renderRiskReportText(currentState)), currentState?.project?.name);
  setRiskReportDraftText(reportText, false);
  setReportDraftBaselineHtml(reportText, currentState?.project?.name);
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      reportDraft: normalizeRiskReportDraftText(reportText),
      reportDraftCleared: false
    }
  }));
  updateStorageStatus("Berichtsentwurf aus aktuellen Daten erzeugt.");
};
globalThis.__riskClearReportDraft = () => {
  setRiskReportDraftText("", false);
  reportDraftBaselineHtml = "";
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      reportDraft: "",
      reportDraftCleared: true
    }
  }));
  updateStorageStatus("Berichtsentwurf geleert.");
};
globalThis.__riskApplyReportDraftFormatting = (kind) => applyReportDraftFormatting(String(kind || ""));
globalThis.__riskRunAiWorkshop = (task) => runAiWorkshopTask(String(task || "risk-report"));
globalThis.__riskApplyAiReportResult = () => applyAiReportResult();
globalThis.__riskSendAiChat = (chatId) => runAiChatConversation(String(chatId || "fach"));
globalThis.__riskClearAiChat = (chatId) => clearAiChatConversation(String(chatId || "fach"));
globalThis.__riskPrefillAiChat = (chatId, text) => prefillAiChatDraft(String(chatId || "fach"), String(text ?? ""));
globalThis.__riskAskAiChat = (chatId, prompt) => askAiChatPrompt(String(chatId || "fach"), String(prompt ?? ""));
globalThis.__riskRegisterChartSort = (sortBy) => setRiskRegisterChartSort(String(sortBy || "priority"));
globalThis.__riskRegisterChartLimit = (limit) => setRiskRegisterChartLimit(Number(limit));

function exportSelectedReportJson(state) {
  const payload = buildSelectedReportData(state);
  const safeName = (state.project.name || "risk-report")
    .replace(/[^\wäöüÄÖÜß.-]+/g, "_")
    .replace(/_+/g, "_");
  downloadFile(
    `${safeName}_selected-report.json`,
    "application/json;charset=utf-8",
    JSON.stringify(payload, null, 2)
  );
}

function printRiskReport(state) {
  const reportState = mergeRiskReportDraftIntoState(mergeAiWorkshopFreeTextDraftIntoState(state));
  const reportTitle = "Risikobericht";
  const reportText = getRiskReportDraftText(reportState);
  openPrintableReport(
    reportState,
    `${reportTitle} · ${reportState.project?.name || "Projekt"}`,
    reportText,
    getReportExportBaseName(reportState)
  );
}

function renderProjectMeta(state) {
  const target = document.getElementById("projectMeta");
  if (!target) return;
  target.innerHTML = `
    <div class="meta-line"><strong>${state.project.name}</strong></div>
    <div class="meta-line">${state.project.type} · ${state.project.bauart}</div>
    <div class="meta-line">${state.project.location.city} · ${state.project.phase}</div>
    <div class="meta-line">Budget: <strong>${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(state.project.budget)}</strong></div>
    <div class="meta-line">Dateistatus: <strong>${state.ui.dirty ? "ungesichert" : "gesichert"}</strong></div>
  `;
  const projectExportField = document.getElementById("projectExportFileName");
  if (projectExportField && document.activeElement !== projectExportField) {
    const fileNameBase = formatProjectExportFileName(state.ui?.projectExportName || state.project.name || "project-controls-hub", state.project.name || "project-controls-hub");
    projectExportField.value = `${fileNameBase || "project-controls-hub"}.json`;
  }
}

function renderNav(state) {
  const target = document.getElementById("moduleNav");
  if (!target) return;
  const navOrder = ["project", "riskRegister", "reports", "ai"];
  const navModules = navOrder.map((key) => modules[key]).filter(Boolean);
  const navIcons = {
    project: `<svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5"></path><path d="M6 10.8V20h12v-9.2"></path><path d="M10 20v-5h4v5"></path></svg>`,
    riskRegister: `<svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M12 4 20 18H4z"></path><path d="M12 9v4"></path><path d="M12 16.8h.01"></path></svg>`,
    reports: `<svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M7 3.5h7.8L18.5 7v13.5H7z"></path><path d="M14.8 3.5V7H18.5"></path><path d="M9 10h6"></path><path d="M9 13h6"></path><path d="M9 16h4.5"></path></svg>`,
    ai: `<svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8-1.8 4.7-1.8-4.7-4.7-1.8 4.7-1.8z"></path><path d="M18.5 14.5l.8 2 .8-2 2-.8-2-.8-.8-2-.8 2-2 .8z"></path></svg>`
  };
  target.innerHTML = navModules.map((module) => `
    <button class="nav-btn ${state.ui.activeModule === module.key ? "active" : ""}" data-module="${module.key}" type="button" onclick="void globalThis.__riskSetActiveModule?.('${module.key}')">
      <span class="nav-btn-content">
        <span class="nav-icon" aria-hidden="true">${navIcons[module.key] || ""}</span>
        <span class="nav-label">${module.label}</span>
      </span>
    </button>
  `).join("");
}

function setActiveModule(moduleKey) {
  store.setState((state) => ({
    ...state,
    ui: { ...state.ui, activeModule: moduleKey }
  }));
}

function renderView(state) {
  const target = document.getElementById("appView");
  const active = modules[String(state.ui.activeModule || "project")];
  if (!target || !active) return;
  target.innerHTML = active.render(state);
}

function captureFormFieldFocus() {
  const activeElement = document.activeElement;
  if (!activeElement || typeof activeElement.matches !== "function") return null;
  const fieldSelectors = [
    "[data-risk-ui-field]",
    "[data-project-field]",
    "[data-project-location-field]",
    "[data-project-address-field]",
    "[data-report-field]",
    "[data-project-export-field]",
    "[data-report-export-field]",
    "[data-ai-chat-field]"
  ];
  const match = fieldSelectors.find((selector) => activeElement.matches(selector));
  if (!match) return null;
  return {
    selector: activeElement.id ? `#${CSS.escape(activeElement.id)}` : match,
    selectionStart: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
    selectionEnd: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null,
    value: activeElement.value
  };
}

function restoreFormFieldFocus(snapshot) {
  if (!snapshot?.selector) return;
  const target = document.querySelector(snapshot.selector);
  if (!target || typeof target.focus !== "function") return;
  target.focus({ preventScroll: true });
  if (typeof target.setSelectionRange === "function" && snapshot.selectionStart !== null && snapshot.selectionEnd !== null) {
    const valueLength = String(target.value || "").length;
    const start = Math.min(snapshot.selectionStart, valueLength);
    const end = Math.min(snapshot.selectionEnd, valueLength);
    try {
      target.setSelectionRange(start, end);
    } catch (_error) {
      // Some controls do not support selection ranges; ignore silently.
    }
  }
}

function focusReportDraftEditorAtStart() {
  pendingReportDraftFocus = "start";
}

function scrollElementToTop(target, offset = 12) {
  if (!(target instanceof HTMLElement)) return;
  const rect = target.getBoundingClientRect();
  const nextTop = Math.max(0, window.scrollY + rect.top - offset);
  window.scrollTo({ top: nextTop, behavior: "auto" });
}

function applyPendingReportDraftFocus() {
  if (!pendingReportDraftFocus) return;
  const mode = pendingReportDraftFocus;
  pendingReportDraftFocus = null;
  if (mode !== "start") return;
  window.setTimeout(() => window.requestAnimationFrame(() => {
    const editor = getReportDraftEditorElement();
    if (!(editor instanceof HTMLElement)) return;
    editor.focus({ preventScroll: true });
    const selection = window.getSelection?.();
    if (!selection || typeof document.createRange !== "function") return;
    const range = document.createRange();
    const walker = document.createTreeWalker(editor, window.NodeFilter?.SHOW_TEXT || 4);
    let firstTextNode = null;
    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (String(current?.nodeValue || "").trim()) {
        firstTextNode = current;
        break;
      }
    }
    if (firstTextNode) {
      range.setStart(firstTextNode, 0);
      range.collapse(true);
    } else {
      range.selectNodeContents(editor);
      range.collapse(true);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }), 0);
}

function applyAiReportResult() {
  const aiWorkshop = store.getState().ui?.aiWorkshop || {};
  const currentState = store.getState();
  const suggestion = String(aiWorkshop.resultText || "").trim();
  if (aiWorkshop.activeTask !== "risk-report" || !suggestion) {
    updateStorageStatus("Kein Berichtsvorschlag zum Übernehmen vorhanden.");
    return false;
  }
  const nextDraft = ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(suggestion), currentState?.project?.name);
  focusReportDraftEditorAtStart();
  setRiskReportDraftText(nextDraft, false);
  store.setState((state) => ({
    ...state,
    ui: {
      ...state.ui,
      reportDraft: normalizeRiskReportDraftText(nextDraft),
      reportDraftCleared: false
    }
  }));
  window.setTimeout(() => {
    const reportCard = document.querySelector?.(".report-output-card");
    if (reportCard instanceof HTMLElement) {
      reportCard.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, 0);
  updateStorageStatus("Berichtsvorschlag in den Entwurf übernommen.");
  return true;
}

function renderApp(state) {
  renderNav(state);
  renderProjectMeta(state);
  renderView(state);
  applyRiskRegisterPanelOrder(state?.ui?.riskRegisterView?.panelOrder);
  renderAiSettingsPanel();
  bindReportExportButton();
  bindReportApplyAiResultButton();
  bindRiskChartButtons();
  bindRiskMatrixButtons();
  if (lastAutosavedAt) {
    updateStorageStatus(`Autosave aktiv · ${formatTimestamp(lastAutosavedAt)}`);
  }
  applyPendingReportDraftFocus();
}

function bindReportExportButton() {
  const button = document.getElementById("reportExportButton");
  if (!button || button.dataset.boundExportHandler === "1" || button.tagName !== "BUTTON" || button.getAttribute("data-action") === "export-selected-report") return;
  button.dataset.boundExportHandler = "1";
  button.addEventListener("click", () => {
    void exportSelectedReportByFormat(store.getState());
  });
}

function bindReportApplyAiResultButton() {
  const button = document.querySelector?.('button[data-action="apply-ai-report-result"]');
  if (!button || button.dataset.boundApplyReportHandler === "1" || button.tagName !== "BUTTON") return;
  button.dataset.boundApplyReportHandler = "1";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    applyAiReportResult();
  });
}

function bindRiskChartButtons() {
  const buttons = document.querySelectorAll?.(".risk-fold-chart .risk-chart-chip[data-action]");
  if (!buttons?.length) return;
  buttons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.boundRiskChartHandler === "1") return;
    button.dataset.boundRiskChartHandler = "1";
    const handleChartAction = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const action = String(button.dataset.action || "");
      if (action === "set-risk-register-chart-sort" || action === "set-risk-register-sort") {
        setRiskRegisterChartSort(String(button.dataset.sortBy || "priority"), event);
        return;
      }
      if (action === "set-risk-register-chart-limit" || action === "set-risk-register-limit") {
        setRiskRegisterChartLimit(Number(button.dataset.limit || 5), event);
      }
    };
    button.addEventListener("pointerdown", handleChartAction);
    button.addEventListener("click", handleChartAction);
  });
}

function bindRiskMatrixButtons() {
  const buttons = document.querySelectorAll?.(".risk-register-card .risk-matrix-button[data-action]");
  if (!buttons?.length) return;
  buttons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.boundRiskMatrixHandler === "1") return;
    button.dataset.boundRiskMatrixHandler = "1";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.action !== "select-risk-register-matrix-cell") return;
      const likelihood = Number(button.dataset.likelihood || 0);
      const impact = Number(button.dataset.impact || 0);
      if (!Number.isInteger(likelihood) || !Number.isInteger(impact)) return;
      store.setState((state) => {
        const current = state.ui?.riskRegisterView?.matrixSelection || null;
        const sameCell = current && current.likelihood === likelihood && current.impact === impact;
        return {
          ...state,
          ui: {
            ...state.ui,
            riskRegisterView: {
              ...state.ui.riskRegisterView,
              matrixSelection: sameCell ? null : { likelihood, impact }
            }
          }
        };
      });
    });
  });
}

function parseValue(currentValue, rawValue) {
  if (typeof currentValue === "number") {
    const normalized = String(rawValue ?? "")
      .trim()
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : currentValue;
  }
  return rawValue;
}

function parseFlexibleNumber(rawValue) {
  const normalized = String(rawValue ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeClientRoles(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((role) => String(role || "").trim()).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(new Set(value.split(/[|,]/).map((role) => String(role || "").trim()).filter(Boolean)));
  }
  return [];
}

function normalizeClientFunctions(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((role) => String(role || "").trim()).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(new Set(value.split(/[|,]/).map((role) => String(role || "").trim()).filter(Boolean)));
  }
  return [];
}

function createRiskRegisterItem() {
  return {
    id: "R-0001",
    createdAt: new Date().toISOString(),
    title: "Neues Risiko",
    description: "",
    phase: "",
    category: normalizeRiskCategoryValue(riskCategoryOptions[4] || "Projekt- und Managementrisiken"),
    area: "",
    financialImpact: 0,
    probabilityPercent: 0,
    expectedDamage: 0,
    likelihood: 1,
    impact: 3,
    qualitativeRiskValue: 3,
    owner: "",
    measures: "",
    dueDate: "",
    status: "offen",
    residualRisk: ""
  };
}

function normalizeRiskRegisterEntries(risks = []) {
  const baseTime = Date.now();
  return (Array.isArray(risks) ? risks : []).map((risk, index) => ({
    ...risk,
    archivedAt: normalizeRiskStatusValue(risk?.status) === "archiviert"
      ? (typeof risk?.archivedAt === "string" && risk.archivedAt.trim() ? risk.archivedAt : new Date(baseTime - ((risks.length - index) * 1000)).toISOString())
      : "",
    archivedReason: normalizeRiskStatusValue(risk?.status) === "archiviert"
      ? (typeof risk?.archivedReason === "string" && risk.archivedReason.trim() ? risk.archivedReason : "Nicht mehr eintretbar durch Baufortschritt")
      : "",
    archivedFromStatus: normalizeRiskStatusValue(risk?.status) === "archiviert"
      ? (typeof risk?.archivedFromStatus === "string" && risk.archivedFromStatus.trim() ? risk.archivedFromStatus : "offen")
      : "",
    createdAt: typeof risk?.createdAt === "string" && risk.createdAt.trim()
      ? risk.createdAt
      : new Date(baseTime - ((risks.length - index) * 1000)).toISOString()
  }));
}

function sortRiskRegisterEntriesForEdit(risks = [], sortBy = "newest") {
  const items = [...normalizeRiskRegisterEntries(risks)];
  const riskNumber = (risk) => {
    const match = String(risk.id || "").match(/^R-(\d{4})$/i);
    return match ? Number(match[1]) || 0 : 0;
  };
  if (sortBy === "id") {
    return items.sort((a, b) => riskNumber(a) - riskNumber(b) || String(a.id || "").localeCompare(String(b.id || ""), "de"));
  }
  return items.sort((a, b) => {
    const aNo = riskNumber(a);
    const bNo = riskNumber(b);
    if (aNo !== bNo) return bNo - aNo;
    const aTs = Date.parse(a.createdAt || "");
    const bTs = Date.parse(b.createdAt || "");
    if (Number.isFinite(aTs) && Number.isFinite(bTs) && aTs !== bTs) return bTs - aTs;
    return String(b.id || "").localeCompare(String(a.id || ""), "de");
  });
}

function nextRiskRegisterId(risks = []) {
  const maxNumber = risks.reduce((max, risk) => {
    const match = String(risk.id || "").match(/^R-(\d{4})$/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]) || 0);
  }, 0);
  return `R-${String(maxNumber + 1).padStart(4, "0")}`;
}

function toggleSelection(list, value, checked) {
  const next = new Set(list || []);
  if (checked) next.add(value);
  else next.delete(value);
  return [...next];
}

function moveItem(list, fromIndex, toIndex) {
  const items = Array.isArray(list) ? [...list] : [];
  if (!items.length) return items;
  const from = Math.max(0, Math.min(items.length - 1, Number(fromIndex)));
  const to = Math.max(0, Math.min(items.length - 1, Number(toIndex)));
  if (from === to) return items;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
  return items;
}

function bindEvents() {
  document.addEventListener("pointerdown", (event) => {
    const handle = event.target?.closest?.("[data-risk-panel-drag-handle]");
    if (!handle || event.button !== 0) return;
    const panel = handle.closest("[data-risk-panel-key]");
    const panelKey = panel?.getAttribute("data-risk-panel-key");
    if (!panelKey) return;
    draggedRiskPanelKey = panelKey;
    draggedRiskPanelPointerId = event.pointerId ?? null;
    draggedRiskPanelElement = panel;
    draggedRiskPanelStartX = event.clientX ?? 0;
    draggedRiskPanelStartY = event.clientY ?? 0;
    draggedRiskPanelPreviewOrder = normalizeRiskRegisterPanelOrder(store.getState().ui?.riskRegisterView?.panelOrder);
    clearRiskRegisterDropIndicator();
    const rect = panel.getBoundingClientRect();
    const summaryRect = panel.querySelector("summary")?.getBoundingClientRect?.();
    draggedRiskPanelOriginalHeight = panel.style.height || "";
    draggedRiskPanelOriginalOverflow = panel.style.overflow || "";
    panel.style.pointerEvents = "none";
    panel.style.position = "fixed";
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.width = `${rect.width}px`;
    panel.style.margin = "0";
    panel.style.zIndex = "30";
    panel.style.height = `${Math.max(56, Math.round(summaryRect?.height || rect.height))}px`;
    panel.style.overflow = "hidden";
    panel?.classList?.add?.("is-dragging");
    document.body?.classList?.add?.("risk-panel-dragging");
    if (typeof handle.setPointerCapture === "function" && draggedRiskPanelPointerId !== null) {
      try {
        handle.setPointerCapture(draggedRiskPanelPointerId);
      } catch (_error) {
        // Ignore pointer capture errors.
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!draggedRiskPanelElement) return;
    if (draggedRiskPanelPointerId !== null && event.pointerId !== draggedRiskPanelPointerId) return;
    const dx = (event.clientX ?? 0) - draggedRiskPanelStartX;
    const dy = (event.clientY ?? 0) - draggedRiskPanelStartY;
    draggedRiskPanelElement.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
    let panel = targetElement?.closest?.("[data-risk-panel-key]");
    const panelsByPosition = getRiskRegisterPanelsByPosition();
    if (!panel && panelsByPosition.length) {
      const y = event.clientY ?? 0;
      const first = panelsByPosition[0];
      const last = panelsByPosition[panelsByPosition.length - 1];
      if (y <= first.rect.top) {
        panel = first.panel;
      } else if (y >= last.rect.bottom) {
        panel = last.panel;
      } else {
        panel = panelsByPosition.find(({ rect }) => y >= rect.top && y <= rect.bottom)?.panel
          || panelsByPosition.reduce((closest, current) => {
            if (!closest) return current;
            const closestDistance = Math.abs(y - (closest.rect.top + closest.rect.height / 2));
            const currentDistance = Math.abs(y - (current.rect.top + current.rect.height / 2));
            return currentDistance < closestDistance ? current : closest;
          }, null)?.panel || null;
      }
    }
    if (!panel) return;
    const targetKey = panel.getAttribute("data-risk-panel-key");
    if (!targetKey || targetKey === draggedRiskPanelKey) return;
    const rect = panel.getBoundingClientRect();
    const placeAfter = (event.clientY ?? 0) > rect.top + (rect.height / 2);
    const nextOrder = moveItemRelative(
      draggedRiskPanelPreviewOrder || normalizeRiskRegisterPanelOrder(store.getState().ui?.riskRegisterView?.panelOrder),
      draggedRiskPanelKey,
      targetKey,
      placeAfter
    );
    if (sameRiskPanelOrder(nextOrder, draggedRiskPanelPreviewOrder)) return;
    draggedRiskPanelPreviewOrder = nextOrder;
    applyRiskRegisterPanelOrder(nextOrder);
    setRiskRegisterDropIndicator(targetKey, placeAfter, event.clientY ?? null);
  }, true);

  document.addEventListener("pointerup", (event) => {
    if (!draggedRiskPanelKey) return;
    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
    let panel = targetElement?.closest?.("[data-risk-panel-key]");
    const panelsByPosition = getRiskRegisterPanelsByPosition();
    if (!panel && panelsByPosition.length) {
      const y = event.clientY ?? 0;
      const first = panelsByPosition[0];
      const last = panelsByPosition[panelsByPosition.length - 1];
      if (y <= first.rect.top) {
        panel = first.panel;
      } else if (y >= last.rect.bottom) {
        panel = last.panel;
      } else {
        panel = panelsByPosition.find(({ rect }) => y >= rect.top && y <= rect.bottom)?.panel
          || panelsByPosition.reduce((closest, current) => {
            if (!closest) return current;
            const closestDistance = Math.abs(y - (closest.rect.top + closest.rect.height / 2));
            const currentDistance = Math.abs(y - (current.rect.top + current.rect.height / 2));
            return currentDistance < closestDistance ? current : closest;
          }, null)?.panel || null;
      }
    }
    if (!panel) {
      restoreDraggedRiskPanelStyles();
      document.body?.classList?.remove?.("risk-panel-dragging");
      clearRiskRegisterDropIndicator();
      draggedRiskPanelKey = null;
      draggedRiskPanelPointerId = null;
      draggedRiskPanelElement = null;
      return;
    }
    const targetKey = panel.getAttribute("data-risk-panel-key");
    if (!targetKey || targetKey === draggedRiskPanelKey) {
      restoreDraggedRiskPanelStyles();
      document.body?.classList?.remove?.("risk-panel-dragging");
      clearRiskRegisterDropIndicator();
      draggedRiskPanelKey = null;
      draggedRiskPanelPointerId = null;
      draggedRiskPanelElement = null;
      return;
    }
    const rect = panel.getBoundingClientRect();
    const placeAfter = event.clientY > rect.top + (rect.height / 2);
    store.setState((state) => {
      const currentOrder = normalizeRiskRegisterPanelOrder(state.ui?.riskRegisterView?.panelOrder);
      const nextOrder = draggedRiskPanelPreviewOrder
        ? draggedRiskPanelPreviewOrder
        : moveItemRelative(currentOrder, draggedRiskPanelKey, targetKey, placeAfter);
      return {
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            panelOrder: nextOrder
          }
        }
      };
    });
    setRiskRegisterDropIndicator(targetKey, placeAfter, event.clientY ?? null);
    restoreDraggedRiskPanelStyles();
    document.body?.classList?.remove?.("risk-panel-dragging");
    clearRiskRegisterDropIndicator();
    draggedRiskPanelKey = null;
    draggedRiskPanelPointerId = null;
    draggedRiskPanelElement = null;
    draggedRiskPanelPreviewOrder = null;
  }, true);

  document.addEventListener("pointercancel", () => {
    restoreDraggedRiskPanelStyles();
    document.body?.classList?.remove?.("risk-panel-dragging");
    clearRiskRegisterDropIndicator();
    draggedRiskPanelKey = null;
    draggedRiskPanelPointerId = null;
    draggedRiskPanelElement = null;
    draggedRiskPanelPreviewOrder = null;
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const handle = event.target?.closest?.("[data-ai-panel-drag-handle]");
    if (!handle || event.button !== 0) return;
    const panel = handle.closest("[data-ai-panel-key]");
    const panelKey = panel?.getAttribute("data-ai-panel-key");
    if (!panelKey) return;
    draggedAiPanelKey = panelKey;
    draggedAiPanelPointerId = event.pointerId ?? null;
    draggedAiPanelElement = panel;
    draggedAiPanelStartX = event.clientX ?? 0;
    draggedAiPanelStartY = event.clientY ?? 0;
    draggedAiPanelPreviewOrder = normalizeAiPanelOrder(aiPanelOrder);
    clearAiDropIndicator();
    const rect = panel.getBoundingClientRect();
    const summaryRect = panel.querySelector("summary")?.getBoundingClientRect?.();
    draggedAiPanelOriginalHeight = panel.style.height || "";
    draggedAiPanelOriginalOverflow = panel.style.overflow || "";
    panel.style.pointerEvents = "none";
    panel.style.position = "fixed";
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.width = `${rect.width}px`;
    panel.style.margin = "0";
    panel.style.zIndex = "30";
    panel.style.height = `${Math.max(56, Math.round(summaryRect?.height || rect.height))}px`;
    panel.style.overflow = "hidden";
    panel?.classList?.add?.("is-dragging");
    document.body?.classList?.add?.("risk-panel-dragging");
    if (typeof handle.setPointerCapture === "function" && draggedAiPanelPointerId !== null) {
      try {
        handle.setPointerCapture(draggedAiPanelPointerId);
      } catch (_error) {
        // Ignore pointer capture errors.
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!draggedAiPanelElement) return;
    if (draggedAiPanelPointerId !== null && event.pointerId !== draggedAiPanelPointerId) return;
    const dx = (event.clientX ?? 0) - draggedAiPanelStartX;
    const dy = (event.clientY ?? 0) - draggedAiPanelStartY;
    draggedAiPanelElement.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
    let panel = targetElement?.closest?.("[data-ai-panel-key]");
    const panelsByPosition = getAiPanelsByPosition();
    if (!panel && panelsByPosition.length) {
      const y = event.clientY ?? 0;
      const first = panelsByPosition[0];
      const last = panelsByPosition[panelsByPosition.length - 1];
      if (y <= first.rect.top) {
        panel = first.panel;
      } else if (y >= last.rect.bottom) {
        panel = last.panel;
      } else {
        panel = panelsByPosition.find(({ rect }) => y >= rect.top && y <= rect.bottom)?.panel
          || panelsByPosition.reduce((closest, current) => {
            if (!closest) return current;
            const closestDistance = Math.abs(y - (closest.rect.top + closest.rect.height / 2));
            const currentDistance = Math.abs(y - (current.rect.top + current.rect.height / 2));
            return currentDistance < closestDistance ? current : closest;
          }, null)?.panel || null;
      }
    }
    if (!panel) return;
    const targetKey = panel.getAttribute("data-ai-panel-key");
    if (!targetKey || targetKey === draggedAiPanelKey) return;
    const rect = panel.getBoundingClientRect();
    const placeAfter = (event.clientY ?? 0) > rect.top + (rect.height / 2);
    const nextOrder = moveAiPanelRelative(
      draggedAiPanelPreviewOrder || normalizeAiPanelOrder(aiPanelOrder),
      draggedAiPanelKey,
      targetKey,
      placeAfter
    );
    if (sameAiPanelOrder(nextOrder, draggedAiPanelPreviewOrder)) return;
    draggedAiPanelPreviewOrder = nextOrder;
    applyAiPanelOrder(nextOrder);
    setAiDropIndicator(targetKey, placeAfter, event.clientY ?? null);
  }, true);

  document.addEventListener("pointerup", (event) => {
    if (!draggedAiPanelKey) return;
    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
    let panel = targetElement?.closest?.("[data-ai-panel-key]");
    const panelsByPosition = getAiPanelsByPosition();
    if (!panel && panelsByPosition.length) {
      const y = event.clientY ?? 0;
      const first = panelsByPosition[0];
      const last = panelsByPosition[panelsByPosition.length - 1];
      if (y <= first.rect.top) {
        panel = first.panel;
      } else if (y >= last.rect.bottom) {
        panel = last.panel;
      } else {
        panel = panelsByPosition.find(({ rect }) => y >= rect.top && y <= rect.bottom)?.panel
          || panelsByPosition.reduce((closest, current) => {
            if (!closest) return current;
            const closestDistance = Math.abs(y - (closest.rect.top + closest.rect.height / 2));
            const currentDistance = Math.abs(y - (current.rect.top + current.rect.height / 2));
            return currentDistance < closestDistance ? current : closest;
          }, null)?.panel || null;
      }
    }
    if (!panel) {
      restoreDraggedAiPanelStyles();
      document.body?.classList?.remove?.("risk-panel-dragging");
      clearAiDropIndicator();
      draggedAiPanelKey = null;
      draggedAiPanelPointerId = null;
      draggedAiPanelElement = null;
      return;
    }
    const targetKey = panel.getAttribute("data-ai-panel-key");
    if (!targetKey || targetKey === draggedAiPanelKey) {
      restoreDraggedAiPanelStyles();
      document.body?.classList?.remove?.("risk-panel-dragging");
      clearAiDropIndicator();
      draggedAiPanelKey = null;
      draggedAiPanelPointerId = null;
      draggedAiPanelElement = null;
      return;
    }
    const rect = panel.getBoundingClientRect();
    const placeAfter = event.clientY > rect.top + (rect.height / 2);
    const nextOrder = draggedAiPanelPreviewOrder
      ? draggedAiPanelPreviewOrder
      : moveAiPanelRelative(normalizeAiPanelOrder(aiPanelOrder), draggedAiPanelKey, targetKey, placeAfter);
    persistAiPanelOrder(nextOrder);
    applyAiPanelOrder(nextOrder);
    setAiDropIndicator(targetKey, placeAfter, event.clientY ?? null);
    restoreDraggedAiPanelStyles();
    document.body?.classList?.remove?.("risk-panel-dragging");
    clearAiDropIndicator();
    draggedAiPanelKey = null;
    draggedAiPanelPointerId = null;
    draggedAiPanelElement = null;
    draggedAiPanelPreviewOrder = null;
  }, true);

  document.addEventListener("pointercancel", () => {
    restoreDraggedAiPanelStyles();
    document.body?.classList?.remove?.("risk-panel-dragging");
    clearAiDropIndicator();
    draggedAiPanelKey = null;
    draggedAiPanelPointerId = null;
    draggedAiPanelElement = null;
    draggedAiPanelPreviewOrder = null;
  }, true);

  document.addEventListener("toggle", (event) => {
    const details = event.target;
    if (!(details instanceof HTMLElement)) return;
    if (details.matches?.("[data-ai-panel-key]")) {
      const panelKey = details.getAttribute("data-ai-panel-key");
      if (!panelKey) return;
      const currentOpenStates = normalizeAiPanelOpenStates(store.getState().ui?.aiPanelOpenStates);
      if (currentOpenStates[panelKey] === details.open) return;
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          aiPanelOpenStates: {
            ...normalizeAiPanelOpenStates(state.ui?.aiPanelOpenStates),
            [panelKey]: details.open
          }
        }
      }));
      return;
    }
    if (details.matches("[data-risk-panel-key]")) {
      const panelKey = details.getAttribute("data-risk-panel-key");
      if (!panelKey) return;
      if (!details.open && suppressedRiskPanelCloseKeys.has(panelKey)) {
        suppressedRiskPanelCloseKeys.delete(panelKey);
        details.open = true;
        return;
      }
      const currentOpenStates = normalizeRiskRegisterPanelOpenStates(store.getState().ui?.riskRegisterView?.panelOpenStates);
      if (currentOpenStates[panelKey] === details.open) return;
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            panelOpenStates: {
              ...normalizeRiskRegisterPanelOpenStates(state.ui?.riskRegisterView?.panelOpenStates),
              [panelKey]: details.open
            }
          }
        }
      }));
      return;
    }
    if (details.matches(".risk-edit-fold")) {
      if (details.open) {
        document.querySelectorAll(".risk-edit-list .risk-edit-fold[open]").forEach((item) => {
          if (item !== details) {
            item.open = false;
          }
        });
      }
      return;
    }
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const riskPanelBodyInteractiveTarget = event.target.closest?.(".risk-fold-body button, .risk-fold-body [data-action], .risk-fold-body a, .risk-fold-body input, .risk-fold-body select, .risk-fold-body textarea, .risk-fold-body [data-risk-ui-field]");
    if (!riskPanelBodyInteractiveTarget) return;
    const riskPanel = riskPanelBodyInteractiveTarget.closest?.("[data-risk-panel-key]");
    const riskPanelKey = riskPanel?.getAttribute?.("data-risk-panel-key");
    suppressRiskPanelClose(riskPanelKey, 1800);
  }, true);

  document.addEventListener("click", (event) => {
    const summaryActionTarget = event.target.closest?.(".risk-fold-summary [data-action], .risk-fold-summary button, .risk-fold-summary a, .risk-fold-summary input, .risk-fold-summary select, .risk-fold-summary textarea, .risk-fold-summary [data-risk-panel-drag-handle], .risk-fold-summary [data-ai-panel-drag-handle]");
    if (summaryActionTarget) {
      event.preventDefault();
    }
  }, true);

  document.addEventListener("click", (event) => {
    const staticSummaryTarget = event.target.closest?.(".risk-fold-static .risk-fold-summary");
    if (!staticSummaryTarget) return;
    const panel = staticSummaryTarget.closest?.("[data-risk-panel-key]");
    const panelKey = panel?.getAttribute?.("data-risk-panel-key");
    if (!["chart", "matrix"].includes(panelKey || "")) return;
    if (event.target.closest?.("[data-risk-panel-drag-handle], button, a, input, select, textarea, [data-action]")) return;
    event.preventDefault();
    event.stopPropagation();
    if (panel instanceof HTMLElement) {
      panel.open = !panel.open;
    }
  }, true);

  document.addEventListener("click", (event) => {
    const riskPanelBodyInteractiveTarget = event.target.closest?.(".risk-fold-body button, .risk-fold-body [data-action], .risk-fold-body a, .risk-fold-body input, .risk-fold-body select, .risk-fold-body textarea, .risk-fold-body [data-risk-ui-field]");
    if (riskPanelBodyInteractiveTarget) {
      const riskPanel = riskPanelBodyInteractiveTarget.closest?.("[data-risk-panel-key]");
      const riskPanelKey = riskPanel?.getAttribute?.("data-risk-panel-key");
      suppressRiskPanelClose(riskPanelKey, 1800);
    }

    const internalRiskPanelTarget = event.target.closest?.(".risk-fold-body button, .risk-fold-body input, .risk-fold-body select, .risk-fold-body textarea, .risk-fold-body a, .risk-fold-body [data-action], .risk-fold-body [data-risk-ui-field]");
    if (internalRiskPanelTarget) {
      const openPanelKeysBeforeClick = [...document.querySelectorAll?.(".risk-fold-card[open][data-risk-panel-key]") || []]
        .filter((panel) => panel instanceof HTMLElement)
        .map((panel) => panel.getAttribute("data-risk-panel-key"))
        .filter(Boolean);
      if (openPanelKeysBeforeClick.length) {
        window.setTimeout(() => {
          const currentOpenStates = normalizeRiskRegisterPanelOpenStates(store.getState().ui?.riskRegisterView?.panelOpenStates);
          const nextOpenStates = { ...currentOpenStates };
          let hasChange = false;
          for (const panelKey of openPanelKeysBeforeClick) {
            if (nextOpenStates[panelKey] !== true) {
              nextOpenStates[panelKey] = true;
              hasChange = true;
            }
          }
          if (hasChange) {
            store.setState((state) => ({
              ...state,
              ui: {
                ...state.ui,
                riskRegisterView: {
                  ...state.ui.riskRegisterView,
                  panelOpenStates: nextOpenStates
                }
              }
            }));
          }
        }, 0);
      }
    }

    const dragHandle = event.target.closest?.("[data-risk-panel-drag-handle], [data-ai-panel-drag-handle]");
    if (dragHandle) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const launcherTarget = event.target.closest?.('[data-action="toggle-secondary-launcher"]');
    const secondaryMenu = document.getElementById("secondaryLauncherMenu");
    const clickedInsideLauncher = event.target.closest?.(".secondary-launcher-wrap");
    if (secondaryMenu && !secondaryMenu.hidden && !launcherTarget && !event.target.closest?.('[data-action="reveal-secondary-panel"]') && !clickedInsideLauncher) {
      secondaryMenu.hidden = true;
      document.querySelectorAll?.('[data-action="toggle-secondary-launcher"]').forEach((button) => {
        if (button instanceof HTMLElement) {
          button.setAttribute("aria-expanded", "false");
        }
      });
    }

    if (launcherTarget) {
      const isOpen = !secondaryMenu || !secondaryMenu.hidden;
      if (secondaryMenu) secondaryMenu.hidden = isOpen;
      launcherTarget.setAttribute("aria-expanded", String(!isOpen));
      return;
    }

    const launcherOption = event.target.closest?.('[data-action="reveal-secondary-panel"]');
    if (launcherOption) {
      const panelId = launcherOption.getAttribute("data-panel-id");
      if (panelId === "aiConnectionPanel") {
        setSecondaryPanelVisibility(panelId, true);
        const panel = document.getElementById(panelId);
        panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      }
      if (secondaryMenu) secondaryMenu.hidden = true;
      document.querySelectorAll?.('[data-action="toggle-secondary-launcher"]').forEach((button) => {
        if (button instanceof HTMLElement) {
          button.setAttribute("aria-expanded", "false");
        }
      });
      return;
    }

    const moduleButton = event.target.closest("[data-module]");
    if (moduleButton) {
      const moduleKey = moduleButton.getAttribute("data-module");
      store.setState((state) => ({
        ...state,
        ui: { ...state.ui, activeModule: moduleKey }
      }));
      return;
    }

    if (event.target.id === "saveProjectBtn") {
      saveProjectFile(store.getState());
      store.markSaved();
      persistAutosave(store.getState());
      updateStorageStatus(formatProjectFileAuditMessage(`Projektdatei exportiert · ${formatTimestamp(store.getState().ui.lastSavedAt)}`, collectProjectFileAudit(store.getState())));
      return;
    }

    if (event.target.id === "loadProjectBtn") {
      updateStorageStatus("Bitte eine Projektdatei auswählen.");
      openProjectFilePicker();
      return;
    }

    if (event.target.id === "loadDemoBtn") {
      const next = cloneState();
      next.ui.activeModule = "project";
      store.setState(next);
      store.markSaved();
      persistAutosave(store.getState());
      updateStorageStatus("Demo-Datei geladen und als Autosave gespeichert.");
      return;
    }

    if (event.target.id === "resetProjectBtn") {
      const resetProject = window.confirm("Projektstand zurücksetzen?");
      if (!resetProject) return;
      const next = createNeutralProjectState();
      store.setState(next);
      store.markSaved();
      updateStorageStatus("Projektstand zurückgesetzt. Alle Felder sind geleert.");
      return;
    }

    const actionTarget = event.target.closest("[data-action]");
    if (actionTarget?.dataset.action === "load-recent-project") {
      const recentId = actionTarget.getAttribute("data-recent-project-id");
      if (recentId) void loadRecentProjectFileById(recentId);
      return;
    }

    if (actionTarget?.dataset.action === "delete-recent-project") {
      const recentId = actionTarget.getAttribute("data-recent-project-id");
      if (recentId) {
        void deleteRecentProjectFileById(recentId);
      }
      return;
    }

    if (actionTarget && actionTarget.closest("summary")) {
      event.preventDefault();
      event.stopPropagation();
    }
    const reportFormatTarget = event.target.closest("[data-report-format-action]");
    if (reportFormatTarget) {
      event.preventDefault();
      applyReportDraftFormatting(String(reportFormatTarget.dataset.reportFormatAction || ""));
      return;
    }
    if (actionTarget && (actionTarget.dataset.action === "remove-mc-work" || actionTarget.dataset.action === "remove-mc-risk")) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (actionTarget?.dataset.action === "export-risk-json") {
      exportSelectedReportJson(store.getState());
      updateStorageStatus("Risikobericht exportiert.");
      return;
    }

    if (actionTarget?.dataset.action === "close-risk-register-panels") {
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            panelOpenStates: {
              overview: false,
              ai: false,
              edit: false,
              table: false,
              chart: false,
              matrix: false
            }
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "reset-risk-register-panel-order") {
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            panelOrder: ["overview", "edit", "ai", "table", "chart", "matrix"],
            panelOpenStates: {
              overview: false,
              ai: false,
              edit: false,
              table: false,
              chart: false,
              matrix: false
            }
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "restore-risk-register-panel-order") {
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            panelOrder: ["overview", "edit", "ai", "table", "chart", "matrix"]
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "export-project-json") {
      saveProjectFile(store.getState());
      store.markSaved();
      persistAutosave(store.getState());
      updateStorageStatus(formatProjectFileAuditMessage(`Projektdatei exportiert · ${formatTimestamp(store.getState().ui.lastSavedAt)}`, collectProjectFileAudit(store.getState())));
      return;
    }

    if (actionTarget?.dataset.action === "build-report-draft") {
      const currentState = store.getState();
      const reportText = ensureRiskReportProjectLine(ensureRiskReportDraftHintSection(renderRiskReportText(currentState)), currentState?.project?.name);
      setRiskReportDraftText(reportText, false);
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          reportDraft: normalizeRiskReportDraftText(reportText),
          reportDraftCleared: false
        }
      }));
      updateStorageStatus("Berichtsentwurf aus aktuellen Daten erzeugt.");
      return;
    }

    if (actionTarget?.dataset.action === "clear-report-draft") {
      setRiskReportDraftText("", false);
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          reportDraft: "",
          reportDraftCleared: true
        }
      }));
      updateStorageStatus("Berichtsentwurf geleert.");
      return;
    }

    if (actionTarget?.dataset.action === "apply-ai-report-result") {
      applyAiReportResult();
      return;
    }

    if (actionTarget?.dataset.action === "export-selected-report") {
      void exportSelectedReportByFormat(store.getState());
      return;
    }

    if (actionTarget?.dataset.action === "run-ai-workshop") {
      runAiWorkshopTask(String(actionTarget.dataset.aiWorkshopTask || "risk-report"));
      return;
    }

    if (actionTarget?.dataset.action === "apply-ai-workshop-result") {
      const aiWorkshop = store.getState().ui?.aiWorkshop || {};
      if (aiWorkshop.activeTask === "measures-residual" && !String(aiWorkshop.selectedRiskId || "").trim()) {
        updateStorageStatus("Bitte zuerst ein Zielrisiko wählen.");
        return;
      }
      if (!applyAiWorkshopSelectedResult()) {
        updateStorageStatus(aiWorkshop.activeTask === "measures-residual"
          ? "Die KI-Vorschläge konnten nicht übernommen werden."
          : "Keine KI-Vorschläge zum Übernehmen vorhanden.");
        return;
      }
      updateStorageStatus(aiWorkshop.activeTask === "measures-residual"
        ? "KI-Maßnahmen im Zielrisiko übernommen."
        : "Vorschlag als neues Risiko übernommen.");
      return;
    }

    if (actionTarget?.dataset.action === "apply-ai-workshop-risks") {
      if (!applyAiWorkshopRisksToRegister()) {
        updateStorageStatus("Keine KI-Vorschläge zum Übernehmen vorhanden.");
      } else {
        updateStorageStatus("Vorschlag als neues Risiko übernommen.");
      }
      return;
    }

    if (actionTarget?.dataset.action === "apply-ai-workshop-measures") {
      if (!applyAiWorkshopMeasuresToRisk()) {
        updateStorageStatus("Bitte zuerst ein Zielrisiko wählen und einen KI-Vorschlag erzeugen.");
      } else {
        updateStorageStatus("KI-Maßnahmen im Zielrisiko übernommen.");
      }
      return;
    }

    if (actionTarget?.dataset.action === "clear-ai-workshop-result") {
      const aiWorkshop = store.getState().ui?.aiWorkshop || {};
      const isQuestionTask = String(aiWorkshop.activeTask || "").startsWith("question-");
      setAiWorkshopState({
        ...aiWorkshop,
        busy: false,
        resultTitle: "KI bereit",
        resultText: isQuestionTask ? "Wähle eine Schnellfrage für die KI-Ausgabe." : "Wähle eine Funktion für die KI-Startstufe.",
        resultTone: "neutral",
        resultData: null
      });
      updateStorageStatus("KI-Vorschlag verworfen.");
      return;
    }

    if (actionTarget?.dataset.action === "print-risk-report") {
      printRiskReport(store.getState());
      return;
    }

    if (actionTarget?.dataset.action === "jump-to-monte-p80") {
      return;
    }

    if (actionTarget?.dataset.action === "jump-to-report-target") {
      jumpToReportTarget(actionTarget.dataset.targetModule, actionTarget.dataset.targetId);
      updateStorageStatus("Berichtsverweis geöffnet.");
      return;
    }

    if (actionTarget?.dataset.action === "toggle-risk-register-column") {
      const column = String(actionTarget.dataset.column || "");
      if (!column) return;
      store.setState((state) => {
        const current = state.ui?.riskRegisterView?.visibleColumns || [];
        const next = current.includes(column)
          ? current.filter((item) => item !== column)
          : [...current, column];
        return {
          ...state,
          ui: {
            ...state.ui,
            riskRegisterView: {
              ...state.ui.riskRegisterView,
              visibleColumns: next
            }
          }
        };
      });
      window.requestAnimationFrame(() => {
        const tableWrap = document.querySelector(".risk-register-table-wrap");
        if (tableWrap) {
          tableWrap.scrollLeft = 0;
        }
      });
      return;
    }

    if (actionTarget?.dataset.action === "set-risk-register-folds") {
      const foldAllOpen = actionTarget.dataset.folds === "open";
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            foldAllOpen,
            panelOpenStates: {
              overview: foldAllOpen,
              ai: foldAllOpen,
              edit: foldAllOpen,
              table: foldAllOpen,
              chart: foldAllOpen,
              matrix: foldAllOpen
            }
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "show-all-risk-register-columns") {
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            visibleColumns: ["select", "priority", "status", "value", "category", "phase", "impact", "owner", "dueDate", "measures"]
          }
        }
      }));
      window.requestAnimationFrame(() => {
        const tableWrap = document.querySelector(".risk-register-table-wrap");
        if (tableWrap) {
          tableWrap.scrollLeft = 0;
        }
      });
      return;
    }

    if (actionTarget?.dataset.action === "set-risk-register-sort" || actionTarget?.dataset.action === "set-risk-register-chart-sort") {
      const sortBy = ["priority", "value", "id", "category", "dueDate"].includes(actionTarget.dataset.sortBy)
        ? actionTarget.dataset.sortBy
        : "priority";
      event.preventDefault();
      event.stopPropagation();
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            sortBy,
            topSortBy: sortBy,
            panelOpenStates: {
              ...normalizeRiskRegisterPanelOpenStates(state.ui?.riskRegisterView?.panelOpenStates),
              chart: true
            },
            matrixSelection: null
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "set-risk-register-edit-sort") {
      const editSortBy = ["newest", "id"].includes(actionTarget.dataset.sortBy)
        ? actionTarget.dataset.sortBy
        : "newest";
      store.setState((state) => ({
        ...state,
        riskRegister: {
          ...state.riskRegister,
          risks: sortRiskRegisterEntriesForEdit(state.riskRegister.risks, editSortBy)
        },
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            editSortBy
          }
        }
      }));
      requestAnimationFrame(() => {
        const editList = document.querySelector(".risk-edit-list");
        if (editList) editList.scrollIntoView({ block: "start", behavior: "auto" });
      });
      return;
    }

    if (actionTarget?.dataset.action === "reset-risk-register-filters") {
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            search: "",
            status: "alle",
            owner: "alle",
            category: "alle",
            criticalOnly: false,
            showArchived: false,
            dueFrom: "",
            dueTo: "",
            sortBy: "id",
            matrixSelection: null
          },
          transferSelections: {
            ...state.ui.transferSelections,
            riskIds: []
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "toggle-archived-risk-register") {
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            showArchived: !state.ui?.riskRegisterView?.showArchived,
            status: state.ui?.riskRegisterView?.showArchived ? "alle" : "archiviert"
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "set-risk-register-limit" || actionTarget?.dataset.action === "set-risk-register-chart-limit") {
      const topLimit = Number(actionTarget.dataset.limit || 5);
      event.preventDefault();
      event.stopPropagation();
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            topLimit: topLimit === 0 || topLimit === 5 || topLimit === 10 || topLimit === 20 ? topLimit : 5,
            panelOpenStates: {
              ...normalizeRiskRegisterPanelOpenStates(state.ui?.riskRegisterView?.panelOpenStates),
              chart: true
            },
            matrixSelection: null
          }
        }
      }));
      return;
    }

    if (actionTarget?.dataset.action === "risk-step") {
      const index = Number(actionTarget.dataset.index);
      const field = actionTarget.dataset.field;
      const step = Number(actionTarget.dataset.step || 1);
      const direction = actionTarget.dataset.direction === "down" ? -1 : 1;
      if (!field || !Number.isFinite(index)) return;
      store.setState((state) => {
        pushRiskRegisterUndoSnapshot(state);
        const risk = state.riskRegister.risks[index];
        if (!risk) return state;
        const currentValue = Number(risk[field]) || 0;
        let nextValue = currentValue + (step * direction);
        if (field === "probabilityPercent") {
          nextValue = Math.max(0, Math.min(100, nextValue));
        } else if (field === "likelihood" || field === "impact") {
          nextValue = Math.max(1, Math.min(5, nextValue));
        } else {
          nextValue = Math.max(0, nextValue);
        }
        return {
          ...state,
          riskRegister: {
            ...state.riskRegister,
            risks: state.riskRegister.risks.map((item, itemIndex) => {
              if (itemIndex !== index) return item;
              const nextProbabilityPercent = field === "probabilityPercent"
                ? Math.round(nextValue)
                : Math.max(0, Math.min(100, Number(item.probabilityPercent) || 0));
              const nextLikelihood = deriveRiskLikelihoodFromPercent(nextProbabilityPercent, Number(item.likelihood) || 1);
              const nextImpact = field === "impact"
                ? Math.max(1, Math.min(5, nextValue))
                : Math.max(1, Math.min(5, Number(item.impact) || 1));
              const nextFinancialImpact = field === "financialImpact"
                ? Math.round(nextValue)
                : Math.max(0, Number(item.financialImpact) || 0);
              return {
                ...item,
                financialImpact: nextFinancialImpact,
                probabilityPercent: nextProbabilityPercent,
                likelihood: nextLikelihood,
                expectedDamage: Math.max(0, nextFinancialImpact * (nextProbabilityPercent / 100)),
                impact: nextImpact,
                qualitativeRiskValue: Math.max(1, Math.min(25, nextLikelihood * nextImpact)),
                [field]: field === "financialImpact" || field === "probabilityPercent" ? Math.round(nextValue) : nextValue
              };
            })
          }
        };
      });
      return;
    }

    if (actionTarget?.dataset.action === "select-risk-register-matrix-cell") {
      const likelihood = Number(actionTarget.dataset.likelihood || 0);
      const impact = Number(actionTarget.dataset.impact || 0);
      if (!Number.isInteger(likelihood) || !Number.isInteger(impact)) return;
      store.setState((state) => {
        const current = state.ui?.riskRegisterView?.matrixSelection || null;
        const sameCell = current && current.likelihood === likelihood && current.impact === impact;
        return {
          ...state,
          ui: {
            ...state.ui,
            riskRegisterView: {
              ...state.ui.riskRegisterView,
              matrixSelection: sameCell ? null : { likelihood, impact }
            }
          }
        };
      });
      return;
    }

    if (actionTarget?.dataset.action === "add-risk-register-item") {
      let targetIndex = 0;
      store.setState((state) => {
        pushRiskRegisterUndoSnapshot(state);
        const editSortBy = ["newest", "id"].includes(state.ui?.riskRegisterView?.editSortBy)
          ? state.ui.riskRegisterView.editSortBy
          : "newest";
        const nextItem = { ...createRiskRegisterItem(), id: nextRiskRegisterId(state.riskRegister.risks) };
        const nextRisks = editSortBy === "id"
          ? sortRiskRegisterEntriesForEdit([nextItem, ...state.riskRegister.risks], "id")
          : [nextItem, ...state.riskRegister.risks];
        targetIndex = nextRisks.findIndex((item) => item.id === nextItem.id);
        return {
          ...state,
          riskRegister: {
            ...state.riskRegister,
            risks: nextRisks
          }
        };
      });
      jumpToRiskRegisterEditPanel(targetIndex);
      return;
    }

    if (actionTarget?.dataset.action === "start-risk-register-ai-create") {
      jumpToAiWorkshopFreeText();
      return;
    }

    if (actionTarget?.dataset.action === "save-risk-register-item") {
      const index = Number(actionTarget.dataset.index);
      const risk = store.getState().riskRegister.risks[index];
      store.markSaved();
      persistAutosave(store.getState());
      updateStorageStatus(risk
        ? `Risiko ${risk.id} gespeichert.`
        : "Risiko gespeichert.");
      closeRiskRegisterEditCard(index);
      focusRiskRegisterCardByIndex(index + 1);
      return;
    }

    if (actionTarget?.dataset.action === "archive-risk-register-item") {
      const index = Number(actionTarget.dataset.index);
      const risk = store.getState().riskRegister.risks[index];
      if (!risk) return;
      if (normalizeRiskStatusValue(risk.status) === "archiviert") {
        if (restoreRiskRegisterItem(index)) {
          updateStorageStatus(`Risiko ${risk.id} reaktiviert.`);
        }
      } else if (archiveRiskRegisterItem(index)) {
        updateStorageStatus(`Risiko ${risk.id} archiviert.`);
      }
      return;
    }

    if (actionTarget?.dataset.action === "remove-risk-register-item") {
      const index = Number(actionTarget.dataset.index);
      closeRiskRegisterEditCard(index);
      store.setState((state) => {
        pushRiskRegisterUndoSnapshot(state);
        return {
          ...state,
          riskRegister: {
            ...state.riskRegister,
            risks: state.riskRegister.risks.filter((_, itemIndex) => itemIndex !== index)
          }
        };
      });
      if (!uiDrafts.riskReportDraftDirty) {
        syncRiskReportDraftFromState(store.getState());
      }
      focusRiskRegisterCardByIndex(index);
    }

    if (actionTarget?.dataset.action === "undo-risk-register-change") {
      if (applyRiskRegisterUndo()) {
        renderApp();
      }
      return;
    }

    if (actionTarget?.dataset.action === "redo-risk-register-change") {
      if (applyRiskRegisterRedo()) {
        renderApp();
      }
      return;
    }

  });

  document.addEventListener("keydown", (event) => {
    const numericProjectField = event.target?.matches?.("#project_land_area, #project_bgf") ? event.target : null;
    if (numericProjectField && numericProjectField.hasAttribute("readonly")) {
      const typingKey = event.key.length === 1 && /[0-9]/.test(event.key);
      const editingKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key);
      const pasteShortcut = (event.ctrlKey || event.metaKey) && ["v", "x", "a"].includes(String(event.key || "").toLowerCase());
      if (typingKey || editingKey || pasteShortcut) {
        numericProjectField.removeAttribute("readonly");
      }
    }

    if (event.key === "Tab" && !event.shiftKey && event.target?.id === "projectExportFileName") {
      const projectNameField = document.getElementById("project_name");
      if (projectNameField) {
        event.preventDefault();
        projectNameField.focus({ preventScroll: true });
      }
      return;
    }

    if (!["Enter", " "].includes(event.key)) return;
    const actionTarget = event.target.closest?.("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (!action) return;
    event.preventDefault();
    if (action === "jump-to-report-target") {
      jumpToReportTarget(actionTarget.dataset.targetModule, actionTarget.dataset.targetId);
      updateStorageStatus("Berichtsverweis geöffnet.");
      return;
    }
    if (action === "jump-to-monte-p80") {
      return;
    }
    actionTarget.click();
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "projectFileInput") {
      const selectedFile = event.target.files?.[0] || null;
      if (!selectedFile) {
        updateStorageStatus("Keine Projektdatei ausgewählt.");
        event.target.value = "";
        return;
      }
      updateStorageStatus(`Projektdatei wird geladen · ${selectedFile.name}`);
      void importProjectFile(selectedFile);
      event.target.value = "";
      return;
    }

    const projectField = event.target.closest("[data-project-field]");
    if (projectField) {
      commitProjectFieldFromElement(projectField, false);
      return;
    }

    const projectRoleField = event.target.closest("[data-project-role-field]");
    if (projectRoleField) {
      applyProjectRoleSelection(projectRoleField);
      return;
    }

    const locationField = event.target.closest("[data-project-location-field]");
    if (locationField) {
      commitProjectLocationFieldFromElement(locationField, false);
      return;
    }

    const addressField = event.target.closest("[data-project-address-field]");
    if (addressField) {
      commitProjectAddressFieldFromElement(addressField, false);
      return;
    }

    const reportField = event.target.closest("[data-report-field]");
    if (reportField) {
      commitReportFieldFromElement(reportField, false);
      return;
    }

    const reportOptionField = event.target.closest("[data-report-option]");
    if (reportOptionField) {
      const field = reportOptionField.getAttribute("data-report-option");
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          reportOptions: {
            ...state.ui.reportOptions,
            [field]: reportOptionField.checked
          }
        }
      }));
      return;
    }

    const reportExportField = event.target.closest("[data-report-export-field]");
    if (reportExportField) {
      const field = reportExportField.getAttribute("data-report-export-field");
      if (!field) return;
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          reportExportName: field === "fileName" ? reportExportField.value : state.ui.reportExportName,
          reportExportFormat: field === "format" ? reportExportField.value : state.ui.reportExportFormat
        }
      }));
      return;
    }

    const projectExportField = event.target.closest("[data-project-export-field]");
    if (projectExportField) {
      const field = projectExportField.getAttribute("data-project-export-field");
      if (!field) return;
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          projectExportName: field === "fileName"
            ? formatProjectExportFileName(projectExportField.value, state.project?.name || "project-controls-hub")
            : state.ui.projectExportName
        }
      }));
      return;
    }

    const aiSettingField = event.target.closest("[data-ai-setting-field]");
    if (aiSettingField) {
      aiSettings = persistAiSettings({
        ...readAiSettingsFromPanel(),
        [aiSettingField.getAttribute("data-ai-setting-field")]: aiSettingField.value,
        connected: false,
        testing: false,
        lastStatus: "KI-Einstellungen geändert. Bitte Verbindung testen."
      }) ? loadAiSettings() : normalizeAiSettings({
        ...readAiSettingsFromPanel(),
        [aiSettingField.getAttribute("data-ai-setting-field")]: aiSettingField.value,
        connected: false,
        testing: false,
        lastStatus: "KI-Einstellungen geändert. Bitte Verbindung testen."
      });
      renderAiSettingsPanel();
      return;
    }

    const riskUiField = event.target.closest("[data-risk-ui-field]");
    if (riskUiField) {
      const field = riskUiField.getAttribute("data-risk-ui-field");
      const nextValue = riskUiField.type === "checkbox" ? riskUiField.checked : riskUiField.value;
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            ...(field === "dueFrom" || field === "dueTo"
              ? { sortBy: nextValue ? "dueDate" : state.ui.riskRegisterView.sortBy }
              : {}),
            [field]: nextValue
          }
        }
      }));
      return;
    }

    const riskEditSortField = event.target.closest("[data-risk-edit-sort-field]");
    if (riskEditSortField) {
      const sortBy = riskEditSortField.value;
      store.setState((state) => ({
        ...state,
        riskRegister: {
          ...state.riskRegister,
          risks: sortRiskRegisterEntriesForEdit(state.riskRegister.risks, sortBy)
        },
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            editSortBy: ["newest", "id"].includes(sortBy) ? sortBy : "newest"
          }
        }
      }));
      return;
    }

    const transferSelect = event.target.closest("[data-transfer-select]");
    if (transferSelect) {
      const group = transferSelect.getAttribute("data-transfer-select");
      const value = transferSelect.getAttribute("data-transfer-value");
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          transferSelections: {
            ...state.ui.transferSelections,
            [group]: toggleSelection(state.ui.transferSelections?.[group], value, transferSelect.checked)
          }
        }
      }));
      return;
    }

    const riskField = event.target.closest("[data-risk-field]");
    if (riskField) {
      const index = Number(riskField.getAttribute("data-risk-index"));
      const field = riskField.getAttribute("data-risk-field");
      store.setState((state) => {
        pushRiskRegisterUndoSnapshot(state);
        return {
          ...state,
          riskRegister: {
            ...state.riskRegister,
            risks: state.riskRegister.risks.map((risk, riskIndex) => {
              if (riskIndex !== index) return risk;
              const nextValue = parseValue(risk[field], riskField.value);
              return {
                ...risk,
                [field]: nextValue
              };
            })
          }
        };
      });
    }
  });

  document.addEventListener("input", (event) => {
    const projectRoleField = event.target.closest?.("[data-project-role-field]");
    if (projectRoleField) {
      applyProjectRoleSelection(projectRoleField);
    }
    handleAiChatFieldEvent(event);
    if (event.target.closest?.(".report-draft-editor[data-report-draft-field=\"text\"]")) {
      syncReportDraftSelectionFromSelection();
    }
  });

  document.addEventListener("selectionchange", () => {
    const editor = getReportDraftEditorElement();
    if (!editor) return;
    const active = document.activeElement;
    if (active === editor || editor.contains(active)) {
      syncReportDraftSelectionFromSelection(editor);
    }
  });

  document.addEventListener("mouseup", (event) => {
    const editor = getReportDraftEditorElement();
    if (!editor) return;
    if (editor.contains(event.target) || document.activeElement === editor || editor.contains(document.activeElement)) {
      syncReportDraftSelectionFromSelection(editor);
    }
  }, true);

  document.addEventListener("keyup", (event) => {
    const editor = getReportDraftEditorElement();
    if (!editor) return;
    if (editor.contains(event.target) || document.activeElement === editor || editor.contains(document.activeElement)) {
      syncReportDraftSelectionFromSelection(editor);
    }
  }, true);

  document.addEventListener("focusin", (event) => {
    const reportDraftField = event.target.closest?.(".report-draft-editor[data-report-draft-field=\"text\"]");
    if (!reportDraftField) return;
    seedReportDraftUndoSnapshot(reportDraftField);
  });

  document.addEventListener("mousedown", (event) => {
    const toolbarButton = event.target.closest?.("[data-report-format-action]");
    if (!toolbarButton) return;
    event.preventDefault();
  });

function handleAiWorkshopFieldEvent(event) {
    const aiWorkshopField = event.target.closest("[data-ai-workshop-field]");
  if (!aiWorkshopField) return false;
  if (aiWorkshopField.getAttribute("data-ai-workshop-field") === "freeText") {
    const nextValue = aiWorkshopField.value;
    setAiWorkshopFreeTextDraft(nextValue, true);
    if (event.type === "input" || event.type === "change") {
        scheduleAiWorkshopFreeTextPersist();
      }
      return true;
    }
    if (aiWorkshopField.getAttribute("data-ai-workshop-field") === "selectedRiskId") {
      const nextValue = aiWorkshopField.value;
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          aiWorkshop: normalizeAiWorkshopState({
            ...state.ui?.aiWorkshop,
            selectedRiskId: nextValue
          })
        }
      }));
      return true;
    }
    return false;
  }

function handleAiChatFieldEvent(event) {
  const aiChatField = event.target.closest?.("[data-ai-chat-field]");
  if (!aiChatField) return false;
  const chatId = normalizeAiChatId(aiChatField.getAttribute("data-ai-chat-id"));
  if (aiChatField.getAttribute("data-ai-chat-field") !== "draft") return false;
  setAiChatDraft(chatId, aiChatField.value);
  return true;
}

function handleRiskReportDraftFieldEvent(event) {
  const reportDraftField = event.target.closest?.("[data-report-draft-field]");
  if (!reportDraftField) return false;
  const nextValue = typeof reportDraftField.innerHTML === "string"
    ? reportDraftField.innerHTML
    : (reportDraftField.innerText || reportDraftField.textContent || "");
  setRiskReportDraftText(nextValue, true);
  if (event.type === "input" || event.type === "change") {
    recordReportDraftUndoSnapshot(reportDraftField);
    scheduleRiskReportDraftPersist();
  }
  return true;
}

function getReportDraftEditorElement() {
  return document.querySelector?.(".report-draft-editor[data-report-draft-field=\"text\"]") || null;
}

function getReportDraftSelectionRange(editor = getReportDraftEditorElement()) {
  if (!(editor instanceof HTMLElement)) return null;
  const selection = window.getSelection?.();
  if (selection && selection.rangeCount > 0) {
    const liveRange = selection.getRangeAt(0);
    if (editor.contains(liveRange.commonAncestorContainer)) {
      return liveRange.cloneRange();
    }
  }
  if (reportDraftSelectionRange && editor.contains(reportDraftSelectionRange.commonAncestorContainer)) {
    return reportDraftSelectionRange.cloneRange();
  }
  return null;
}

function restoreReportDraftSelection(editor = getReportDraftEditorElement()) {
  if (!(editor instanceof HTMLElement)) return false;
  const selection = window.getSelection?.();
  const range = getReportDraftSelectionRange(editor);
  if (!selection || !range) return false;
  selection.removeAllRanges();
  selection.addRange(range);
  editor.focus();
  return true;
}

function syncReportDraftSelectionFromSelection(editor = getReportDraftEditorElement()) {
  if (!(editor instanceof HTMLElement)) return false;
  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;
  reportDraftSelectionRange = range.cloneRange();
  return true;
}

function seedReportDraftUndoSnapshot(editor = getReportDraftEditorElement()) {
  if (!(editor instanceof HTMLElement)) return false;
  const html = String(editor.innerHTML || "");
  if (!reportDraftUndoStack.length) {
    reportDraftUndoStack.push(html);
    return true;
  }
  const last = String(reportDraftUndoStack[reportDraftUndoStack.length - 1] || "");
  if (last !== html) {
    reportDraftUndoStack.push(html);
    if (reportDraftUndoStack.length > 50) reportDraftUndoStack.shift();
  }
  return true;
}

function recordReportDraftUndoSnapshot(editor = getReportDraftEditorElement()) {
  if (!(editor instanceof HTMLElement)) return false;
  const html = String(editor.innerHTML || "");
  const last = String(reportDraftUndoStack[reportDraftUndoStack.length - 1] || "");
  if (!reportDraftUndoStack.length || last !== html) {
    reportDraftUndoStack.push(html);
    if (reportDraftUndoStack.length > 50) reportDraftUndoStack.shift();
  }
  reportDraftRedoStack.length = 0;
  return true;
}

function restoreReportDraftUndoSnapshot(editor, html) {
  if (!(editor instanceof HTMLElement)) return false;
  editor.innerHTML = String(html || "");
  setRiskReportDraftText(editor.innerHTML, true);
  commitRiskReportDraft();
  editor.focus();
  pendingReportDraftFocus = editor;
  return true;
}

function unwrapReportDraftFormatting(node) {
  if (!(node instanceof Element)) return node;
  const fragment = document.createDocumentFragment();
  while (node.firstChild) {
    fragment.appendChild(node.firstChild);
  }
  node.replaceWith(fragment);
  return fragment;
}

function collectReportDraftFormattingAncestors(editor, range) {
  if (!(editor instanceof HTMLElement) || !range) return [];
  const selectors = "blockquote, ul, ol, li, font, b, strong, u, em, i, span";
  const nodes = [];
  const seen = new Set();
  const pushAncestors = (container) => {
    let current = container instanceof Element ? container : container?.parentElement || null;
    while (current && current !== editor) {
      if (current.matches?.(selectors) && !seen.has(current)) {
        seen.add(current);
        nodes.push(current);
      }
      current = current.parentElement;
    }
  };
  pushAncestors(range.startContainer);
  pushAncestors(range.endContainer);
  return nodes
    .map((node) => ({
      node,
      depth: (() => {
        let depth = 0;
        for (let current = node; current && current !== editor; current = current.parentElement) depth += 1;
        return depth;
      })()
    }))
    .sort((left, right) => right.depth - left.depth)
    .map((entry) => entry.node);
}

function applyReportDraftFormatting(action) {
  const editor = getReportDraftEditorElement();
  if (!(editor instanceof HTMLElement)) return false;
  const currentRange = getReportDraftSelectionRange(editor);
  const selectionText = currentRange
    ? String(currentRange.cloneContents().textContent || "").trim()
    : "";
  const requiresSelection = new Set(["bold", "underline", "bullet", "numbered", "quote", "large", "small"]);
  if (requiresSelection.has(action) && !selectionText) {
    updateStorageStatus("Bitte zuerst Text markieren.");
    return false;
  }
  const wrapSelection = (createWrapper) => {
    if (!restoreReportDraftSelection(editor)) return false;
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return false;
    const contents = range.extractContents();
    const wrapper = createWrapper();
    if (!(wrapper instanceof Node)) return false;
    if (wrapper instanceof HTMLOListElement || wrapper instanceof HTMLUListElement) {
      const childNodes = Array.from(contents.childNodes || []);
      const blocks = childNodes.length ? childNodes : [document.createTextNode(stripHtmlToPlainText(contents.textContent || ""))];
      let appended = false;
      for (const child of blocks) {
        const isWhitespaceText = child.nodeType === Node.TEXT_NODE && !String(child.textContent || "").trim();
        if (isWhitespaceText || child.nodeType === Node.COMMENT_NODE) continue;
        if (child.nodeType === Node.ELEMENT_NODE && String(child.tagName || "").toUpperCase() === "BR") continue;
        const li = document.createElement("li");
        if (child.nodeType === Node.ELEMENT_NODE && ["DIV", "P", "BLOCKQUOTE", "LI"].includes(String(child.tagName || "").toUpperCase())) {
          while (child.firstChild) {
            li.appendChild(child.firstChild);
          }
        } else {
          li.appendChild(child);
        }
        if (li.childNodes.length) {
          wrapper.appendChild(li);
          appended = true;
        }
      }
      if (!appended) return false;
    } else {
      wrapper.appendChild(contents);
    }
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.addRange(nextRange);
    return true;
  };
  const commands = {
    undo: () => {
      if (reportDraftUndoStack.length < 2) return false;
      const current = String(reportDraftUndoStack.pop() || "");
      reportDraftRedoStack.push(current);
      if (reportDraftRedoStack.length > 50) reportDraftRedoStack.shift();
      const previous = String(reportDraftUndoStack[reportDraftUndoStack.length - 1] || "");
      return restoreReportDraftUndoSnapshot(editor, previous);
    },
    redo: () => {
      if (!reportDraftRedoStack.length) return false;
      const next = String(reportDraftRedoStack.pop() || "");
      reportDraftUndoStack.push(next);
      if (reportDraftUndoStack.length > 50) reportDraftUndoStack.shift();
      return restoreReportDraftUndoSnapshot(editor, next);
    },
    bold: () => wrapSelection(() => document.createElement("strong")),
    underline: () => wrapSelection(() => document.createElement("u")),
    bullet: () => wrapSelection(() => document.createElement("ul")),
    numbered: () => wrapSelection(() => document.createElement("ol")),
    quote: () => wrapSelection(() => document.createElement("blockquote")),
    large: () => wrapSelection(() => {
      const font = document.createElement("font");
      font.setAttribute("size", "5");
      return font;
    }),
    small: () => wrapSelection(() => {
      const font = document.createElement("font");
      font.setAttribute("size", "2");
      return font;
    }),
    clear: () => {
      const baselineHtml = String(reportDraftBaselineHtml || "").trim();
      if (baselineHtml) {
        editor.innerHTML = baselineHtml;
      } else {
        const plainText = stripHtmlToPlainText(editor.innerHTML);
        editor.innerHTML = "";
        if (plainText.trim()) {
          const lines = String(plainText || "").replace(/\r\n/g, "\n").split("\n");
          const fragment = document.createDocumentFragment();
          lines.forEach((line, index) => {
            if (index > 0) {
              fragment.appendChild(document.createElement("br"));
            }
            if (line) {
              fragment.appendChild(document.createTextNode(line));
            }
          });
          editor.appendChild(fragment);
        }
      }
      const selection = window.getSelection?.();
      if (selection) selection.removeAllRanges();
      return true;
    }
  };
  const command = commands[action];
  if (typeof command !== "function") return false;
  if (!command()) return false;
  if (action !== "undo" && action !== "redo") {
    recordReportDraftUndoSnapshot(editor);
  }
  setRiskReportDraftText(editor.innerHTML, true);
  commitRiskReportDraft();
  updateStorageStatus(action === "undo"
    ? "Letzte Änderung rückgängig gemacht."
    : action === "redo"
      ? "Letzte Änderung wiederhergestellt."
      : "Berichtsentwurf formatiert.");
  return true;
}

function applyProjectRoleSelection(projectRoleField) {
  const field = projectRoleField.getAttribute("data-project-role-field");
  const roleValue = String(projectRoleField.value || "").trim();
  const checked = Boolean(projectRoleField.checked);
  if (!field || !roleValue) return;
  store.setState((state) => {
    const currentRoles = Array.isArray(state.project[field]) ? state.project[field] : [];
    const nextRoles = checked
      ? Array.from(new Set([...currentRoles, roleValue]))
      : currentRoles.filter((role) => role !== roleValue);
    return {
      ...state,
      project: {
        ...state.project,
        [field]: nextRoles
      }
    };
  });
}

function commitProjectFieldFromElement(projectField) {
  const field = projectField.getAttribute("data-project-field");
  if (!field) return;
  const value = parseValue(store.getState().project[field], projectField.value);
  store.setState((state) => ({
    ...state,
    project: {
      ...state.project,
      [field]: value
    }
  }));
}

function commitProjectLocationFieldFromElement(locationField) {
  const field = locationField.getAttribute("data-project-location-field");
  if (!field) return;
  store.setState((state) => ({
    ...state,
    project: {
      ...state.project,
      location: {
        ...state.project.location,
        [field]: locationField.value
      }
    }
  }));
}

function commitProjectAddressFieldFromElement(addressField) {
  const nextAddress = splitStreetAddress(addressField.value);
  store.setState((state) => ({
    ...state,
    project: {
      ...state.project,
      location: {
        ...state.project.location,
        street: nextAddress.street,
        houseNumber: nextAddress.houseNumber
      }
    }
  }));
}

function commitReportFieldFromElement(reportField) {
  const field = reportField.getAttribute("data-report-field");
  if (!field) return;
  store.setState((state) => ({
    ...state,
    reportProfile: {
      ...state.reportProfile,
      [field]: reportField.value
    }
  }));
}

  document.addEventListener("input", (event) => {
    if (handleAiWorkshopFieldEvent(event)) return;
    if (handleRiskReportDraftFieldEvent(event)) return;

    const aiSettingField = event.target.closest("[data-ai-setting-field]");
    if (aiSettingField && aiSettingField.getAttribute("data-ai-setting-field") === "apiKey") {
      const saved = persistAiSettings({
        ...readAiSettingsFromPanel(),
        apiKey: aiSettingField.value,
        connected: false,
        testing: false,
        lastStatus: "API-Schlüssel bereit zum Speichern."
      });
      aiSettings = saved ? loadAiSettings() : normalizeAiSettings({
        ...readAiSettingsFromPanel(),
        apiKey: aiSettingField.value,
        connected: false,
        testing: false,
        lastStatus: "API-Schlüssel bereit zum Speichern."
      });
      if (!saved) {
        updateAiStatus("KI-Einstellungen konnten im Browser nicht gespeichert werden.");
      }
      renderAiSettingsPanel();
      return;
    }

    const riskEditSortField = event.target.closest("[data-risk-edit-sort-field]");
    if (riskEditSortField) {
      const sortBy = ["newest", "id"].includes(riskEditSortField.value)
        ? riskEditSortField.value
        : "newest";
      store.setState((state) => ({
        ...state,
        riskRegister: {
          ...state.riskRegister,
          risks: sortRiskRegisterEntriesForEdit(state.riskRegister.risks, sortBy)
        },
        ui: {
          ...state.ui,
          riskRegisterView: {
            ...state.ui.riskRegisterView,
            editSortBy: sortBy
          }
        }
      }));
      return;
    }

    const riskUiField = event.target.closest("[data-risk-ui-field]");
    if (!riskUiField) return;
    if (riskUiField.tagName === "SELECT") return;
    const field = riskUiField.getAttribute("data-risk-ui-field");
    if (!field) return;
    const nextValue = riskUiField.type === "checkbox" ? riskUiField.checked : riskUiField.value;
    store.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        riskRegisterView: {
          ...state.ui.riskRegisterView,
          [field]: nextValue
        }
        }
      }));
    });

  document.addEventListener("change", (event) => {
    handleAiWorkshopFieldEvent(event);
    handleAiChatFieldEvent(event);
    handleRiskReportDraftFieldEvent(event);
  });

  document.addEventListener("focusout", (event) => {
    const aiWorkshopField = event.target.closest?.("[data-ai-workshop-field=\"freeText\"]");
    if (!aiWorkshopField) return;
    commitAiWorkshopFreeTextDraft();
    const aiChatField = event.target.closest?.("[data-ai-chat-field=\"draft\"]");
    if (aiChatField) {
      setAiChatDraft(aiChatField.getAttribute("data-ai-chat-id"), aiChatField.value);
    }
    const reportDraftField = event.target.closest?.("[data-report-draft-field]");
    if (reportDraftField) {
      commitRiskReportDraft();
    }
  }, true);

}

store.subscribe(renderAppSafe);
store.subscribe(persistAutosave);
bindEvents();
function renderAppSafe() {
  try {
    if (typeof globalThis.__riskRevokeReportExportObjectUrls === "function") {
      globalThis.__riskRevokeReportExportObjectUrls();
    }
    renderApp(mergeRiskReportDraftIntoState(mergeAiWorkshopFreeTextDraftIntoState(store.getState())));
  } catch (error) {
    console.error(error);
    const message = error && error.stack ? error.stack : String(error);
    document.body.innerHTML = `
      <div style="font-family:system-ui,sans-serif;padding:24px;max-width:960px;margin:0 auto;color:#08131d;">
        <h1 style="margin:0 0 12px;font-size:28px;color:#163f63;">Risiko Register konnte nicht gerendert werden</h1>
        <p style="margin:0 0 16px;line-height:1.5;">Es ist beim Aufbau der Oberfläche ein Fehler aufgetreten. Die technische Fehlermeldung steht unten. Damit können wir den nächsten Schritt gezielt reparieren.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#f4f7fa;border:1px solid #c9d6e2;border-radius:12px;padding:16px;line-height:1.45;">${message.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]))}</pre>
      </div>
    `;
  }
}
renderAppSafe();
window.addEventListener("DOMContentLoaded", renderAppSafe, { once: true });
window.addEventListener("load", renderAppSafe, { once: true });
restoreAutosave();
