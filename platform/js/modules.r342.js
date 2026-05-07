import { initialState } from "./state.r342.js?fresh=406";

export const riskCategoryOptions = [
  "Markt- und Wirtschaftsrisiken",
  "Standort- und Umweltrisiken",
  "Rechtliche und Genehmigungsrisiken",
  "Finanzielle Risiken",
  "Projekt- und Managementrisiken",
  "Technische und Planungsrisiken",
  "Stakeholder- und Kommunikationsrisiken",
  "Ausführungs- und Baurisiken",
  "Lieferketten- und Beschaffungsrisiken",
  "Sicherheits- und Gesundheitsrisiken",
  "IT- und Datenrisiken",
  "Externe Risiken und höhere Gewalt",
  "Sonstige / Individuell"
];

export const riskPhaseOptions = [
  "Projektinitiierung und Entwicklung",
  "Planung",
  "Genehmigung",
  "Ausschreibung und Vergabe",
  "Beschaffung",
  "Ausführung",
  "Inbetriebnahme und Abnahme",
  "Betrieb und Gewährleistung"
];

export const projectStatusOptions = [
  "Bedarfsplanung",
  "Projektentwicklung",
  "Anlaufphase",
  "Planungsphase",
  "Genehmigungsphase",
  "Ausschreibung / Vergabe",
  "Ausführungsphase",
  "Abnahme / Inbetriebnahme",
  "Betriebs- und Nutzungsphase",
  "Ruhend",
  "Gestoppt",
  "Abgeschlossen"
];

export function normalizeRiskPhaseValue(value) {
  const current = String(value || "").trim();
  const normalized = current.toLowerCase();
  if (!normalized) return riskPhaseOptions[0];
  const matched = riskPhaseOptions.find((option) => option.toLowerCase() === normalized);
  return matched || current;
}

function buildRiskPhaseOptions(currentValue) {
  const current = normalizeRiskPhaseValue(currentValue);
  return [...new Set([current, ...riskPhaseOptions])];
}

function normalizeProjectStatusValue(value) {
  const current = String(value || "").trim();
  const normalized = current.toLowerCase();
  if (!normalized) return projectStatusOptions[0];
  if (normalized === "projekt entwicklung" || normalized === "projektentwicklung") return "Projektentwicklung";
  if (normalized === "bedarfsplanung") return "Bedarfsplanung";
  if (normalized === "anlaufphase") return "Anlaufphase";
  if (normalized === "planung" || normalized === "planungsphase") return "Planungsphase";
  if (normalized === "genehmigung" || normalized === "genehmigungsphase") return "Genehmigungsphase";
  if (normalized === "ausschreibung und vergabe" || normalized === "ausschreibungsphase / vergabe" || normalized === "ausschreibung / vergabe") return "Ausschreibung / Vergabe";
  if (normalized === "ausführung" || normalized === "ausführungsphase") return "Ausführungsphase";
  if (normalized === "abnahme / inbetriebnahme" || normalized === "inbetriebnahme / abnahme" || normalized === "abnahme und inbetriebnahme" || normalized === "abnahme" || normalized === "inbetriebnahme") return "Abnahme / Inbetriebnahme";
  if (normalized === "betriebs- und nutzungsphase" || normalized === "betriebs und nutzungsphase" || normalized === "betrieb" || normalized === "nutzung" || normalized === "betriebsphase") return "Betriebs- und Nutzungsphase";
  if (normalized === "ruhend" || normalized === "gestoppt" || normalized === "abgeschlossen") return current;
  const matched = projectStatusOptions.find((option) => option.toLowerCase() === normalized);
  return matched || current;
}

function buildProjectStatusOptions(currentValue) {
  const current = normalizeProjectStatusValue(currentValue);
  return [...new Set([current, ...projectStatusOptions])];
}

export function normalizeRiskStatusValue(value) {
  const current = String(value || "").trim().toLowerCase();
  if (!current) return "offen";
  if (current === "beobachtung" || current === "überwachung") return "überwachung";
  if (current === "in beurteilung" || current === "in bewertung") return "in bewertung";
  if (current === "in bearbeitung") return "in bearbeitung";
  if (current === "maßnahme läuft" || current === "massnahme läuft" || current === "massnahme laeuft") return "in bearbeitung";
  if (current === "archiviert" || current === "archiv" || current === "entfallen" || current === "obsolet") return "archiviert";
  if (current === "geschlossen") return "geschlossen";
  return "offen";
}

export function deriveRiskLikelihoodFromPercent(probabilityPercent, fallback = 1) {
  const percent = Number(probabilityPercent);
  if (!Number.isFinite(percent)) {
    return Math.max(1, Math.min(5, Number(fallback) || 1));
  }
  if (percent <= 0) return 1;
  if (percent <= 20) return 1;
  if (percent <= 40) return 2;
  if (percent <= 60) return 3;
  if (percent <= 80) return 4;
  return 5;
}

export function normalizeRiskCategoryValue(value) {
  const current = String(value || "").trim().toLowerCase();
  if (!current) return "Projekt- und Managementrisiken";
  if (current === "operativ") return "Projekt- und Managementrisiken";
  if (current === "technisch") return "Technische und Planungsrisiken";
  if (current === "finanziell") return "Finanzielle Risiken";
  if (current === "rechtlich") return "Rechtliche und Genehmigungsrisiken";
  if (current === "standort") return "Standort- und Umweltrisiken";
  if (current === "lieferkette" || current === "beschaffung") return "Lieferketten- und Beschaffungsrisiken";
  if (current === "sicherheit") return "Sicherheits- und Gesundheitsrisiken";
  if (current === "it" || current === "daten") return "IT- und Datenrisiken";
  if (current === "externe" || current === "höhere gewalt" || current === "hoehere gewalt") return "Externe Risiken und höhere Gewalt";
  return riskCategoryOptions.some((option) => option.toLowerCase() === current)
    ? value
    : "Sonstige / Individuell";
}

function buildRiskCategoryOptions(currentValue) {
  const current = normalizeRiskCategoryValue(currentValue);
  return [...new Set([current, ...riskCategoryOptions])];
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAiChatTime(value) {
  const date = Number.isFinite(Number(value)) ? new Date(Number(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatAiChatMarkupHtml(value = "") {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^\s*#{1,6}\s+/.test(line)) {
        const heading = trimmed.replace(/^#{1,6}\s+/, "");
        return `<strong>${escapeHtml(heading).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</strong>`;
      }
      const escaped = escapeHtml(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      const colonIndex = escaped.indexOf(":");
      if (colonIndex > 0 && /^(frage|hinweis|empfehlung|maßnahme|maßnahmen|risiken|bewertung|antwort)\b/i.test(trimmed)) {
        return `<strong>${escaped.slice(0, colonIndex + 1)}</strong>${escaped.slice(colonIndex + 1)}`;
      }
      return escaped;
    })
    .join("<br>");
}

function renderAiChatBubbleHtml(message = {}) {
  const role = message.role === "assistant" ? "assistant" : "user";
  const label = role === "assistant" ? "KI" : "Du";
  const body = formatAiChatMarkupHtml(String(message.content || ""));
  const time = formatAiChatTime(message.createdAt);
  return `
    <div class="ai-chat-bubble ${role}">
      <div class="ai-chat-bubble-head">
        <strong>${label}</strong>
        ${time ? `<span>${escapeHtml(time)}</span>` : ""}
      </div>
      <div class="ai-chat-bubble-body">${body}</div>
    </div>
  `;
}

function getAiChatConnectionBadgeState() {
  const settings = globalThis.__riskRegisterAiSettings || {};
  const hasApiKey = Boolean(String(settings.apiKey || "").trim() || String(settings.apiKeyPreview || "").trim());
  if (settings.testing) {
    return { tone: "busy", label: "Verbindung wird geprüft ..." };
  }
  if (settings.connected) {
    return { tone: "success", label: "Verbindung OK" };
  }
  if (hasApiKey) {
    return { tone: "danger", label: "Keine Verbindung" };
  }
  return { tone: "neutral", label: "Kein API-Schlüssel" };
}

function renderAiChatThreadHtml(config = {}) {
  const chatId = String(config.chatId || "fach");
  const panelKey = String(config.panelKey || `${chatId}ChatPanel`);
  const panelStyle = String(config.panelStyle || "").trim();
  const panelOpen = config.open === true;
  const prompts = Array.isArray(config.prompts) ? config.prompts : [];
  const messages = Array.isArray(config.messages) ? config.messages : [];
  const cardClass = String(config.cardClass || "card-info").trim();
  const latestAssistant = [...messages].reverse().find((message) => message?.role === "assistant") || null;
  const badgeState = getAiChatConnectionBadgeState();
  const collapsible = config.collapsible !== false;
  const outputToneClass = badgeState.tone === "success" ? "tone-success" : badgeState.tone === "danger" ? "tone-danger" : "tone-neutral";
  const outputMinHeight = Math.max(120, Number(config.outputMinHeight) || 200);
  const bodyHtml = `
    ${config.context ? `<p class="ai-chat-context">${escapeHtml(String(config.context))}</p>` : ""}
    ${prompts.length ? `
      <div class="ai-chat-prompts ${escapeHtml(String(config.promptsClass || ""))}">
        ${prompts.map((prompt) => `
          <button class="action-btn ai-chat-chip" type="button" data-ai-chat-prompt="${escapeHtml(prompt)}" onclick="void globalThis.__riskAskAiChat?.('${escapeHtml(chatId)}', this.dataset.aiChatPrompt)">${escapeHtml(prompt)}</button>
        `).join("")}
      </div>
    ` : ""}
    <div class="${escapeHtml(String(config.composerClass || "ai-chat-composer"))}">
      <label for="${escapeHtml(config.inputId || "")}">${escapeHtml(String(config.inputLabel || "Individuelle Fachfrage"))}</label>
      <textarea id="${escapeHtml(config.inputId || "")}" data-ai-chat-field="draft" data-ai-chat-id="${escapeHtml(chatId)}" placeholder="${escapeHtml(String(config.placeholder || ""))}">${escapeHtml(String(config.draft || ""))}</textarea>
      <div class="ai-chat-actions">
        <button class="action-btn primary" type="button" onclick="void globalThis.__riskSendAiChat?.('${escapeHtml(chatId)}')" ${config.busy ? "disabled" : ""}>${escapeHtml(String(config.sendLabel || "Frage senden"))}</button>
      </div>
    </div>
    <div class="ai-chat-bottom">
      <div class="ai-chat-output ${outputToneClass} ${config.busy ? "is-loading" : ""}" style="min-height:${outputMinHeight}px;">
        <strong>Ausgabe</strong>
        <div class="ai-chat-output-body">
          ${config.busy ? `
            <div class="ai-chat-output-loading">
              <span class="ai-chat-output-spinner" aria-hidden="true"></span>
              <span>${escapeHtml(String(config.loadingLabel || "Antwort wird erzeugt ..."))}</span>
            </div>
          ` : latestAssistant ? `
            <div class="ai-chat-output-answer">${formatAiChatMarkupHtml(String(latestAssistant.content || ""))}</div>
          ` : `
            <div class="ai-chat-empty">
              <strong>Antwort erscheint hier in Grün.</strong>
              <span>Klicke auf eine Frage oder stelle oben eine eigene Fachfrage.</span>
            </div>
          `}
        </div>
      </div>
      <div class="ai-chat-history" aria-live="polite">
        ${messages.length ? `
          <div class="ai-chat-log">
            ${messages.map((message) => renderAiChatBubbleHtml(message)).join("")}
          </div>
        ` : `
          <div class="ai-chat-empty">
            <strong>Noch kein Verlauf vorhanden.</strong>
            <span>Stell hier einfach eine Frage. Die Antwort erscheint im grünen Ausgabe-Fenster.</span>
          </div>
        `}
      </div>
      <div class="ai-chat-output-actions">
        <button class="action-btn danger" type="button" onclick="void globalThis.__riskClearAiChat?.('${escapeHtml(chatId)}')">Verlauf löschen</button>
      </div>
    </div>
  `;
  if (!collapsible) {
    return `
      <section class="info-card ai-chat-card ${escapeHtml(cardClass)}" style="${escapeHtml(panelStyle)}">
        <div class="ai-chat-top">
          <div class="ai-chat-head">
            <div class="ai-chat-head-copy">
              <h3>${escapeHtml(String(config.title || "Chat"))}</h3>
              <p class="form-note">${escapeHtml(String(config.description || ""))}</p>
            </div>
            <span class="badge ai-chat-status ai-chat-status-${badgeState.tone}">${escapeHtml(badgeState.label)}</span>
          </div>
          ${bodyHtml}
        </div>
      </section>
    `;
  }
  return `
    <details class="info-card risk-register-card risk-fold-card ai-chat-panel ${escapeHtml(cardClass)}" data-ai-panel-key="${escapeHtml(panelKey)}" style="${escapeHtml(panelStyle)}"${panelOpen ? " open" : ""}>
      <summary class="risk-fold-summary">
        <div class="risk-fold-summary-main">
          <div class="risk-fold-summary-topline">
            <span class="risk-fold-drag-handle" data-ai-panel-drag-handle aria-hidden="true" title="Tafel verschieben">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
              </svg>
            </span>
            <span class="risk-fold-toggle" aria-hidden="true"></span>
            <div class="risk-fold-summary-title">
              <strong>${escapeHtml(String(config.title || "Chat"))}</strong>
              <span>${escapeHtml(String(config.description || ""))}</span>
            </div>
          </div>
        </div>
        <div class="risk-fold-summary-actions">
          <span class="badge ai-chat-status ai-chat-status-${badgeState.tone}">${escapeHtml(badgeState.label)}</span>
        </div>
      </summary>
      <div class="risk-fold-body ai-chat-panel-body">
        <section class="info-card ai-chat-card ${escapeHtml(cardClass)}">
          ${bodyHtml}
        </section>
      </div>
    </details>
  `;
}

const REPORT_SECTION_TITLES = new Set([
  "Executive Summary",
  "Lagebild",
  "Risikoregister im Fokus",
  "Kritische Risiken in Bearbeitung",
  "Kritische offene Risiken",
  "Erhöhte offene Risiken",
  "Überfällige Risiken",
  "Priorisierte Risiken",
  "Maßnahmen",
  "Restgefahr",
  "Steuerungsprioritäten",
  "Nächste Schritte",
  "Hinweise"
]);

function classifyRiskStatusTone(status) {
  const value = normalizeRiskStatusValue(status);
  if (value === "geschlossen") return { key: "closed", label: "Geschlossen" };
  if (value === "archiviert") return { key: "archived", label: "Archiviert" };
  if (value === "überwachung") return { key: "watch", label: "Überwachung" };
  if (value === "in bearbeitung") return { key: "progress", label: "In Bearbeitung" };
  if (value === "in bewertung") return { key: "action", label: "In Bewertung" };
  return { key: "open", label: "Offen" };
}

function renderFormattedReportTextHtml(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").trim().split("\n");
  const html = [];
  let headingIndex = 0;
  const seenSectionTitles = new Set();
  let skippingDuplicateSection = false;
  for (const rawLine of lines) {
    const line = String(rawLine || "").trim();
    if (!line) {
      if (skippingDuplicateSection) continue;
      html.push(`<div class="report-paragraph-spacer" aria-hidden="true"></div>`);
      continue;
    }
    const cleaned = line.replace(/\*\*/g, "").replace(/^\s*#+\s*/, "").trim();
    if (/^Risikobericht(?:\s+(?:für\s+)?\S.*)?$/i.test(cleaned)) {
      continue;
    }
    const headingMatch = cleaned.match(/^\d+\.\s*(.+)$/);
    const headingTitle = headingMatch ? headingMatch[1].trim() : cleaned;
    if (skippingDuplicateSection) {
      if (!(REPORT_SECTION_TITLES.has(headingTitle) && !seenSectionTitles.has(headingTitle))) {
        continue;
      }
      skippingDuplicateSection = false;
    }
    if (REPORT_SECTION_TITLES.has(headingTitle)) {
      if (seenSectionTitles.has(headingTitle)) {
        skippingDuplicateSection = true;
        continue;
      }
      seenSectionTitles.add(headingTitle);
      headingIndex += 1;
      html.push(`<div class="report-section-heading"><span class="report-section-number">${headingIndex}.</span> <strong>${escapeHtml(headingTitle)}</strong></div>`);
      continue;
    }
    if (/^Projekt:/.test(cleaned)) {
      const projectValue = cleaned.replace(/^Projekt:\s*/, "");
      html.push(`<div class="report-project-line report-project-line-main" style="font-size:1.18rem;font-weight:800;line-height:1.45;color:#091f33;">Projekt: <span>${escapeHtml(projectValue)}</span></div>`);
      continue;
    }
    if (/^Projektadresse:/.test(cleaned)) {
      const projectValue = cleaned.replace(/^Projektadresse:\s*/, "");
      html.push(`<div class="report-project-line report-project-line-secondary">Projektadresse: <span>${escapeHtml(projectValue)}</span></div>`);
      continue;
    }
    if (/^(Risikobericht für |Berichtsdatum:|Analysestichtag:|Betrachtungszeitpunkt:|Projektstatus:|Auftraggeber:|Projektleitung:|Zeitliche Einordnung:)/.test(cleaned)) {
      const metaClass = /^Berichtsdatum:/.test(cleaned) ? "report-meta-line report-meta-line-break" : "report-meta-line";
      html.push(`<div class="${metaClass}">${escapeHtml(cleaned)}</div>`);
      if (/^Berichtsdatum:/.test(cleaned)) {
        html.push(`<div class="report-paragraph-spacer" aria-hidden="true"></div>`);
      }
      continue;
    }
    html.push(`<div class="report-paragraph">${escapeHtml(cleaned)}</div>`);
  }
  return html.join("");
}

function renderRecentProjectFilesHtml() {
  const recentFiles = typeof globalThis.__riskRegisterRecentProjectFiles === "function"
    ? globalThis.__riskRegisterRecentProjectFiles()
    : [];
  if (!Array.isArray(recentFiles) || !recentFiles.length) {
    return `
      <p class="form-note project-files-empty">
        Noch keine zuletzt gespeicherten Projektstände vorhanden.<br>
        Wenn du ein Projekt speicherst oder eine Projektdatei lädst, wird dieser Stand hier für einen schnellen Zugriff im Browser abgelegt.
      </p>
    `;
  }
  return `
    <div class="project-files-recent">
      <div class="project-files-recent-head">
        <h4>Zuletzt gespeicherte Projekte</h4>
        <span>${recentFiles.length} Einträge</span>
      </div>
      <p class="form-note project-files-recent-note project-files-recent-note-inline">
        <span>Diese Kacheln zeigen die drei zuletzt gespeicherten Projektstände in diesem Browser und können direkt hier geladen werden, ohne eine Datei aus dem Downloads-Ordner auswählen zu müssen.</span>
      </p>
      <div class="project-files-recent-list">
        ${recentFiles.map((entry) => `
          <div class="project-files-recent-item">
            <div class="project-files-recent-meta">
              <strong>${escapeHtml(entry.projectName || "Projekt")}</strong>
              <span>${escapeHtml(entry.fileName || "Projektdatei.json")}</span>
              <small>${escapeHtml(entry.savedAtLabel || entry.savedAt || "")}</small>
            </div>
            <div class="project-files-recent-actions">
              <button class="action-btn" type="button" data-action="load-recent-project" data-recent-project-id="${escapeHtml(entry.id)}" onclick="void globalThis.__riskRegisterLoadRecentProjectFile?.(this.dataset.recentProjectId)">Laden</button>
              <button class="action-btn danger" type="button" data-action="delete-recent-project" data-recent-project-id="${escapeHtml(entry.id)}" onclick="void globalThis.__riskRegisterDeleteRecentProjectFile?.(this.dataset.recentProjectId)">Entfernen</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function sanitizeReportDraftHtml(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!/<\/?[a-z][\s\S]*>/i.test(raw)) return renderFormattedReportTextHtml(raw);
  const template = document.createElement("template");
  template.innerHTML = raw;
  const allowedTags = new Set([
    "B",
    "BR",
    "DIV",
    "EM",
    "FONT",
    "BLOCKQUOTE",
    "I",
    "LI",
    "OL",
    "P",
    "SPAN",
    "STRONG",
    "U",
    "UL"
  ]);
  const cloneNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createTextNode("");
    }
    const tagName = String(node.tagName || "").toUpperCase();
    if (!allowedTags.has(tagName)) {
      const fragment = document.createDocumentFragment();
      for (const child of Array.from(node.childNodes || [])) {
        fragment.appendChild(cloneNode(child));
      }
      return fragment;
    }
    const element = document.createElement(tagName.toLowerCase());
    if (tagName === "FONT") {
      const size = String(node.getAttribute("size") || "").trim();
      if (/^[1-7]$/.test(size)) {
        element.setAttribute("size", size);
      }
    } else if (tagName === "DIV" || tagName === "SPAN") {
      const className = String(node.getAttribute("class") || "").trim();
      if (className) {
        element.setAttribute("class", className);
      }
    }
    for (const child of Array.from(node.childNodes || [])) {
      element.appendChild(cloneNode(child));
    }
    return element;
  };
  const fragment = document.createDocumentFragment();
  for (const child of Array.from(template.content.childNodes || [])) {
    fragment.appendChild(cloneNode(child));
  }
  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML.trim();
}

function reportMarkupToPlainText(value) {
  const text = String(value || "");
  if (!text) return "";
  if (!/<\/?[a-z][\s\S]*>/i.test(text)) return text.trim();
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

function renderReportDraftEditorHtml(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return sanitizeReportDraftHtml(value);
  return renderFormattedReportTextHtml(value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatPercent(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatMonteCarloValue(value, unit = "") {
  const normalizedUnit = String(unit || "").trim();
  if (normalizedUnit.includes("€")) return formatCurrency(value);
  if (normalizedUnit.includes("%")) return formatPercent(value);
  if (/tag/i.test(normalizedUnit)) return `${formatNumber(value)} Tage`;
  if (!normalizedUnit) return formatNumber(value);
  return `${formatNumber(value)} ${normalizedUnit}`.trim();
}

function formatDecimalInput(value, fractionDigits = 2) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(Number(value) || 0);
}

function formatCurrencyInput(value) {
  return `${formatNumber(value)} €`;
}

function formatCompactCurrency(value) {
  const absolute = Math.abs(Number(value) || 0);
  if (absolute >= 1000000) {
    return `${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Number(value) || 0) / 1000000)}Mio.€`;
  }
  if (absolute >= 1000) {
    return `${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((Number(value) || 0) / 1000)}T€`;
  }
  return formatCurrency(value);
}

function formatSignedNumber(value, fractionDigits = 1) {
  const amount = Number(value) || 0;
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(Math.abs(amount))}`;
}

function formatSignedCurrency(value) {
  const amount = Number(value) || 0;
  return `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${formatCurrency(Math.abs(amount))}`;
}

function formatSignedCompactCurrency(value) {
  const amount = Number(value) || 0;
  return `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${formatCompactCurrency(Math.abs(amount))}`;
}

function formatPercentValue(value) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((Number(value) || 0) * 100);
}

function formatDate(value) {
  if (!value) return "nicht angegeben";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE");
}

function splitTitleIntoTwoLines(value) {
  const title = String(value || "").trim();
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length < 5 && title.length < 42) {
    return [title, ""];
  }
  let bestIndex = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const left = words.slice(0, i).join(" ");
    const right = words.slice(i).join(" ");
    const diff = Math.abs(left.length - right.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }
  return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
}

export function normalizeRiskRegisterPanelOrder(panelOrder) {
  const defaultOrder = ["overview", "edit", "ai", "table", "chart", "matrix"];
  const legacyDefaultOrders = [
    ["overview", "table", "edit", "chart", "matrix", "ai"],
    ["overview", "ai", "edit", "table", "chart", "matrix"],
    ["overview", "edit", "table", "chart", "matrix", "ai"]
  ];
  if (!Array.isArray(panelOrder)) return defaultOrder;
  const normalizedIncoming = panelOrder.map((value) => String(value || "").trim()).filter(Boolean);
  if (legacyDefaultOrders.some((legacyOrder) => normalizedIncoming.length === legacyOrder.length && normalizedIncoming.every((value, index) => value === legacyOrder[index]))) {
    return defaultOrder;
  }
  const seen = new Set();
  const filtered = [];
  for (const value of normalizedIncoming) {
    if (!defaultOrder.includes(value) || seen.has(value)) continue;
    seen.add(value);
    filtered.push(value);
  }
  const trailing = defaultOrder.filter((value) => !seen.has(value));
  return [...filtered, ...trailing];
}

function normalizeRiskRegisterPanelOpenStates(panelOpenStates) {
  const defaultOpenStates = {
    overview: false,
    ai: false,
    edit: false,
    table: false,
    chart: false,
    matrix: false
  };
  if (!panelOpenStates || typeof panelOpenStates !== "object") return defaultOpenStates;
  return Object.keys(defaultOpenStates).reduce((acc, key) => {
    acc[key] = panelOpenStates[key] !== false;
    return acc;
  }, {});
}

export { normalizeRiskRegisterPanelOpenStates };

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

function parseRiskDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function calculateProjectTimeContext(project) {
  const start = project?.startDate ? new Date(project.startDate) : null;
  const end = project?.endDate ? new Date(project.endDate) : null;
  const analysis = project?.analysisDate ? new Date(project.analysisDate) : new Date();

  const hasValidDates = [start, end, analysis].every((date) => date instanceof Date && !Number.isNaN(date.getTime()));
  if (!hasValidDates || !start || !end) {
    return {
      status: "Zeitkontext unvollständig",
      detail: "Für eine belastbare Einordnung fehlen Bau- oder Stichtagsdaten.",
      progressLabel: "nicht ableitbar"
    };
  }

  const totalDuration = end.getTime() - start.getTime();
  if (totalDuration <= 0) {
    return {
      status: "Zeitlogik prüfen",
      detail: "Die geplante Fertigstellung liegt nicht nach dem Baubeginn.",
      progressLabel: "nicht ableitbar"
    };
  }

  const elapsed = analysis.getTime() - start.getTime();
  const progressRatio = Math.min(Math.max(elapsed / totalDuration, 0), 1);
  const progressPercent = Math.round(progressRatio * 100);

  let scheduleStatus = "Vor Baubeginn";
  if (analysis > end) {
    scheduleStatus = "Nach Soll-Termin";
  } else if (analysis >= start) {
    if (progressRatio >= 0.9) scheduleStatus = "Kurz vor Übergabe";
    else if (progressRatio >= 0.55) scheduleStatus = "Laufende Ausführung";
    else scheduleStatus = "Frühe Projektphase";
  }

  return {
    status: scheduleStatus,
    progressPercent,
    detail: `Stichtag ${formatDate(project.analysisDate)} · Projektfortschritt ca. ${progressPercent} %`,
    progressLabel: `${progressPercent} % der geplanten Laufzeit`
  };
}

function calculateRiskRegisterResult(state) {
  const view = state.ui?.riskRegisterView || {};
  const editSortBy = ["newest", "id"].includes(view.editSortBy) ? view.editSortBy : "newest";
  const sourceRisks = Array.isArray(state.riskRegister?.risks) && state.riskRegister.risks.length
    ? state.riskRegister.risks
    : initialState.riskRegister.risks;
  const risks = sourceRisks.map((risk) => {
    const financialImpact = Number(risk.financialImpact) || 0;
    const probabilityPercent = Number(risk.probabilityPercent) || 0;
    const likelihood = deriveRiskLikelihoodFromPercent(probabilityPercent, risk.likelihood || 1);
    const impact = Number(risk.impact) || 0;
    const expectedDamage = financialImpact * (probabilityPercent / 100);
    const qualitativeRiskValue = likelihood * impact;
    return {
      ...risk,
      financialImpact,
      probabilityPercent,
      likelihood,
      impact,
      expectedDamage,
      qualitativeRiskValue
    };
  });
  const editRisks = [...risks].sort((a, b) => {
    const riskNumber = (risk) => {
      const match = String(risk.id || "").match(/^R-(\d{4})$/i);
      return match ? Number(match[1]) || 0 : 0;
    };
    if (editSortBy === "id") {
      return riskNumber(a) - riskNumber(b) || String(a.id || "").localeCompare(String(b.id || ""), "de");
    }
    const aNo = riskNumber(a);
    const bNo = riskNumber(b);
    if (aNo !== bNo) return bNo - aNo;
    const aTs = Date.parse(a.createdAt || "");
    const bTs = Date.parse(b.createdAt || "");
    if (Number.isFinite(aTs) && Number.isFinite(bTs) && aTs !== bTs) return bTs - aTs;
    return String(b.id || "").localeCompare(String(a.id || ""), "de");
  });
  const totalExpectedDamage = risks.reduce((sum, risk) => sum + risk.expectedDamage, 0);
  const criticalCount = risks.filter((risk) => risk.qualitativeRiskValue >= 13).length;
  const activeCount = risks.filter((risk) => normalizeRiskStatusValue(risk.status) !== "geschlossen").length;
  const closedCount = risks.filter((risk) => String(risk.status || "").toLowerCase() === "geschlossen").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayTs = parseRiskDateValue(today);
  const overdueCount = risks.filter((risk) => {
    const dueTs = parseRiskDateValue(risk.dueDate);
    return dueTs !== null && todayTs !== null && dueTs < todayTs && String(risk.status || "").toLowerCase() !== "geschlossen";
  }).length;
  const ownerOptions = [...new Set(risks.map((risk) => String(risk.owner || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
  const categoryOptions = [...new Set(risks.map((risk) => String(risk.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
  const searchTerm = String(view.search || "").trim().toLowerCase();
  const selectedStatus = String(view.status || "alle").toLowerCase();
  const selectedOwner = String(view.owner || "alle").trim().toLowerCase();
  const selectedCategory = String(view.category || "alle").trim().toLowerCase();
  const criticalOnly = Boolean(view.criticalOnly);
  const dueFrom = String(view.dueFrom || "").trim();
  const dueTo = String(view.dueTo || "").trim();
  const dueFromTs = parseRiskDateValue(dueFrom);
  const dueToTs = parseRiskDateValue(dueTo);

  const filteredRisks = risks
    .filter((risk) => {
      if (selectedStatus !== "alle" && String(risk.status || "").toLowerCase() !== selectedStatus) return false;
      if (selectedOwner !== "alle" && String(risk.owner || "").trim().toLowerCase() !== selectedOwner) return false;
      if (selectedCategory !== "alle" && String(risk.category || "").trim().toLowerCase() !== selectedCategory) return false;
      const riskDueTs = parseRiskDateValue(risk.dueDate);
      if ((dueFromTs !== null || dueToTs !== null) && riskDueTs === null) return false;
      if (dueFromTs !== null && riskDueTs !== null && riskDueTs < dueFromTs) return false;
      if (dueToTs !== null && riskDueTs !== null && riskDueTs > dueToTs) return false;
      if (criticalOnly && risk.qualitativeRiskValue < 13) return false;
      if (!searchTerm) return true;
      return [
        risk.id,
        risk.title,
        risk.category,
        risk.phase,
        risk.area,
        risk.owner,
        risk.description,
        risk.measures
      ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
    })
    .sort((a, b) => {
      const aDueTs = parseRiskDateValue(a.dueDate);
      const bDueTs = parseRiskDateValue(b.dueDate);
      const overdueDelta = Number(Boolean(bDueTs !== null && todayTs !== null && bDueTs < todayTs && String(b.status || "").toLowerCase() !== "geschlossen")) - Number(Boolean(aDueTs !== null && todayTs !== null && aDueTs < todayTs && String(a.status || "").toLowerCase() !== "geschlossen"));
      if (overdueDelta !== 0) return overdueDelta;
      const scoreDelta = b.qualitativeRiskValue - a.qualitativeRiskValue;
      if (scoreDelta !== 0) return scoreDelta;
      return b.expectedDamage - a.expectedDamage;
    });

  const ownerStats = ownerOptions.map((owner) => {
    const ownerRisks = risks.filter((risk) => String(risk.owner || "").trim() === owner);
    return {
      owner,
      activeCount: ownerRisks.filter((risk) => String(risk.status || "").toLowerCase() !== "geschlossen").length,
      criticalCount: ownerRisks.filter((risk) => risk.qualitativeRiskValue >= 13).length,
      overdueCount: ownerRisks.filter((risk) => {
        const dueTs = parseRiskDateValue(risk.dueDate);
        return dueTs !== null && todayTs !== null && dueTs < todayTs && String(risk.status || "").toLowerCase() !== "geschlossen";
      }).length
    };
  });
  const archivedRisks = risks.filter((risk) => normalizeRiskStatusValue(risk.status) === "archiviert");
  const activeRisks = risks.filter((risk) => normalizeRiskStatusValue(risk.status) !== "archiviert");
  const visibleRisks = view.showArchived === true ? risks : activeRisks;
  const criticalRisks = risks.filter((risk) => risk.qualitativeRiskValue >= 13);
  const criticalOpenRisks = criticalRisks.filter((risk) => normalizeRiskStatusValue(risk.status) !== "geschlossen");
  const criticalInProgressRisks = criticalRisks.filter((risk) => ["in bearbeitung", "in bewertung", "überwachung"].includes(normalizeRiskStatusValue(risk.status)));
  const elevatedRisks = risks.filter((risk) => risk.qualitativeRiskValue >= 9 && risk.qualitativeRiskValue < 13);
  const elevatedOpenRisks = elevatedRisks.filter((risk) => normalizeRiskStatusValue(risk.status) !== "geschlossen");

  return {
    risks,
    allRisks: risks,
    activeRisks,
    archivedRisks,
    visibleRiskCount: visibleRisks.length,
    archivedCount: archivedRisks.length,
    filteredRisks,
    totalExpectedDamage,
    criticalCount,
    activeCount,
    closedCount,
    overdueCount,
    criticalRisks,
    criticalOpenRisks,
    criticalInProgressRisks,
    elevatedRisks,
    elevatedOpenRisks,
    overdueRisks: risks.filter((risk) => {
      const dueTs = parseRiskDateValue(risk.dueDate);
      return dueTs !== null && todayTs !== null && dueTs < todayTs && normalizeRiskStatusValue(risk.status) !== "geschlossen";
    }),
    ownerOptions,
    categoryOptions,
    ownerStats,
    editRisks,
    filterSummary: {
      search: view.search || "",
      status: view.status || "alle",
      owner: view.owner || "alle",
      category: view.category || "alle",
      dueFrom: view.dueFrom || "",
      dueTo: view.dueTo || "",
      criticalOnly
    }
  };
}

function getProjectTimeTone(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("nach soll-termin")) return "critical";
  if (value.includes("kurz vor übergabe")) return "warn";
  if (value.includes("in ausführung") || value.includes("frühe ausführung")) return "active";
  return "neutral";
}

function getActiveReportSections(state) {
  const mode = String(state?.ui?.reportMode || "risk").toLowerCase();
  return {
    includePert: false,
    includeMonteCarlo: false,
    includeEarnedValue: false,
    includeRiskRegister: mode !== "none"
  };
}

export function buildManagementReportData(state) {
  const riskRegister = calculateRiskRegisterResult(state);
  const timeContext = calculateProjectTimeContext(state?.project);
  const project = state?.project || {};
  const location = project.location || {};
  const addressPrefix = [location.street, location.houseNumber].filter(Boolean).join(" ");
  const projectAddress = [addressPrefix, [location.postalCode, location.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const sourceRisks = [...riskRegister.risks].sort((a, b) => b.qualitativeRiskValue - a.qualitativeRiskValue || b.expectedDamage - a.expectedDamage);
  const summarizeRisk = (risk) => ({
    id: String(risk.id || ""),
    title: String(risk.title || ""),
    owner: String(risk.owner || "nicht zugewiesen"),
    status: String(risk.status || "offen"),
    category: String(risk.category || ""),
    phase: String(risk.phase || ""),
    dueDate: String(risk.dueDate || ""),
    expectedDamage: formatCurrency(Number(risk.expectedDamage) || 0),
    score: `${Number(risk.qualitativeRiskValue) || 0} / 25`,
    description: String(risk.description || ""),
    measures: String(risk.measures || ""),
    residualRisk: String(risk.residualRisk || "")
  });
  const topRisks = sourceRisks.slice(0, 3).map(summarizeRisk);
  const criticalRisks = sourceRisks.filter((risk) => Number(risk.qualitativeRiskValue) >= 13).map(summarizeRisk);
  const criticalOpenRisks = sourceRisks.filter((risk) => Number(risk.qualitativeRiskValue) >= 13 && normalizeRiskStatusValue(risk.status) !== "geschlossen").map(summarizeRisk);
  const criticalInProgressRisks = sourceRisks.filter((risk) => Number(risk.qualitativeRiskValue) >= 13 && ["in bearbeitung", "in bewertung", "überwachung"].includes(normalizeRiskStatusValue(risk.status))).map(summarizeRisk);
  const elevatedRisks = sourceRisks.filter((risk) => Number(risk.qualitativeRiskValue) >= 9 && Number(risk.qualitativeRiskValue) < 13).map(summarizeRisk);
  const elevatedOpenRisks = sourceRisks.filter((risk) => Number(risk.qualitativeRiskValue) >= 9 && Number(risk.qualitativeRiskValue) < 13 && normalizeRiskStatusValue(risk.status) !== "geschlossen").map(summarizeRisk);
  const overdueRisks = sourceRisks.filter((risk) => {
    const dueTs = parseRiskDateValue(risk.dueDate);
    const todayTs = parseRiskDateValue(new Date().toISOString().slice(0, 10));
    return dueTs !== null && todayTs !== null && dueTs < todayTs && normalizeRiskStatusValue(risk.status) !== "geschlossen";
  }).map(summarizeRisk);
  const summaryCards = [
    {
      label: "Zeitliche Einordnung",
      value: timeContext.status,
      detail: `${formatDate(project.analysisDate)}\n${timeContext.progressLabel}`,
      tone: getProjectTimeTone(timeContext.status)
    },
    {
      label: "Aktive Risiken",
      value: String(riskRegister.activeCount),
      detail: `${riskRegister.criticalCount} kritisch · ${riskRegister.overdueCount} überfällig`,
      tone: riskRegister.criticalCount > 0 || riskRegister.overdueCount > 0 ? "warn" : "neutral"
    },
    {
      label: "Erwarteter Risikoschaden",
      value: formatCurrency(riskRegister.totalExpectedDamage),
      detail: `${riskRegister.criticalCount} kritische Risiken\nSumme der erwarteten Schäden`,
      tone: riskRegister.totalExpectedDamage > 0 ? "critical" : "neutral"
    },
    {
      label: "Top-Risiken",
      value: String(topRisks.length),
      detail: topRisks.length
        ? topRisks.map((risk) => `${risk.id} ${risk.title}`).join("\n")
        : "Keine priorisierten Risiken",
      tone: topRisks.length ? "warn" : "neutral"
    }
  ];
  const focusPoints = [];
  if (riskRegister.criticalCount > 0 || riskRegister.overdueCount > 0) {
    focusPoints.push(`Im Risikoregister sind ${riskRegister.criticalCount} kritische und ${riskRegister.overdueCount} überfällige Risiken sichtbar. Maßnahmen- und Terminverfolgung sollten priorisiert werden.`);
  } else {
    focusPoints.push("Das Risikoregister zeigt aktuell keine kritischen oder überfälligen Risiken mit unmittelbarem Eskalationsbedarf.");
  }
  focusPoints.push(`Der Betrachtungszeitpunkt liegt in der Einordnung "${timeContext.status}". ${timeContext.detail}.`);
  focusPoints.push(`Der erwartete Risikoschaden liegt aktuell bei ${formatCurrency(riskRegister.totalExpectedDamage)}.`);
  if (topRisks.length) {
    focusPoints.push(`Die wichtigsten Risiken sind ${topRisks.map((risk) => `${risk.id} ${risk.title}`).join(", ")}.`);
  }
  const nextSteps = [];
  if (riskRegister.overdueCount > 0) {
    nextSteps.push("Überfällige Risiken mit Verantwortlichen und Terminen in der nächsten Steuerungsrunde einzeln durchgehen.");
  }
  if (riskRegister.criticalCount > 0) {
    nextSteps.push("Kritische Risiken mit Maßnahmen, Termin und Owner priorisiert nachschärfen.");
  }
  if (!nextSteps.length) {
    nextSteps.push("Risikoregister aktuell halten, neue Risiken zeitnah eintragen und Bewertungen regelmäßig fortschreiben.");
  }
  return {
    topline: {
      projectName: String(project.name || ""),
      type: String(project.type || ""),
      bauart: String(project.bauart || ""),
      phase: String(project.phase || ""),
      budget: Number(project.budget) || 0,
      client: String(project.client || ""),
      projectLead: String(project.projectLead || ""),
      projectAddress: projectAddress || "nicht angegeben",
      clientAddressLine: String(project.clientAddressLine || ""),
      clientPostalCode: String(project.clientPostalCode || ""),
      clientCity: String(project.clientCity || ""),
      clientRoles: Array.isArray(project.clientRoles) ? project.clientRoles : [],
      floorsAboveGround: Number(project.floorsAboveGround) || 0,
      floorsBelowGround: Number(project.floorsBelowGround) || 0,
      landArea: Number(project.landArea) || 0,
      reportDate: formatDate(project.analysisDate || new Date().toISOString()),
      analysisDate: formatDate(project.analysisDate || new Date().toISOString()),
      startDate: formatDate(project.startDate),
      endDate: formatDate(project.endDate),
      scheduleStatus: timeContext.status
    },
    summaryCards,
    focusPoints,
    topRisks,
    nextSteps,
    timeContext,
    criticalRisks,
    criticalInProgressRisks,
    criticalOpenRisks,
    elevatedRisks,
    elevatedOpenRisks,
    overdueRisks,
    raw: {
      riskRegister
    }
  };
}

export function renderManagementReportText(state) {
  const report = buildManagementReportData(state);
  const summarizeRiskLine = (risk) => `- ${risk.id} ${risk.title} | ${risk.score} | ${risk.expectedDamage} | Verantwortlich: ${risk.owner} | Status: ${risk.status}`;
  const summarizeRiskParagraph = (risk) => `${risk.id} ${risk.title}: ${risk.description || "keine Beschreibung"} (${risk.score}, ${risk.expectedDamage}, Verantwortlich: ${risk.owner || "nicht zugewiesen"}, Status: ${risk.status || "offen"})`;
  const topRisks = report.topRisks.length ? report.topRisks : [];
  const criticalInProgress = report.criticalInProgressRisks.length ? report.criticalInProgressRisks : [];
  const criticalOpen = report.criticalOpenRisks.length ? report.criticalOpenRisks : [];
  const elevatedOpen = report.elevatedOpenRisks.length ? report.elevatedOpenRisks : [];
  const overdue = report.overdueRisks.length ? report.overdueRisks : [];
  const prioritized = [...report.topRisks]
    .sort((a, b) => {
      const scoreDelta = Number(String(b.score || "0").split("/")[0]) - Number(String(a.score || "0").split("/")[0]);
      if (scoreDelta !== 0) return scoreDelta;
      return String(a.id || "").localeCompare(String(b.id || ""), "de");
    })
    .slice(0, 5);
  const measures = [...report.topRisks]
    .map((risk) => `- ${risk.id} ${risk.title}: ${risk.measures || "Maßnahmen noch nicht gepflegt."}`)
    .slice(0, 5);
  const residuals = [...report.topRisks]
    .map((risk) => `- ${risk.id} ${risk.title}: ${risk.residualRisk || "Restgefahr noch nicht beschrieben."}`)
    .slice(0, 5);
  const steeringPriorities = [
    report.raw.riskRegister.overdueCount > 0 ? "Überfällige Risiken sofort in der nächsten Steuerungsrunde priorisieren." : "Keine überfälligen Risiken mit Sofort-Eskalation.",
    report.raw.riskRegister.criticalCount > 0 ? "Kritische Risiken mit Owner, Termin und Gegenmaßnahmen eng nachverfolgen." : "Keine kritischen Risiken mit unmittelbarer Eskalation.",
    report.raw.riskRegister.totalExpectedDamage > 0 ? `Der erwartete Gesamtschaden liegt bei ${formatCurrency(report.raw.riskRegister.totalExpectedDamage)} und sollte als Steuerungsgröße beobachtet werden.` : "Der erwartete Gesamtschaden ist aktuell nicht auffällig."
  ];
  return [
    `Projekt: ${report.topline.projectName}`,
    `Auftraggeber: ${report.topline.client}`,
    `Projektleitung: ${report.topline.projectLead}`,
    `Analysestichtag: ${report.topline.analysisDate}`,
    `Berichtsdatum: ${report.topline.reportDate}`,
    "Dieser Bericht stellt die aktuelle Risikolage des Projekts zum angegebenen Betrachtungszeitpunkt wie folgt dar:",
    "",
    `Zeitliche Einordnung: ${report.topline.scheduleStatus}`,
    `Projektart: ${report.topline.type}`,
    `Bauart: ${report.topline.bauart}`,
    `Leistungsphase: ${report.topline.phase}`,
    `Projektstandort: ${report.topline.projectAddress}`,
    `Baubeginn: ${report.topline.startDate}`,
    `Geplante Fertigstellung: ${report.topline.endDate}`,
    "",
    "Executive Summary",
    ...report.focusPoints.map((item) => `- ${item}`),
    "",
    "Lagebild",
    `- Aktive Risiken: ${report.raw.riskRegister.activeCount}`,
    `- Kritische Risiken: ${report.raw.riskRegister.criticalCount}`,
    `- Überfällige Risiken: ${report.raw.riskRegister.overdueCount}`,
    `- Erwarteter Gesamtschaden: ${formatCurrency(report.raw.riskRegister.totalExpectedDamage)}`,
    "",
    "Risikoregister im Fokus",
    ...(topRisks.length ? topRisks.map(summarizeRiskLine) : ["- Keine priorisierten Risiken im Register."]),
    "",
    "Kritische Risiken in Bearbeitung",
    ...(criticalInProgress.length ? criticalInProgress.map(summarizeRiskLine) : ["- Keine kritisch bearbeiteten Risiken im Register."]),
    "",
    "Kritische offene Risiken",
    ...(criticalOpen.length ? criticalOpen.map(summarizeRiskLine) : ["- Keine kritischen offenen Risiken im Register."]),
    "",
    "Erhöhte offene Risiken",
    ...(elevatedOpen.length ? elevatedOpen.map(summarizeRiskLine) : ["- Keine erhöhten offenen Risiken im Register."]),
    "",
    "Überfällige Risiken",
    ...(overdue.length ? overdue.map(summarizeRiskLine) : ["- Keine überfälligen Risiken im Register."]),
    "",
    "Priorisierte Risiken",
    ...(prioritized.length ? prioritized.map(summarizeRiskLine) : ["- Keine priorisierten Risiken im Register."]),
    "",
    "Maßnahmen",
    ...(measures.length ? measures : ["- Maßnahmen sind für die priorisierten Risiken noch nicht ausreichend hinterlegt."]),
    "",
    "Restgefahr",
    ...(residuals.length ? residuals : ["- Restgefahr ist für die priorisierten Risiken noch nicht beschrieben."]),
    "",
    "Steuerungsprioritäten",
    ...steeringPriorities.map((item) => `- ${item}`),
    "",
    "Nächste Schritte",
    ...report.nextSteps.map((item) => `- ${item}`),
    "",
    "Hinweise",
    "- Dieser Bericht basiert auf den im Risikoregister gepflegten Risiken und priorisiert die aktive Steuerung.",
    "- Die Angaben zu Maßnahmen und Restgefahr müssen in den einzelnen Risiken fachlich geprüft und fortgeschrieben werden.",
    "- Weitere, außerhalb des Registers bekannte Sachverhalte sind in diesem Bericht nicht enthalten."
  ].join("\n");
}

export function renderRiskReportText(state) {
  return renderManagementReportText(state);
}

function normalizePertSecurityLabel(label) {
  if (!label) return "";
  return String(label)
    .replace("84 % · Budget+", "84 % · Vorsichtiges Niveau")
    .replace("97,5 % · Konservativ", "97,5 % · Konservatives Niveau");
}

function normalizePertSnapshotLabel(label) {
  return normalizePertSecurityLabel(label);
}

function formatIntegerInput(value, suffix = "") {
  const formatted = formatNumber(Number(value) || 0);
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function renderProjectHeaderLine(state) {
  const projectName = escapeHtml(String(state?.project?.name || "Projektname offen").trim());
  const projectType = escapeHtml(String(state?.project?.type || "Projektbezeichnung offen").trim());
  const projectLocation = escapeHtml(
    [state?.project?.location?.postalCode, state?.project?.location?.city].filter(Boolean).join(" ").trim() || "Ort offen"
  );
  return `
    <div class="module-project-line" aria-label="Projektdaten">
      <span class="module-project-name">${projectName}</span>
      <span class="module-project-separator" aria-hidden="true">I</span>
      <span class="module-project-type">${projectType}</span>
      <span class="module-project-separator" aria-hidden="true">I</span>
      <span class="module-project-location">${projectLocation}</span>
    </div>
  `;
}

function renderModuleHeaderBody(state, title, description) {
  const intro = escapeHtml(String(description || "").trim());
  return `
    <div class="project-module-intro module-header-body">
      <h2>${escapeHtml(title)}</h2>
      ${renderProjectHeaderLine(state)}
      <div class="module-project-gap" aria-hidden="true"></div>
      <p class="module-intro-copy">${intro}</p>
      <div class="module-intro-spacer" aria-hidden="true"></div>
    </div>
  `;
}

function renderRiskRegisterProjectMetaBar(state) {
  const project = state?.project || {};
  const timeContext = calculateProjectTimeContext(project);
  const phaseValue = escapeHtml(String(project.phase || "Phase offen").trim());
  const budgetValue = formatCurrency(Number(project.budget) || 0);
  const costBasis = escapeHtml(String(project.costBasis || "unbekannt").trim());
  const analysisDate = escapeHtml(formatDate(project.analysisDate));
  const progressLabel = escapeHtml(String(timeContext?.progressLabel || "Zeitbezug offen").trim());
  const projectBauart = escapeHtml(String(project.bauart || "Bauart offen").trim());
  const projectLocation = [project.location?.postalCode, project.location?.city].filter(Boolean).join(" ");
  const projectLocationLine = escapeHtml(projectLocation || "Ort offen");
  const projectLocationDetail = escapeHtml([project.location?.street, project.location?.houseNumber].filter(Boolean).join(" ") || "Adresse offen");
  return `
    <div class="project-meta-bar risk-register-project-meta" aria-label="Projektdetails">
      <div class="project-meta-item project-meta-budget">
        <span class="project-meta-label">Projektbudget</span>
        <strong class="project-meta-value">${budgetValue}</strong>
        <span class="project-meta-sub">Kostenbasis: ${costBasis}</span>
      </div>
      <div class="project-meta-divider" aria-hidden="true"></div>
      <div class="project-meta-item project-meta-time">
        <span class="project-meta-label">Betrachtungszeitpunkt</span>
        <strong class="project-meta-value">${analysisDate}</strong>
        <span class="project-meta-sub">${progressLabel}</span>
      </div>
      <div class="project-meta-divider" aria-hidden="true"></div>
      <div class="project-meta-item project-meta-name">
        <span class="project-meta-label">Leistungsphase</span>
        <strong class="project-meta-value">${phaseValue}</strong>
        <span class="project-meta-sub">${projectBauart}</span>
      </div>
      <div class="project-meta-divider" aria-hidden="true"></div>
      <div class="project-meta-item project-meta-name">
        <span class="project-meta-label">Ort</span>
        <strong class="project-meta-value">${projectLocationLine}</strong>
        <span class="project-meta-sub">${projectLocationDetail}</span>
      </div>
    </div>
  `;
}

function renderReportMetaBar(state) {
  const project = state?.project || {};
  const projectPhase = escapeHtml(String(project.phase || "LPH offen").trim());
  const projectStatus = escapeHtml(normalizeProjectStatusValue(project.status || "offen"));
  const analysisDate = escapeHtml(formatDate(project.analysisDate));
  const reportDate = escapeHtml(formatDate(new Date().toISOString()));
  return `
    <div class="project-meta-bar report-meta-bar" aria-label="Berichtsdetails">
      <div class="project-meta-item project-meta-time">
        <span class="project-meta-label">Berichtsdatum</span>
        <strong class="project-meta-value">${reportDate}</strong>
        <span class="project-meta-sub">Risikobericht</span>
      </div>
      <div class="project-meta-divider" aria-hidden="true"></div>
      <div class="project-meta-item project-meta-time">
        <span class="project-meta-label">Betrachtungszeitpunkt</span>
        <strong class="project-meta-value">${analysisDate}</strong>
        <span class="project-meta-sub">Projektstichtag</span>
      </div>
      <div class="project-meta-divider" aria-hidden="true"></div>
      <div class="project-meta-item project-meta-name">
        <span class="project-meta-label">Projektstatus</span>
        <strong class="project-meta-value">${projectStatus}</strong>
        <span class="project-meta-sub">Leistungsphase: ${projectPhase}</span>
      </div>
    </div>
  `;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const index = (ordered.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return ordered[lower];
  const weight = index - lower;
  return ordered[lower] * (1 - weight) + ordered[upper] * weight;
}

function createRng(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return function rng() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function sampleNormal(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleGamma(alpha, rng) {
  if (alpha < 1) {
    return sampleGamma(alpha + 1, rng) * Math.pow(rng(), 1 / alpha);
  }
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    const x = sampleNormal(rng);
    const v = Math.pow(1 + c * x, 3);
    if (v <= 0) continue;
    const u = rng();
    if (u < 1 - 0.0331 * Math.pow(x, 4)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleBeta(alpha, beta, rng) {
  const x = sampleGamma(alpha, rng);
  const y = sampleGamma(beta, rng);
  return x / (x + y);
}

export function buildSelectedReportData(state) {
  const report = buildManagementReportData(state);
  const sections = getActiveReportSections(state);
  const reportDraft = String(state?.ui?.reportDraft || "").trim();
  const reportText = reportDraft
    ? reportDraft
    : state?.ui?.reportDraftCleared === true
      ? ""
      : renderRiskReportText(state);

  const payload = {
    meta: {
      app: initialState.meta.app,
      version: initialState.meta.version,
      schemaVersion: initialState.meta.schemaVersion || 1,
      reportMode: "risk",
      reportTitle: "Risikobericht",
      generatedAt: new Date().toISOString()
    },
    project: {
      name: report.topline.projectName,
      type: report.topline.type,
      bauart: report.topline.bauart,
      phase: report.topline.phase,
      projectAddress: report.topline.projectAddress,
      client: report.topline.client,
      projectLead: report.topline.projectLead,
      landArea: report.topline.landArea,
      floorsAboveGround: report.topline.floorsAboveGround,
      floorsBelowGround: report.topline.floorsBelowGround,
      clientRoles: report.topline.clientRoles,
      clientAddressLine: report.topline.clientAddressLine,
      clientPostalCode: report.topline.clientPostalCode,
      clientCity: report.topline.clientCity,
      reportDate: report.topline.reportDate,
      analysisDate: report.topline.analysisDate,
      startDate: report.topline.startDate,
      endDate: report.topline.endDate,
      scheduleStatus: report.topline.scheduleStatus
    },
    report: {
      timeContext: report.timeContext,
      focusPoints: report.focusPoints,
      nextSteps: report.nextSteps,
      selectedModules: sections.includeRiskRegister ? ["Risikoregister"] : [],
      text: reportText
    },
    modules: {}
  };

  if (sections.includeRiskRegister) {
    payload.modules.riskRegister = {
      totalExpectedDamage: report.raw.riskRegister.totalExpectedDamage,
      criticalCount: report.raw.riskRegister.criticalCount,
      activeCount: report.raw.riskRegister.activeCount,
      overdueCount: report.raw.riskRegister.overdueCount,
      topRisks: report.topRisks,
      criticalRisks: report.criticalRisks,
      criticalInProgressRisks: report.criticalInProgressRisks,
      criticalOpenRisks: report.criticalOpenRisks,
      elevatedRisks: report.elevatedRisks,
      elevatedOpenRisks: report.elevatedOpenRisks,
      overdueRisks: report.overdueRisks
    };
  }

  return payload;
}

export function renderSelectedReportText(state) {
  const reportDraft = String(state?.ui?.reportDraft || "").trim();
  return reportDraft
    ? reportDraft
    : state?.ui?.reportDraftCleared === true
      ? ""
      : renderRiskReportText(state);
}

export const modules = {
  project: {
    key: "project",
    label: "Projekt",
    subtitle: "Gemeinsame Stammdaten für alle Module",
    render(state) {
      const project = state.project;
      const report = state.reportProfile;
      const timeContext = calculateProjectTimeContext(project);
      const addressLine = [project.location?.street, project.location?.houseNumber].filter(Boolean).join(" ");
      const missingProjectValue = `<span class="project-context-missing">nicht gepflegt</span>`;
      const renderProjectValue = (value) => (value ? escapeHtml(String(value)) : missingProjectValue);
      const renderProjectNumberValue = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? escapeHtml(String(Number(value))) : missingProjectValue);
      const renderProjectTextListValue = (values) => (Array.isArray(values) && values.length ? escapeHtml(values.join(", ")) : missingProjectValue);
      const renderProjectAddressValue = (line, postalCode, city) => {
        const parts = [line, [postalCode, city].filter(Boolean).join(" ")].filter(Boolean);
        return parts.length ? escapeHtml(parts.join(", ")) : missingProjectValue;
      };
      const renderProjectDateValue = (value) => (value ? escapeHtml(formatDate(value)) : missingProjectValue);
      const renderProjectLocationValue = (street, houseNumber, postalCode, city) => {
        const hasLocation = [street, houseNumber, postalCode, city].some((part) => Boolean(part));
        return hasLocation ? escapeHtml(`${street || ""} ${houseNumber || ""}, ${postalCode || ""} ${city || ""}`.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim()) : missingProjectValue;
      };
      return `
        <div class="module-shell project-module">
          <div class="module-title project-module-title">
            ${renderModuleHeaderBody(state, "Projekt", "Zentrale Stammdaten für das gesamte Register.")}
            <span class="badge">Zentrale Datenbasis</span>
          </div>
          <div class="project-meta-bar project-overview-meta-bar" aria-label="Projektschlüsselwerte">
            <div class="project-meta-item project-meta-name">
              <span class="project-meta-label">Projektname</span>
              <strong class="project-meta-value">${project.name}</strong>
              <span class="project-meta-sub">${project.type}</span>
            </div>
            <div class="project-meta-divider" aria-hidden="true"></div>
            <div class="project-meta-item project-meta-budget">
              <span class="project-meta-label">Projektbudget</span>
              <strong class="project-meta-value">${formatCurrency(project.budget)}</strong>
              <span class="project-meta-sub">Kostenbasis: ${project.costBasis}</span>
            </div>
            <div class="project-meta-divider" aria-hidden="true"></div>
            <div class="project-meta-item project-meta-time">
              <span class="project-meta-label">Betrachtungszeitpunkt</span>
              <strong class="project-meta-value">${formatDate(project.analysisDate)}</strong>
              <span class="project-meta-sub">${timeContext.progressLabel}</span>
            </div>
          </div>
          <div class="card-grid project-overview-grid">
            <section class="info-card project-context-card card-neutral">
              <h3>Projektkontext</h3>
              <div class="project-context-grid">
                <div class="project-context-group">
                  <h4>Grundlagen</h4>
                  <ul>
                    <li><strong>Bauart:</strong> ${renderProjectValue(project.bauart)}</li>
                    <li><strong>Leistungsphase:</strong> ${renderProjectValue(project.phase)}</li>
                    <li><strong>Projekttyp:</strong> ${renderProjectValue(project.type)}</li>
                    <li><strong>BGF:</strong> ${new Intl.NumberFormat("de-DE").format(project.bgf)} m²</li>
                  </ul>
                </div>
                <div class="project-context-group">
                  <h4>Umfang & Ort</h4>
                  <ul>
                    <li><strong>Grundstücksgröße:</strong> ${project.landArea ? `${new Intl.NumberFormat("de-DE").format(project.landArea)} m²` : missingProjectValue}</li>
                    <li><strong>Geschosse oberirdisch:</strong> ${renderProjectNumberValue(project.floorsAboveGround)}</li>
                    <li><strong>Geschosse unterirdisch:</strong> ${renderProjectNumberValue(project.floorsBelowGround)}</li>
                    <li><strong>Standort:</strong> ${renderProjectLocationValue(project.location.street, project.location.houseNumber, project.location.postalCode, project.location.city)}</li>
                  </ul>
                </div>
                <div class="project-context-group">
                  <h4>Beteiligte</h4>
                  <ul>
                    <li><strong>Auftraggeber:</strong> ${renderProjectValue(project.client)}</li>
                    <li><strong>Rollen:</strong> ${renderProjectTextListValue(project.clientRoles)}</li>
                    <li><strong>Auftraggeberanschrift:</strong> ${renderProjectAddressValue(project.clientAddressLine, project.clientPostalCode, project.clientCity)}</li>
                    <li><strong>Projektleitung:</strong> ${renderProjectValue(project.projectLead)}</li>
                  </ul>
                </div>
                <div class="project-context-group">
                  <h4>Termine</h4>
                  <ul>
                    <li><strong>Baubeginn:</strong> ${renderProjectDateValue(project.startDate)}</li>
                    <li><strong>Geplante Fertigstellung:</strong> ${renderProjectDateValue(project.endDate)}</li>
                    <li><strong>Betrachtungszeitpunkt:</strong> ${renderProjectDateValue(project.analysisDate)}</li>
                    <li><span class="project-timeline-progress-label">Projektfortschritt in %:</span> <span class="project-timeline-progress-value">${Math.max(0, Math.min(100, Number(timeContext.progressPercent) || 0))} %</span></li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
          <section class="info-card card-neutral">
            <h3>Projektdaten bearbeiten</h3>
            <div class="project-data-grid">
              <section class="info-card project-data-card card-neutral">
                <h4>Projekt</h4>
                <div class="project-matrix-grid project-object-grid">
                  <div class="form-field project-matrix-span-12">
                    <label for="project_name">Projektname</label>
                    <input id="project_name" data-project-field="name" type="text" tabindex="1" value="${project.name}" placeholder="Name des Projekts">
                  </div>
                  <div class="form-field project-matrix-span-4-of-16">
                    <label for="project_bauart">Bauart</label>
                    <select id="project_bauart" data-project-field="bauart" tabindex="2">
                      <option value="Neubau" ${project.bauart === "Neubau" ? "selected" : ""}>Neubau</option>
                      <option value="Sanierung" ${project.bauart === "Sanierung" ? "selected" : ""}>Sanierung</option>
                      <option value="Umbau" ${project.bauart === "Umbau" ? "selected" : ""}>Umbau</option>
                      <option value="Erweiterung" ${project.bauart === "Erweiterung" ? "selected" : ""}>Erweiterung</option>
                    </select>
                  </div>
                  <div class="form-field project-matrix-span-6">
                    <label for="project_type">Projekttyp</label>
                    <input id="project_type" data-project-field="type" type="text" tabindex="3" value="${project.type}" placeholder="z. B. Büro- und Verwaltungsbau">
                  </div>
                  <div class="form-field project-matrix-span-3">
                    <label for="project_phase">Leistungsphase</label>
                    <select id="project_phase" data-project-field="phase" tabindex="4">
                      ${["LPH 0","LPH 1","LPH 2","LPH 3","LPH 4","LPH 5","LPH 6","LPH 7","LPH 8","LPH 9"].map((phase) => `
                        <option value="${phase}" ${project.phase === phase ? "selected" : ""}>${phase}</option>
                      `).join("")}
                    </select>
                  </div>
                  <div class="form-field project-matrix-span-7">
                    <label for="project_status">Projektstatus</label>
                    <select id="project_status" data-project-field="status" tabindex="5">
                      ${buildProjectStatusOptions(project.status).map((status) => `
                        <option value="${escapeHtml(status)}" ${normalizeProjectStatusValue(project.status) === status ? "selected" : ""}>${escapeHtml(status)}</option>
                      `).join("")}
                    </select>
                  </div>
                </div>
              </section>
              <section class="info-card project-data-card card-neutral">
                <h4>Standort & Objekt</h4>
                <div class="project-matrix-grid">
                  <div class="form-field project-matrix-span-2">
                    <label for="project_address_line">Projektstandort: Straße / Hausnummer</label>
                    <input id="project_address_line" data-project-address-field="combined" type="text" tabindex="6" value="${addressLine}" placeholder="Straße und Hausnummer">
                  </div>
                  <div class="form-field">
                    <label for="project_postal_code">PLZ</label>
                    <input id="project_postal_code" data-project-location-field="postalCode" type="text" tabindex="7" value="${project.location.postalCode}" placeholder="Postleitzahl">
                  </div>
                  <div class="form-field">
                    <label for="project_city">Ort</label>
                    <input id="project_city" data-project-location-field="city" type="text" tabindex="8" value="${project.location.city}" placeholder="Ort">
                  </div>
                  <div class="form-field">
                    <label for="project_land_area">Grundstücksgr. in m²</label>
                    <div class="numeric-project-field-wrap">
                      <input id="project_land_area" name="project_land_area_value" class="numeric-project-input" data-project-field="landArea" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" spellcheck="false" readonly tabindex="9" value="${formatIntegerInput(project.landArea)}">
                      <span class="numeric-project-unit" aria-hidden="true">m²</span>
                    </div>
                  </div>
                  <div class="form-field project-bgf-narrow">
                    <label for="project_bgf">BGF in m²</label>
                    <div class="numeric-project-field-wrap">
                      <input id="project_bgf" name="project_bgf_value" class="numeric-project-input" data-project-field="bgf" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" spellcheck="false" readonly tabindex="10" value="${formatIntegerInput(project.bgf)}">
                      <span class="numeric-project-unit" aria-hidden="true">m²</span>
                    </div>
                  </div>
                  <div class="form-field project-object-narrow">
                    <label for="project_floors_above_ground">GESCHOSSE OBERIRD.</label>
                    <div class="numeric-project-field-wrap geschosse">
                      <input id="project_floors_above_ground" class="numeric-project-input" data-project-field="floorsAboveGround" type="text" inputmode="numeric" pattern="[0-9]*" tabindex="11" value="${formatIntegerInput(project.floorsAboveGround)}">
                      <span class="numeric-project-unit" aria-hidden="true">Geschosse</span>
                    </div>
                  </div>
                  <div class="form-field project-object-narrow">
                    <label for="project_floors_below_ground">GESCHOSSE UNTERIRD.</label>
                    <div class="numeric-project-field-wrap geschosse">
                      <input id="project_floors_below_ground" class="numeric-project-input" data-project-field="floorsBelowGround" type="text" inputmode="numeric" pattern="[0-9]*" tabindex="12" value="${formatIntegerInput(project.floorsBelowGround)}">
                      <span class="numeric-project-unit" aria-hidden="true">Geschosse</span>
                    </div>
                  </div>
                </div>
              </section>
              <section class="info-card project-data-card project-matrix-span-4 card-neutral">
                <h4>Beteiligte</h4>
                <div class="project-matrix-grid">
                  <div class="form-field project-matrix-span-2">
                    <label for="project_client">Name / Organisation</label>
                    <input id="project_client" data-project-field="client" type="text" tabindex="13" value="${project.client}" placeholder="Name des Auftraggebers, Bauherrn oder Investors">
                  </div>
                  <div class="form-field project-matrix-span-2">
                    <span class="project-role-label">Rollen</span>
                    <p class="project-role-note">Mehrere Rollen sind möglich. Wählen Sie alle Rollen aus, die für dieses Projekt zutreffen.</p>
                    <div class="project-role-group project-role-group-inline">
                      <div class="project-role-options project-role-options-singleline">
                        ${[
                          ["Auftraggeber", "Beauftragt oder steuert das Projekt."],
                          ["Bauherr", "Rechtlich und organisatorisch verantwortliche Stelle für das Bauvorhaben."],
                          ["Investor", "Trägt das Projekt wirtschaftlich oder finanziert es."],
                          ["Projektentwickler", "Plant und entwickelt das Projekt bis zur Umsetzungsreife."],
                          ["Bauträger", "Entwickelt, baut und vermarktet das Projekt häufig in eigener Verantwortung."],
                        ].map(([role, hint]) => `
                          <label class="project-role-option">
                            <input type="checkbox" data-project-role-field="clientRoles" value="${role}" title="${hint}" ${Array.isArray(project.clientRoles) && project.clientRoles.includes(role) ? "checked" : ""}>
                            <span>${role}</span>
                          </label>
                        `).join("")}
                      </div>
                    </div>
                  </div>
                  <div class="form-field project-matrix-span-2">
                    <label for="project_lead">Ansprechpartner / Verantwortliche Person</label>
                    <input id="project_lead" data-project-field="projectLead" type="text" tabindex="14" value="${project.projectLead}" placeholder="Name des Ansprechpartners / der verantwortlichen Person">
                  </div>
                  <div class="form-field project-matrix-span-2">
                    <span class="project-role-label">Funktion im Projekt</span>
                    <p class="project-role-note">Mehrere Funktionen sind möglich. Wählen Sie alle zutreffenden Aufgaben aus.</p>
                    <div class="project-role-group project-role-group-inline">
                      <div class="project-role-options project-role-options-singleline">
                        ${[
                          ["Projektleitung", "Verantwortet die operative Leitung des Projekts."],
                          ["Projektsteuerung", "Steuert Termine, Kosten und Abläufe im Projekt."],
                          ["Bauherrenvertretung", "Vertritt die Interessen des Bauherrn im Projekt."],
                        ].map(([role, hint]) => `
                          <label class="project-role-option">
                            <input type="checkbox" data-project-role-field="clientFunctions" value="${role}" title="${hint}" ${Array.isArray(project.clientFunctions) && project.clientFunctions.includes(role) ? "checked" : ""}>
                            <span>${role}</span>
                          </label>
                        `).join("")}
                      </div>
                    </div>
                  </div>
                  <div class="form-field project-matrix-span-2">
                    <label for="project_client_address_line">Straße / Hausnummer</label>
                    <input id="project_client_address_line" data-project-field="clientAddressLine" type="text" tabindex="15" value="${project.clientAddressLine || ""}" placeholder="Straße und Hausnummer">
                  </div>
                  <div class="form-field">
                    <label for="project_client_postal_code">PLZ</label>
                    <input id="project_client_postal_code" data-project-field="clientPostalCode" type="text" tabindex="16" value="${project.clientPostalCode || ""}" placeholder="Postleitzahl">
                  </div>
                  <div class="form-field">
                    <label for="project_client_city">Ort</label>
                    <input id="project_client_city" data-project-field="clientCity" type="text" tabindex="17" value="${project.clientCity || ""}" placeholder="Ort">
                  </div>
                </div>
              </section>
              <section class="info-card project-data-card project-description-card project-matrix-span-4 card-neutral">
                <h4>Beschreibung</h4>
                <div class="project-matrix-grid">
                  <div class="form-field project-matrix-span-4">
                    <label for="project_description">Projektbeschreibung</label>
                    <textarea id="project_description" class="project-description-textarea" data-project-field="description" rows="2" tabindex="18" placeholder="Kurze Beschreibung des Projekts">${project.description}</textarea>
                  </div>
                </div>
              </section>
              <section class="info-card project-data-card project-timeline-card project-matrix-span-4 card-neutral">
                <h4>Termin & Fortschritt</h4>
                <div class="project-timeline-layout project-timeline-layout-restored">
                  <div class="project-timeline-fields">
                    <div class="form-field">
                      <label for="project_start">Projektstart</label>
                      <input id="project_start" data-project-field="startDate" type="date" tabindex="19" value="${project.startDate}">
                    </div>
                    <div class="form-field">
                      <label for="project_end">Geplante Fertigstellung</label>
                      <input id="project_end" data-project-field="endDate" type="date" tabindex="20" value="${project.endDate}">
                    </div>
                    <div class="form-field">
                      <label for="project_analysis_date">Betrachtungszeitpunkt</label>
                      <input id="project_analysis_date" data-project-field="analysisDate" type="date" tabindex="21" value="${project.analysisDate || ""}">
                    </div>
                  </div>
                  <div class="project-timeline-progress-block" aria-label="Projektfortschritt">
                    <div class="project-summary-progress-row">
                      <div class="project-summary-progress-line">
                        <strong class="project-timeline-progress-label">Projektfortschritt in %:</strong>
                        <span class="project-timeline-progress-value">${Math.max(0, Math.min(100, Number(timeContext.progressPercent) || 0))} %</span>
                      </div>
                      <div class="project-summary-progress-pill" aria-hidden="true">
                        <span class="project-summary-progress-pill-fill" style="width:${Math.max(0, Math.min(100, Number(timeContext.progressPercent) || 0))}%"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <p class="form-note">Diese Angaben bilden die gemeinsame Projektbasis für das Risikoregister sowie die spätere KI- und Berichtseinordnung des Projektstands.</p>
          </section>
          <div class="card-grid">
            <section class="info-card report-profile-card-shell card-neutral">
              <h3>Berichtsprofil</h3>
              <div class="report-profile-stack">
                <section class="report-profile-subcard">
                  <h4>Absender</h4>
                  <div class="report-sender-grid">
                    <div class="form-field">
                      <label for="report_company">Erstellende Stelle</label>
                      <input id="report_company" data-report-field="company" type="text" value="${report.company}" placeholder="Name der erstellenden Stelle">
                    </div>
                    <div class="form-field">
                      <label for="report_company_address">Anschrift Erstellende Stelle</label>
                      <input id="report_company_address" data-report-field="companyAddress" type="text" value="${report.companyAddress}" placeholder="Straße, Hausnummer, PLZ, Ort">
                    </div>
                    <div class="form-field">
                      <label for="report_author">Erstellt von</label>
                      <input id="report_author" data-report-field="author" type="text" value="${report.author}" placeholder="Name der bearbeitenden Person">
                    </div>
                  </div>
                </section>
                <section class="report-profile-subcard">
                  <h4>Empfänger</h4>
                  <div class="report-recipient-grid">
                    <div class="form-field">
                      <label for="report_client_name">Empfänger / Auftraggeber</label>
                      <input id="report_client_name" data-report-field="clientName" type="text" value="${report.clientName}" placeholder="Name des Empfängers oder Auftraggebers">
                    </div>
                    <div class="form-field">
                      <label for="report_client_address">Anschrift Empfänger / Auftraggeber</label>
                      <input id="report_client_address" data-report-field="clientAddress" type="text" value="${report.clientAddress}" placeholder="Straße, Hausnummer, PLZ, Ort">
                    </div>
                    <div class="form-field">
                      <label for="report_confidentiality">Vertraulichkeit</label>
                      <select id="report_confidentiality" data-report-field="confidentiality">
                        ${["Intern", "Vertraulich", "Streng vertraulich"].map((option) => `
                          <option value="${option}" ${String(report.confidentiality || "Vertraulich") === option ? "selected" : ""}>${option}</option>
                        `).join("")}
                      </select>
                    </div>
                  </div>
                </section>
                <section class="report-profile-subcard">
                  <h4>Hinweise</h4>
                  <div class="project-matrix-grid">
                    <div class="form-field project-matrix-span-4 report-notes-field">
                      <label for="report_notes">Notizen</label>
                      <textarea id="report_notes" class="project-description-textarea" data-report-field="notes" placeholder="Zusätzliche Hinweise zum Bericht">${report.notes}</textarea>
                    </div>
                  </div>
                </section>
              </div>
            </section>
            <section class="info-card project-files-card card-info">
              <div class="project-files-head">
                <div>
                  <h3>Dateien</h3>
                  <p>Projektstände speichern, laden und direkt aus dem Browser-Verlauf wieder öffnen.</p>
                </div>
                <div class="storage-status storage-status-box project-files-status" id="storageStatus">Autosave bereit.</div>
              </div>
              <div class="project-files-body">
                <div class="action-file-grid">
                  <div class="form-field">
                    <label for="projectExportFileName">Projektdateiname</label>
                    <div class="field-hint">Vorschlag aus dem Projektnamen, bei Bedarf anpassen.</div>
                    <div class="project-export-filename-row">
                      <input id="projectExportFileName" data-project-export-field="fileName" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" value="${escapeHtml(String(state.ui?.projectExportName || project.name || "").replace(/\.(json|doc|pdf)$/i, "").replace(/\s+/g, "_"))}" placeholder="${escapeHtml((project.name || "Projektname").replace(/\s+/g, "_"))}" title="Der Dateiname wird aus dem Projektnamen vorgeschlagen und kann angepasst werden.">
                      <span class="project-export-filename-suffix" aria-hidden="true">.json</span>
                    </div>
                  </div>
                </div>
                <div class="project-files-actions">
                  <button class="action-btn primary" id="saveProjectBtn" type="button">Projektdatei speichern (.json)</button>
                  <button class="action-btn" id="loadProjectBtn" type="button">Projektdatei laden (.json)</button>
                  <button class="action-btn danger" id="resetProjectBtn" type="button">Projektstand zurücksetzen</button>
                  <button class="action-btn" id="loadDemoBtn" type="button">Demo-Datei laden</button>
                </div>
                ${renderRecentProjectFilesHtml()}
                <p class="form-note">
                  <strong>Speichern:</strong> legt eine JSON-Datei im Downloads-Ordner ab und merkt sich den Projektstand zusätzlich im Browser.<br>
                  <strong>Laden:</strong> öffnet eine lokale JSON-Datei von deinem Rechner und übernimmt sie als aktuellen Projektstand.<br>
                  <strong>Zuletzt gespeicherte Projekte:</strong> zeigt die drei letzten Projektstände an, die in diesem Browser gespeichert wurden, damit du sie direkt ohne Dateiauswahl wieder öffnen kannst.<br>
                  <strong>Projektstand zurücksetzen:</strong> leert nur den aktuellen Browserstand. Dateien, die bereits im Downloads-Ordner gespeichert wurden, bleiben unverändert erhalten.
                </p>
                <p class="form-note project-files-browser-note">
                  Der Browser-Schnellzugriff ist an das aktuelle Gerät und Browserprofil gebunden. Wenn Browserdaten gelöscht werden, der private Modus verwendet wird oder ein anderer Browser geöffnet wird, kann der Verlauf verschwinden. Die JSON-Datei im Downloads-Ordner ist deshalb die sichere, portable Sicherung.
                </p>
                <input class="visually-hidden" id="projectFileInput" type="file" accept="application/json,.json">
              </div>
            </section>
          </div>
        </div>
      `;
    }
  },
  riskRegister: {
    key: "riskRegister",
    label: "Risikoregister",
    subtitle: "Operative Risiken, Maßnahmen und Status",
    render(state) {
      const result = calculateRiskRegisterResult(state);
      const riskView = state.ui?.riskRegisterView || {};
      const editSortBy = ["newest", "id"].includes(riskView.editSortBy) ? riskView.editSortBy : "newest";
      const foldAllOpen = riskView.foldAllOpen === true;
      const panelOpenStates = normalizeRiskRegisterPanelOpenStates(riskView.panelOpenStates);
      const panelOrder = normalizeRiskRegisterPanelOrder(riskView.panelOrder);
      const panelRank = new Map(panelOrder.map((key, index) => [key, index]));
      const panelOrderStyle = (key) => `order:${panelRank.get(key) ?? 999};`;
      const riskUndoCount = Array.isArray(state.ui?.riskRegisterUndoStack) ? state.ui.riskRegisterUndoStack.length : 0;
      const riskRedoCount = Array.isArray(state.ui?.riskRegisterRedoStack) ? state.ui.riskRegisterRedoStack.length : 0;
      const classifyRiskTone = (risk) => {
        if (normalizeRiskStatusValue(risk.status) === "archiviert") return { key: "archived", label: "Archiviert" };
        if (risk.qualitativeRiskValue >= 13) return { key: "critical", label: "Kritisch" };
        if (risk.qualitativeRiskValue >= 9) return { key: "warn", label: "Erhöht" };
        return { key: "neutral", label: "Beobachten" };
      };
      const classifyStatusTone = (status) => {
        const value = normalizeRiskStatusValue(status);
        if (value === "geschlossen") return { key: "closed", label: "Geschlossen" };
        if (value === "archiviert") return { key: "archived", label: "Archiviert" };
        if (value === "überwachung") return { key: "watch", label: "Überwachung" };
        if (value === "in bearbeitung") return { key: "progress", label: "In Bearbeitung" };
        if (value === "in bewertung") return { key: "action", label: "In Bewertung" };
        return { key: "open", label: "Offen" };
      };
      const statusFilterOptions = [
        { value: "alle", label: "Alle" },
        { value: "offen", label: "Offen" },
        { value: "in bewertung", label: "In Bewertung" },
        { value: "in bearbeitung", label: "In Bearbeitung" },
        { value: "überwachung", label: "Überwachung" },
        { value: "archiviert", label: "Archiviert" },
        { value: "geschlossen", label: "Geschlossen" }
      ];
      const statusOptions = statusFilterOptions.filter((status) => status.value !== "alle");
      const visibleColumns = state.ui?.riskRegisterView?.visibleColumns || ["priority", "status", "value", "category", "phase", "impact", "owner", "dueDate", "measures"];
      const matrixSelection = riskView.matrixSelection || null;
      const columnDefs = [
        { key: "priority", label: "Priorität", render: (risk) => classifyRiskTone(risk).label },
        { key: "status", label: "Status", render: (risk) => {
          const value = normalizeRiskStatusValue(risk.status);
          const match = statusOptions.find((status) => status.value === value);
          return match ? match.label : "Offen";
        } },
        { key: "value", label: "Risikowert", render: (risk) => formatCurrency(risk.expectedDamage), numeric: true },
        { key: "category", label: "Kategorie", render: (risk) => risk.category || "—" },
        { key: "phase", label: "Projektphase / Zuordnung", render: (risk) => risk.phase || "—" },
        { key: "impact", label: "Auswirkung", render: (risk) => `${Math.round(Number(risk.probabilityPercent) || 0)}% / ${formatCurrency(risk.financialImpact)}`, numeric: true },
        { key: "owner", label: "Verantwortlichkeit", render: (risk) => risk.owner || "nicht zugewiesen" },
        { key: "dueDate", label: "Ziel-Termin", render: (risk) => (risk.dueDate ? formatDate(risk.dueDate) : "—") },
        { key: "measures", label: "Maßnahmenplanung", render: (risk) => {
          const measures = String(risk.measures || risk.description || "").trim();
          return measures ? (measures.length > 112 ? `${measures.slice(0, 109)}...` : measures) : "Keine Maßnahmen gepflegt";
        } }
      ];
      const tableColumns = [
        { key: "id", label: "Risiko-ID" },
        { key: "title", label: "Risiko" },
        ...columnDefs.filter((column) => visibleColumns.includes(column.key))
      ];
      const tableColumnWidths = {
        id: 94,
        title: 248,
        category: 122,
        phase: 170,
        impact: 138,
        value: 112,
        priority: 116,
        status: 132,
        owner: 168,
        dueDate: 118,
        measures: 238
      };
      const sortBy = ["priority", "value", "id", "dueDate", "category"].includes(riskView.sortBy) ? riskView.sortBy : "priority";
      const matrixCounts = Array.from({ length: 5 }, () => Array(5).fill(0));
      const hasRiskFilters = Boolean(
        String(riskView.search || "").trim() ||
        String(riskView.status || "alle").trim().toLowerCase() !== "alle" ||
        String(riskView.owner || "alle").trim().toLowerCase() !== "alle" ||
        String(riskView.category || "alle").trim().toLowerCase() !== "alle" ||
        riskView.criticalOnly === true ||
        String(riskView.dueFrom || "").trim() ||
        String(riskView.dueTo || "").trim() ||
        matrixSelection
      );
      const defaultVisibleRiskRows = riskView.showArchived === true ? result.risks : result.activeRisks;
      const visibleRiskRows = hasRiskFilters
        ? (result.filteredRisks.length ? result.filteredRisks : defaultVisibleRiskRows)
        : defaultVisibleRiskRows;
      const chartSourceRisks = visibleRiskRows;
      visibleRiskRows.forEach((risk) => {
        const likelihood = Math.max(1, Math.min(5, Number(risk.likelihood) || 1));
        const impact = Math.max(1, Math.min(5, Number(risk.impact) || 1));
        matrixCounts[5 - impact][likelihood - 1] += 1;
      });
      const qualitativeSummary = {
        critical: visibleRiskRows.filter((risk) => classifyRiskTone(risk).key === "critical").length,
        warn: visibleRiskRows.filter((risk) => classifyRiskTone(risk).key === "warn").length,
        neutral: visibleRiskRows.filter((risk) => classifyRiskTone(risk).key === "neutral").length
      };
      const selectedMatrixRisks = matrixSelection
        ? visibleRiskRows.filter((risk) => Number(risk.likelihood) === matrixSelection.likelihood && Number(risk.impact) === matrixSelection.impact)
        : [];
      const topLimit = [0, 5, 10, 20].includes(Number(riskView.topLimit)) ? Number(riskView.topLimit) : 5;
      const riskTableWidth = tableColumns.reduce((sum, column) => sum + (tableColumnWidths[column.key] || 132), 0);
      const filteredRiskValueTotal = chartSourceRisks.reduce((sum, risk) => sum + (Number(risk.expectedDamage) || 0), 0);
      const operationalToneClass = result.criticalCount > 0 || result.overdueCount > 0
        ? "card-critical"
        : result.activeCount > 0
          ? "card-warn"
          : "card-success";
      const sortedRisks = [...chartSourceRisks].sort((a, b) => {
        if (sortBy === "value") {
          return b.expectedDamage - a.expectedDamage || b.qualitativeRiskValue - a.qualitativeRiskValue;
        }
        if (sortBy === "id") {
          return String(a.id || "").localeCompare(String(b.id || ""), "de");
        }
        if (sortBy === "category") {
          return String(a.category || "").localeCompare(String(b.category || ""), "de") || b.qualitativeRiskValue - a.qualitativeRiskValue;
        }
        if (sortBy === "dueDate") {
          const aDueTs = parseRiskDateValue(a.dueDate);
          const bDueTs = parseRiskDateValue(b.dueDate);
          return (aDueTs ?? Number.POSITIVE_INFINITY) - (bDueTs ?? Number.POSITIVE_INFINITY) || b.qualitativeRiskValue - a.qualitativeRiskValue;
        }
        const todayTs = parseRiskDateValue(new Date().toISOString().slice(0, 10));
        const aDueTs = parseRiskDateValue(a.dueDate);
        const bDueTs = parseRiskDateValue(b.dueDate);
        const aOverdue = Number(Boolean(aDueTs !== null && todayTs !== null && aDueTs < todayTs && String(a.status || "").toLowerCase() !== "geschlossen"));
        const bOverdue = Number(Boolean(bDueTs !== null && todayTs !== null && bDueTs < todayTs && String(b.status || "").toLowerCase() !== "geschlossen"));
        return bOverdue - aOverdue || b.qualitativeRiskValue - a.qualitativeRiskValue || b.expectedDamage - a.expectedDamage;
      });
      const topRisks = topLimit === 0 ? sortedRisks : sortedRisks.slice(0, topLimit);
      const topMetricMax = Math.max(...topRisks.map((risk) => sortBy === "value" ? risk.expectedDamage : risk.qualitativeRiskValue), 1);
      return `
        <div class="module-shell risk-register-shell">
          <div class="module-title project-module-title risk-register-title">
            ${renderModuleHeaderBody(state, "Risikoregister", "Aktive Steuerung, Archivierung und Nachverfolgung aller Projektrisiken.")}
            <span class="badge">Zentrale Datenbasis</span>
          </div>
          ${renderRiskRegisterProjectMetaBar(state)}
          <div class="kpi-grid risk-register-kpi-grid" id="risk-register-summary">
            <article class="kpi-card"><div class="kpi-label">Erwarteter Schaden</div><div class="kpi-value">${formatCurrency(result.totalExpectedDamage)}</div><div class="kpi-sub">Summe aller erwarteten Wirkungen</div></article>
            <article class="kpi-card gold"><div class="kpi-label">Aktive Risiken</div><div class="kpi-value">${result.activeCount}</div><div class="kpi-sub">offen, in Bewertung, in Bearbeitung oder Überwachung</div></article>
            <article class="kpi-card green"><div class="kpi-label">Kritische Risiken</div><div class="kpi-value">${result.criticalCount}</div><div class="kpi-sub">hohe Priorität für Steuerung</div></article>
            <article class="kpi-card blue time-critical"><div class="kpi-label">Überfällige Risiken</div><div class="kpi-value">${result.overdueCount}</div><div class="kpi-sub">Termin bereits überschritten</div></article>
          </div>
          <div class="risk-fold-actions">
            <button class="action-btn ${foldAllOpen ? "" : "primary"}" type="button" data-action="set-risk-register-folds" data-folds="closed">Alle Tafeln ausblenden</button>
            <button class="action-btn ${foldAllOpen ? "primary" : ""}" type="button" data-action="set-risk-register-folds" data-folds="open">Alle Tafeln einblenden</button>
            <button class="action-btn" type="button" data-action="restore-risk-register-panel-order">Standardreihenfolge wiederherstellen</button>
          </div>
          <div class="risk-register-panel-stack">
          <details class="info-card risk-register-card risk-fold-card card-neutral" data-risk-panel-key="overview" style="${panelOrderStyle("overview")}"${foldAllOpen || panelOpenStates.overview ? " open" : ""}>
            <summary class="risk-fold-summary">
              <div class="risk-fold-summary-main">
                <div class="risk-fold-summary-topline">
                  <button class="risk-fold-drag-handle" type="button" data-risk-panel-drag-handle aria-label="Registerlogik und operative Sicht verschieben" title="Tafel verschieben">
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
                    </svg>
                  </button>
                  <span class="risk-fold-toggle" aria-hidden="true"></span>
                  <div class="risk-fold-summary-title">
                    <strong>Registerlogik und operative Sicht</strong>
                    <span>${result.allRisks.length} Risiken im Register · ${result.visibleRiskCount} aktuell sichtbar · ${result.archivedCount} archiviert</span>
                  </div>
                </div>
              </div>
              <div class="risk-fold-summary-actions">
                <span class="badge">Überblick</span>
              </div>
            </summary>
            <div class="risk-register-overview-grid risk-register-overview-grid-3">
              <section class="info-card risk-register-card">
                <h3>Registerlogik</h3>
                <p class="form-note" style="margin-bottom:10px;">Das Risikoregister ist die zentrale Führungs- und Pflegeebene für sämtliche Projektrisiken. Es bündelt Risikobeschreibung, Verantwortlichkeit, Bewertung und Bearbeitungsstand in einer konsistenten, revisionsfähigen Struktur und schafft damit die Grundlage für eine verlässliche operative Steuerung.</p>
                <ul>
                  <li>ID, Status und Verantwortlichkeit sind dauerhaft eindeutig verknüpft.</li>
                  <li>Bewertung, Priorität und erwarteter Schaden sind unmittelbar erkennbar.</li>
                  <li>Maßnahmen, Kommentare und Fälligkeiten bilden den fachlichen Arbeitskontext.</li>
                  <li>Änderungen bleiben nachvollziehbar und unterstützen die Steuerung auf Managementebene.</li>
                </ul>
                <div class="risk-register-guidance-grid">
                  <div class="risk-register-guidance-item">
                    <strong>Lebenszyklus</strong>
                    <span>Neue Risiken werden offen gepflegt, können in Bearbeitung überführt, abgeschlossen, archiviert oder bei Bedarf reaktiviert werden.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Pflege</strong>
                    <span>Ein Risiko gilt fachlich als vollständig, wenn Bezeichnung, Verantwortlichkeit, Zieltermin, Bewertung und Maßnahme belegt sind.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Relevanz</strong>
                    <span>Aktive Risiken steuern das Tagesgeschäft; archivierte Risiken bleiben dokumentiert, aber aus der aktiven Liste herausgenommen.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Historie</strong>
                    <span>Jede Änderung bleibt im Registerkontext nachvollziehbar und unterstützt spätere Prüfungen oder Wiederaufnahmen.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Rollen</strong>
                    <span>Verantwortlichkeiten, Auftraggeber und Projektleitung werden getrennt geführt, damit jeder Eintrag klar zugeordnet bleibt.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Transparenz</strong>
                    <span>Die Registersicht dient als gemeinsame Datengrundlage für Steuerung, Berichte und spätere Rückfragen im Projektverlauf.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Datenpflege</strong>
                    <span>Einträge sollen knapp, eindeutig und vollständig bleiben, damit Verantwortliche, Termine und Bewertungen jederzeit belastbar sind.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Nachweis</strong>
                    <span>Bewertungen und Entscheidungen werden so dokumentiert, dass spätere Prüfungen oder Übergaben ohne Medienbruch nachvollzogen werden können.</span>
                  </div>
                </div>
              </section>
              <section class="info-card risk-register-card">
                <h3>Leitplanken</h3>
                <p class="form-note" style="margin-bottom:10px;">Die Leitplanken sorgen für eine einheitliche Bewertung und Priorisierung aller aktiven Risiken auf Basis eines konsistenten 25-Punkte-Modells.</p>
                <p class="form-note" style="margin-top:-2px; margin-bottom:10px;">Der Status zeigt den Bearbeitungsstand, die Priorität die fachliche Bewertung anhand des Risikowertes. Ein offenes Risiko kann daher weiterhin die Priorität Beobachten haben.</p>
                <div class="risk-register-stat-summary">
                  <div class="risk-register-stat-line"><span>Beobachten</span><strong>0 bis 8 / 25</strong></div>
                  <div class="risk-register-stat-line"><span>Erhöht</span><strong>9 bis 12 / 25</strong></div>
                  <div class="risk-register-stat-line"><span>Kritisch</span><strong>13 bis 25 / 25</strong></div>
                </div>
                <div class="risk-register-guidance-grid">
                  <div class="risk-register-guidance-item">
                    <strong>Bewertung</strong>
                    <span>Die Bewertung entsteht aus Eintrittswahrscheinlichkeit, Auswirkung und dem daraus abgeleiteten 25-Punkte-Modell.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Handlung</strong>
                    <span>Erhöhte und kritische Risiken werden aktiv gesteuert; kritische Risiken sind zusätzlich in der nächsten Runde zu prüfen.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Überfällig</strong>
                    <span>Überfällige Risiken haben den Zieltermin überschritten. Überfälligkeit ist ein separater Zeitstatus und kein Kritikalitätskriterium.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Archiv</strong>
                    <span>Archivierte Risiken sind nicht mehr aktiv und werden im Register nur bei Bedarf wieder eingeblendet.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Konsistenz</strong>
                    <span>Ein offenes Risiko kann fachlich weiterhin auf Beobachten stehen, wenn der Risikowert unterhalb der Kritisch-Schwelle liegt.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Überwachung</strong>
                    <span>Überfälligkeit verschärft die operative Betrachtung, ersetzt aber nicht die Score-basierte Einstufung der Priorität.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Eskalation</strong>
                    <span>Bei kritischen oder überfälligen Risiken wird die nächste Steuerungsrunde genutzt, um Maßnahmen, Termine und Verantwortliche zu schärfen.</span>
                  </div>
                  <div class="risk-register-guidance-item">
                    <strong>Einordnung</strong>
                    <span>Die operative Sicht ordnet das Risiko in einen handlungsfähigen Status ein und trennt dabei klar zwischen Bewertung und Bearbeitungsstand.</span>
                  </div>
                </div>
              </section>
              <section class="info-card risk-register-card risk-register-card-wide ${operationalToneClass}">
                <div class="risk-operational-head">
                  <h3>Operative Steuerung</h3>
                </div>
                <p class="form-note" style="margin-top:0;">Die operative Steuerung verdichtet den aktuellen Handlungsbedarf und zeigt die Risiken mit unmittelbarem Steuerungs- und Eskalationsbedarf.</p>
                <div class="risk-register-operational-layout">
                  <div class="risk-register-operational-metrics">
                    <div class="risk-register-stat-summary risk-register-stat-summary-strong">
                      <div class="risk-register-stat-line"><span>Kritisch</span><strong>${result.criticalCount}</strong></div>
                      <div class="risk-register-stat-line"><span>Überfällig</span><strong>${result.overdueCount}</strong></div>
                      <div class="risk-register-stat-line"><span>Archiviert</span><strong>${result.archivedCount}</strong></div>
                      <div class="risk-register-stat-line"><span>Geschlossen</span><strong>${result.closedCount}</strong></div>
                      <div class="risk-register-stat-line"><span>Erwarteter Schaden</span><strong>${formatCurrency(result.totalExpectedDamage)}</strong></div>
                    </div>
                  </div>
                  <div class="risk-register-operational-columns">
                    <div class="risk-register-operational-column">
                      <div class="risk-register-guidance-item">
                        <strong>Steuerung</strong>
                        <span>Kritische Risiken werden in der nächsten Runde priorisiert und mit den Verantwortlichen geklärt; überfällige Risiken werden zusätzlich über den Zeitbezug nachgeschärft.</span>
                      </div>
                      <div class="risk-register-guidance-item">
                        <strong>Status</strong>
                        <span>Archivierte und geschlossene Risiken bleiben dokumentiert, erscheinen aber nicht mehr in der aktiven Steuerung.</span>
                      </div>
                    </div>
                    <div class="risk-register-operational-column">
                      <div class="risk-register-guidance-item">
                        <strong>Qualität</strong>
                        <span>Verantwortliche, Zieltermin und Maßnahme sollten vor Eskalation und Berichterstattung vollständig belegt sein.</span>
                      </div>
                      <div class="risk-register-guidance-item">
                        <strong>Wirkung</strong>
                        <span>Der erwartete Schaden bündelt die finanzielle Relevanz des aktiven Bestands zum aktuellen Betrachtungszeitpunkt.</span>
                      </div>
                    </div>
                    <div class="risk-register-operational-column">
                      <div class="risk-register-guidance-item">
                        <strong>Vollständigkeit</strong>
                        <span>Risiken ohne Verantwortliche, Termin oder Maßnahme sollten vor der nächsten Steuerungsrunde vervollständigt werden.</span>
                      </div>
                      <div class="risk-register-guidance-item">
                        <strong>Aktivität</strong>
                        <span>Nur aktive Risiken erscheinen in der operativen Steuerung; archivierte Risiken werden separat geführt.</span>
                      </div>
                    </div>
                    <div class="risk-register-operational-column">
                      <div class="risk-register-guidance-item">
                        <strong>Priorisierung</strong>
                        <span>Die Reihenfolge der Abarbeitung folgt zuerst der Bewertung, danach dem Zieltermin und der fachlichen Eskalation.</span>
                      </div>
                      <div class="risk-register-guidance-item">
                        <strong>Relevanz</strong>
                        <span>Ein konsistenter Registerstand erleichtert Berichte, Reaktivierungen und spätere Nachverfolgung erheblich.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </details>
          <details class="info-card risk-register-card risk-fold-card risk-fold-edit card-neutral" data-risk-panel-key="edit" style="${panelOrderStyle("edit")}"${foldAllOpen || panelOpenStates.edit ? " open" : ""}>
            <summary class="risk-fold-summary">
              <div class="risk-fold-summary-main">
                <div class="risk-fold-summary-topline">
                  <button class="risk-fold-drag-handle" type="button" data-risk-panel-drag-handle aria-label="Risiken erfassen und bearbeiten verschieben" title="Tafel verschieben">
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
                    </svg>
                  </button>
                  <span class="risk-fold-toggle" aria-hidden="true"></span>
                  <div class="risk-fold-summary-title">
                    <strong>Risiken erfassen und bearbeiten</strong>
                    <span>Einträge pflegen · Werte, Status, Maßnahmen und Archivierung ändern</span>
                  </div>
                </div>
              </div>
              <div class="risk-fold-summary-actions">
                <span class="badge">Bearbeiten</span>
              </div>
            </summary>
            <div class="risk-fold-body">
              <div class="risk-register-history-actions risk-register-history-actions-add" style="margin-bottom:2px;">
                <button class="action-btn risk-add-btn" type="button" data-action="add-risk-register-item"><span class="risk-add-icon" aria-hidden="true">+</span><span>Neues Risiko hinzufügen</span></button>
                <button class="action-btn" type="button" data-action="start-risk-register-ai-create">Risiko mit KI ausarbeiten</button>
              </div>
              <div class="risk-register-history-actions risk-register-history-actions-compact" style="margin-bottom:2px;">
                <button class="action-btn" type="button" data-action="undo-risk-register-change" ${riskUndoCount > 0 ? "" : "disabled"}><span class="risk-history-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M10 6 4 12l6 6" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12H4" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/></svg></span><span>Letzten Schritt rückgängig</span></button>
                <button class="action-btn" type="button" data-action="redo-risk-register-change" ${riskRedoCount > 0 ? "" : "disabled"}><span class="risk-history-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M14 6 20 12l-6 6" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12H20" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/></svg></span><span>Letzten Schritt wiederherstellen</span></button>
              </div>
              ${result.archivedCount > 0 ? `
              <section class="risk-archive-overview">
                <div class="risk-archive-overview-head">
                  <div>
                    <h4>Archivierte Risiken</h4>
                    <p>${result.archivedCount} Risiken sind archiviert und werden im aktiven Register ausgeblendet.</p>
                  </div>
                  <button class="action-btn" type="button" data-action="toggle-archived-risk-register">${riskView.showArchived === true ? "Archivierte ausblenden" : "Archivierte anzeigen"}</button>
                </div>
                ${riskView.showArchived === true ? `
                <div class="risk-archive-list">
                  ${result.archivedRisks.slice(0, 6).map((risk) => `
                    <article class="risk-archive-item">
                      <div class="risk-archive-item-main">
                        <strong>${escapeHtml(risk.id)} · ${escapeHtml(risk.title)}</strong>
                        <span>${escapeHtml(risk.archivedReason || "Nicht mehr eintretbar durch Baufortschritt")}</span>
                        <span>Archiviert am ${risk.archivedAt ? formatDate(risk.archivedAt) : "—"} · ehemals ${escapeHtml(classifyStatusTone(risk.archivedFromStatus || "offen").label)}</span>
                      </div>
                      <div class="risk-archive-item-actions">
                        <button class="action-btn primary" type="button" data-action="archive-risk-register-item" data-index="${risk.sourceIndex}">Risiko reaktivieren</button>
                      </div>
                    </article>
                  `).join("")}
                </div>
                ` : `<p class="form-note" style="margin:0;">Archivierte Risiken sind ausgeblendet. Über den Button können sie wieder eingeblendet werden.</p>`}
              </section>
              ` : ""}
              <div class="risk-edit-sort-actions">
                <button class="action-btn ${editSortBy === "newest" ? "primary" : ""}" type="button" data-action="set-risk-register-edit-sort" data-sort-by="newest">Neueste Risiken zuerst</button>
                <button class="action-btn ${editSortBy === "id" ? "primary" : ""}" type="button" data-action="set-risk-register-edit-sort" data-sort-by="id">Nach Risiko-ID aufsteigend sortieren</button>
              </div>
              <div class="risk-edit-list">
              ${result.editRisks.map((risk, index) => {
                const riskIndex = Number.isInteger(risk.sourceIndex) ? risk.sourceIndex : index;
                return `
                <details class="risk-edit-card risk-tone-${classifyRiskTone(risk).key} risk-fold-card risk-edit-fold"${foldAllOpen || panelOpenStates.edit ? " open" : ""}>
                  <summary class="risk-edit-summary">
                    <div class="risk-edit-summary-main">
                      <span class="risk-fold-toggle" aria-hidden="true"></span>
                      <div class="risk-edit-summary-text">
                        <span class="risk-edit-id">${risk.id}</span>
                        <strong>${risk.title}</strong>
                        <span class="risk-edit-summary-value">${risk.qualitativeRiskValue} / 25 · ${formatCurrency(risk.expectedDamage)}</span>
                      </div>
                    </div>
                    <div class="risk-edit-summary-actions">
                      <span class="risk-tone-pill risk-tone-${classifyRiskTone(risk).key}">${classifyRiskTone(risk).label}</span>
                      <button class="danger-icon-btn" type="button" aria-label="Risiko entfernen" data-action="remove-risk-register-item" data-index="${riskIndex}">×</button>
                    </div>
                  </summary>
                  <div class="risk-edit-grid">
                    <div class="form-field">
                      <label for="risk_id_${riskIndex}">Risiko-ID</label>
                      <input id="risk_id_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="id" type="text" value="${risk.id}">
                    </div>
                    <div class="form-field half">
                      <label for="risk_title_${riskIndex}">Risikobezeichnung</label>
                      <input id="risk_title_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="title" type="text" value="${risk.title}">
                    </div>
                    <div class="form-field">
                      <label for="risk_phase_${riskIndex}">Projektphase / Zuordnung</label>
                      <select id="risk_phase_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="phase">
                        ${buildRiskPhaseOptions(risk.phase).map((phase) => `
                          <option value="${escapeHtml(phase)}" ${String(risk.phase || "").trim().toLowerCase() === String(phase).trim().toLowerCase() ? "selected" : ""}>${escapeHtml(phase)}</option>
                        `).join("")}
                      </select>
                    </div>
                    <div class="form-field wide">
                      <label for="risk_description_${riskIndex}">Risikobeschreibung</label>
                      <textarea class="risk-description-textarea" id="risk_description_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="description" rows="2">${risk.description}</textarea>
                    </div>
                    <div class="form-field">
                      <label for="risk_category_${riskIndex}">Kategorie</label>
                      <select id="risk_category_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="category">
                        ${buildRiskCategoryOptions(risk.category).map((category) => `
                          <option value="${escapeHtml(category)}" ${String(risk.category || "").trim().toLowerCase() === String(category).trim().toLowerCase() ? "selected" : ""}>${escapeHtml(category)}</option>
                        `).join("")}
                      </select>
                    </div>
                    <div class="form-field">
                      <label for="risk_owner_${riskIndex}">Verantwortlich</label>
                      <input id="risk_owner_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="owner" type="text" list="risk_owner_options_${riskIndex}" value="${risk.owner}">
                      <datalist id="risk_owner_options_${riskIndex}">
                        ${result.ownerOptions.map((owner) => `
                          <option value="${escapeHtml(owner)}"></option>
                        `).join("")}
                      </datalist>
                    </div>
                    <div class="form-field">
                      <label for="risk_status_${riskIndex}">Status</label>
                      <select id="risk_status_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="status">
                        ${statusOptions.map((status) => `
                          <option value="${status.value}" ${normalizeRiskStatusValue(risk.status) === status.value ? "selected" : ""}>${status.label}</option>
                        `).join("")}
                      </select>
                    </div>
                    <div class="form-note" style="grid-column:1 / -1; margin:-4px 0 2px;">
                      Status beschreibt den Bearbeitungsstand. Priorität beschreibt die fachliche Dringlichkeit. Ein Risiko kann offen und trotzdem nur zu beobachten sein.
                    </div>
                    <div class="form-field">
                      <label for="risk_due_${riskIndex}">Fällig am</label>
                      <input id="risk_due_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="dueDate" type="date" value="${risk.dueDate}">
                    </div>
                    <div class="risk-input-grid wide">
                      <div class="form-field">
                        <label for="risk_financial_${riskIndex}">Schaden in Euro</label>
                        <div class="eva-stepper-field risk-stepper-field">
                          <input class="compact-input currency-input" id="risk_financial_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="financialImpact" type="text" inputmode="numeric" value="${formatCurrencyInput(risk.financialImpact)}">
                          <div class="eva-stepper-buttons">
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="financialImpact" data-step="1000" data-direction="up" data-index="${riskIndex}" aria-label="Schaden erhöhen">▲</button>
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="financialImpact" data-step="1000" data-direction="down" data-index="${riskIndex}" aria-label="Schaden verringern">▼</button>
                          </div>
                        </div>
                      </div>
                      <div class="form-field">
                        <label for="risk_probability_${riskIndex}">EINTRITTSWAHRSCHEINLICHKEIT IN %</label>
                        <div class="eva-stepper-field risk-stepper-field">
                          <input class="compact-input integer-input" id="risk_probability_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="probabilityPercent" type="text" inputmode="numeric" value="${formatIntegerInput(risk.probabilityPercent, "%")}">
                          <div class="eva-stepper-buttons">
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="probabilityPercent" data-step="1" data-direction="up" data-index="${riskIndex}" aria-label="Eintrittswahrscheinlichkeit erhöhen">▲</button>
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="probabilityPercent" data-step="1" data-direction="down" data-index="${riskIndex}" aria-label="Eintrittswahrscheinlichkeit verringern">▼</button>
                          </div>
                        </div>
                      </div>
                      <div class="form-field">
                        <label>Erwarteter Schaden</label>
                        <div class="risk-value-box risk-value-large">${formatCurrency(risk.expectedDamage)}</div>
                      </div>
                      <div class="risk-grid-spacer" aria-hidden="true"></div>
                    </div>
                    <div class="risk-output-grid wide">
                      <div class="form-field">
                        <label for="risk_likelihood_${riskIndex}">Eintrittswahrscheinlichkeit (1-5)</label>
                        <div class="risk-value-box risk-value-large">${deriveRiskLikelihoodFromPercent(risk.probabilityPercent, risk.likelihood)}</div>
                      </div>
                      <div class="form-field">
                        <label for="risk_impact_${riskIndex}">Auswirkung (1-5)</label>
                        <div class="eva-stepper-field risk-stepper-field">
                          <input class="compact-input integer-input" id="risk_impact_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="impact" type="text" inputmode="numeric" value="${formatIntegerInput(risk.impact)}">
                          <div class="eva-stepper-buttons">
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="impact" data-step="1" data-direction="up" data-index="${riskIndex}" aria-label="Auswirkung erhöhen">▲</button>
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="impact" data-step="1" data-direction="down" data-index="${riskIndex}" aria-label="Auswirkung verringern">▼</button>
                          </div>
                        </div>
                      </div>
                      <div class="form-field">
                        <label>Risikowert 5×5</label>
                        <div class="risk-value-box risk-value-large">${risk.qualitativeRiskValue} / 25</div>
                      </div>
                      <div class="risk-grid-spacer" aria-hidden="true"></div>
                    </div>
                    <div class="form-field wide">
                      <label for="risk_measures_${riskIndex}">Maßnahmenplanung</label>
                      <textarea id="risk_measures_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="measures">${risk.measures}</textarea>
                    </div>
                    <div class="risk-residual-stack">
                      <div class="form-field">
                        <label for="risk_residual_${riskIndex}">Rest-Risiko</label>
                        <textarea id="risk_residual_${riskIndex}" data-risk-index="${riskIndex}" data-risk-field="residualRisk" rows="3">${risk.residualRisk}</textarea>
                      </div>
                    </div>
                    <div class="risk-card-actions" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:10px;margin:10px 0 12px;width:100%;grid-column:1 / -1;align-items:stretch;">
                      <button class="action-btn primary" type="button" data-action="save-risk-register-item" data-index="${riskIndex}" style="width:100%;min-width:0;height:100%;min-height:46px;display:flex;justify-content:center;align-items:center;text-align:center;box-sizing:border-box;white-space:nowrap;">Risiko speichern</button>
                      <button class="action-btn" type="button" data-action="archive-risk-register-item" data-index="${riskIndex}" style="width:100%;min-width:0;height:100%;min-height:46px;display:flex;justify-content:center;align-items:center;text-align:center;box-sizing:border-box;white-space:nowrap;">${normalizeRiskStatusValue(risk.status) === "archiviert" ? "Risiko aktivieren" : "Risiko archivieren"}</button>
                      <button class="action-btn danger" type="button" data-action="remove-risk-register-item" data-index="${riskIndex}" style="width:100%;min-width:0;height:100%;min-height:46px;display:flex;justify-content:center;align-items:center;text-align:center;box-sizing:border-box;white-space:nowrap;">Risiko löschen</button>
                    </div>
                  </div>
                </details>
              `; }).join("")}
              </div>
            </div>
          </details>
          <details class="info-card risk-register-card risk-fold-card risk-fold-table card-neutral" data-risk-panel-key="table" style="${panelOrderStyle("table")}"${foldAllOpen || panelOpenStates.table ? " open" : ""}>
            <summary class="risk-fold-summary">
              <div class="risk-fold-summary-main">
                <div class="risk-fold-summary-topline">
                  <button class="risk-fold-drag-handle" type="button" data-risk-panel-drag-handle aria-label="Alle Risiken verschieben" title="Tafel verschieben">
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
                    </svg>
                  </button>
                  <span class="risk-fold-toggle" aria-hidden="true"></span>
                  <div class="risk-fold-summary-title">
                    <strong>Alle Risiken</strong>
                    <span>Sortierte Liste · zuerst überfällige Risiken, dann 5x5-Wert und erwarteter Schaden</span>
                  </div>
                </div>
              </div>
              <div class="risk-fold-summary-actions">
                <span class="badge">Sortierte Liste</span>
              </div>
            </summary>
            <div class="risk-fold-body">
              <div class="risk-register-toolbar">
                <div class="risk-register-toolbar-grid">
                  <div class="form-field">
                    <label for="risk_view_search">Suche</label>
                    <input id="risk_view_search" data-risk-ui-field="search" type="text" value="${riskView.search || ""}" placeholder="Risiko, Owner, Beschreibung">
                  </div>
                  <div class="form-field">
                    <label for="risk_view_sort">Sortierung</label>
                    <div class="risk-select-shell">
                      <select id="risk_view_sort" data-risk-ui-field="sortBy">
                        <option value="priority" ${sortBy === "priority" ? "selected" : ""}>Priorität</option>
                        <option value="value" ${sortBy === "value" ? "selected" : ""}>Risikowert</option>
                        <option value="id" ${sortBy === "id" ? "selected" : ""}>Risiko-ID</option>
                        <option value="category" ${sortBy === "category" ? "selected" : ""}>Kategorie</option>
                        <option value="dueDate" ${sortBy === "dueDate" ? "selected" : ""}>Ziel-Termin</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-field">
                    <label for="risk_view_category">Kategorie</label>
                    <div class="risk-select-shell">
                      <select id="risk_view_category" data-risk-ui-field="category">
                        <option value="alle" ${String(riskView.category || "alle").toLowerCase() === "alle" ? "selected" : ""}>Alle</option>
                        ${result.categoryOptions.map((category) => `
                          <option value="${category}" ${String(riskView.category || "").toLowerCase() === category.toLowerCase() ? "selected" : ""}>${category}</option>
                        `).join("")}
                      </select>
                    </div>
                  </div>
                  <div class="form-field">
                    <label for="risk_view_status">Status</label>
                    <div class="risk-select-shell">
                      <select id="risk_view_status" data-risk-ui-field="status">
                        ${statusFilterOptions.map((status) => `
                          <option value="${status.value}" ${String(riskView.status || "alle").toLowerCase() === status.value ? "selected" : ""}>${status.label}</option>
                        `).join("")}
                      </select>
                    </div>
                  </div>
                  <div class="form-field">
                    <label for="risk_view_show_archived">Archiv</label>
                    <button class="risk-register-archive-toggle" type="button" data-action="toggle-archived-risk-register">${riskView.showArchived === true ? "Archivierte ausblenden" : "Archivierte anzeigen"}</button>
                  </div>
                  <div class="form-field">
                    <label for="risk_view_due_from">Ziel-Termin von</label>
                    <input id="risk_view_due_from" data-risk-ui-field="dueFrom" type="date" value="${riskView.dueFrom || ""}">
                  </div>
                  <div class="form-field">
                    <label for="risk_view_due_to">Ziel-Termin bis</label>
                    <input id="risk_view_due_to" data-risk-ui-field="dueTo" type="date" value="${riskView.dueTo || ""}">
                  </div>
                  <button class="action-btn risk-register-toolbar-reset" type="button" data-action="reset-risk-register-filters">Filter zurücksetzen</button>
                </div>
              </div>
              
              <p class="risk-column-note">Die Spalten der Tabelle lassen sich per Klick ein- oder ausblenden. Ausgeblendete Spalten werden rot markiert und durchgestrichen.</p>
              <div class="risk-column-strip">
                <button class="risk-column-pill risk-column-pill-all" type="button" data-action="show-all-risk-register-columns">
                  Alle Spalten einblenden
                </button>
                ${columnDefs.map((column) => `
                  <button class="risk-column-pill ${visibleColumns.includes(column.key) ? "active" : ""}" type="button" data-action="toggle-risk-register-column" data-column="${column.key}">
                    ${column.key === "phase" ? "Projektphase" : column.label}
                  </button>
                `).join("")}
              </div>
              <div class="table-wrap risk-register-table-wrap">
                <table class="data-table risk-register-table" style="width:${riskTableWidth}px; min-width:${riskTableWidth}px; table-layout:fixed;">
                  <colgroup>
                    ${tableColumns.map((column) => `<col style="width:${tableColumnWidths[column.key] || 132}px;">`).join("")}
                  </colgroup>
                  <thead>
                    <tr>
                      ${tableColumns.map((column) => `<th>${column.label}</th>`).join("")}
                    </tr>
                  </thead>
                  <tbody>
                    ${sortedRisks.map((risk) => {
                      const riskTone = classifyRiskTone(risk);
                      return `
                        <tr>
                          ${tableColumns.map((column) => {
                            if (column.key === "id") {
                              return `<td><strong>${risk.id}</strong></td>`;
                            }
                            if (column.key === "title") {
                              return `
                                <td>
                                  <strong>${risk.title}</strong><br>
                                  <span class="risk-register-muted">${String(risk.measures || risk.description || "").trim() ? (String(risk.measures || risk.description || "").trim().length > 110 ? `${String(risk.measures || risk.description || "").trim().slice(0, 107)}...` : String(risk.measures || risk.description || "").trim()) : "Keine Maßnahmen gepflegt"}</span>
                                </td>
                              `;
                            }
                            const value = column.render(risk);
                            if (column.key === "priority") {
                              return `<td class="risk-priority-cell risk-priority-cell-${riskTone.key}"><span class="risk-tone-pill risk-tone-${riskTone.key}">${value}</span></td>`;
                            }
                            if (column.key === "status") {
                              const statusTone = classifyStatusTone(risk.status);
                              return `<td><span class="risk-status-pill risk-status-${statusTone.key}">${statusTone.label}</span></td>`;
                            }
                            return `<td class="${column.numeric ? "numeric-output" : ""}">${value}</td>`;
                          }).join("")}
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                  <tfoot>
                    <tr class="risk-register-total-row">
                      ${tableColumns.map((column) => {
                        if (column.key === "id") {
                          return `<td class="risk-register-total-label"><strong>Summe Risikowerte</strong></td>`;
                        }
                        if (column.key === "value") {
                          return `<td class="risk-register-total-value"><span class="risk-register-total-value-inner">${formatCurrency(filteredRiskValueTotal)}</span></td>`;
                        }
                        return `<td class="risk-register-total-spacer"></td>`;
                      }).join("")}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </details>
          <details class="info-card risk-fold-card ai-workshop-card card-info" data-risk-panel-key="ai" style="${panelOrderStyle("ai")}"${foldAllOpen || panelOpenStates.ai ? " open" : ""}>
            <summary class="risk-fold-summary">
              <div class="risk-fold-summary-main">
                <div class="risk-fold-summary-topline">
                  <button class="risk-fold-drag-handle" type="button" data-risk-panel-drag-handle aria-label="KI für Risiken und Maßnahmen verschieben" title="Tafel verschieben">
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
                    </svg>
                  </button>
                  <span class="risk-fold-toggle" aria-hidden="true"></span>
                  <div class="risk-fold-summary-title">
                    <strong>KI für Risiken und Maßnahmen</strong>
                    <span>Freitext auswerten · Risiken strukturieren · Maßnahmen ableiten</span>
                  </div>
                </div>
              </div>
              <div class="risk-fold-summary-actions">
                <span class="badge">KI-Startstufe</span>
              </div>
            </summary>
            <div class="risk-fold-body">
            ${(() => {
              const aiWorkshopDrafts = globalThis.__riskRegisterUiDrafts || {};
              const aiWorkshopFreeText = aiWorkshopDrafts.aiWorkshopFreeTextDirty
                ? String(aiWorkshopDrafts.aiWorkshopFreeText || "")
                : String(state.ui?.aiWorkshop?.freeText || "");
              const aiWorkshopTask = String(state.ui?.aiWorkshop?.activeTask || "");
              const isQuestionTask = aiWorkshopTask.startsWith("question-");
              const questionChips = [
                { task: "question-critical-risks", label: "Kritische Risiken", title: "Welche Risiken sind aktuell am kritischsten?" },
                { task: "question-phase-measures", label: "Phasen-Maßnahmen", title: "Welche Maßnahmen passen zur aktuellen Phase?" },
                { task: "question-register-additions", label: "Register ergänzen", title: "Was sollte ins Risikoregister ergänzt werden?" },
                { task: "question-missing-project-data", label: "Fehlende Angaben", title: "Welche Angaben fehlen noch im Bauprojekt?" },
                { task: "question-project-summary", label: "Projekt kurz", title: "Fasse das Bauprojekt kurz zusammen." },
                { task: "question-next-checks", label: "Nächste Prüfung", title: "Welche Punkte sollte ich als Nächstes prüfen?" }
              ];
              return `
            <p class="form-note">${state.ui?.aiWorkshop?.activeTask === "measures-residual"
              ? "Hier ergänzt du ein bestehendes Risiko um fachliche Maßnahmen und ein qualifiziertes Restrisiko."
              : isQuestionTask
                ? "Die Schnellfragen liefern direkt eine Antwort auf Basis der aktuellen Projekt- und Risikodaten."
                : "Hier wird Freitext direkt in ein neues Risiko für das Risikoregister übersetzt."}</p>
            <p class="form-note" style="margin-bottom:6px;">Schnellfragen: Ein Klick genügt, die Antwort erscheint direkt im Ergebnisfeld.</p>
            <div class="ai-chat-prompts three-cols" style="margin-bottom:12px;">
              ${questionChips.map((chip) => `
                <button class="action-btn ai-chat-chip ${aiWorkshopTask === chip.task ? "active" : ""}" type="button" data-action="run-ai-workshop" data-ai-workshop-task="${escapeHtml(chip.task)}" title="${escapeHtml(chip.title)}" aria-label="${escapeHtml(chip.title)}">${escapeHtml(chip.label)}</button>
              `).join("")}
            </div>
            <div class="report-export-grid" style="align-items:start;">
            <div class="form-field wide">
                <label for="aiWorkshopFreeText">${isQuestionTask ? "Freitext für Schnellfragen" : state.ui?.aiWorkshop?.activeTask === "measures-residual" ? "Freitext für Maßnahmenanalyse" : "Freitext für Risikoanalyse"}</label>
                <textarea id="aiWorkshopFreeText" data-ai-workshop-field="freeText" placeholder="${state.ui?.aiWorkshop?.activeTask === "measures-residual"
                  ? "Beschreibe das bestehende Risiko, die Maßnahme und das gewünschte Restrisiko klar und präzise."
                  : isQuestionTask
                    ? "Für Schnellfragen ist kein Freitext erforderlich."
                    : "Beschreibe das Risiko, seinen Auslöser und die erwartete Auswirkung klar und präzise."}">${escapeHtml(aiWorkshopFreeText)}</textarea>
              </div>
            </div>
            <div class="ai-workshop-grid">
              <button class="action-btn ${state.ui?.aiWorkshop?.activeTask === "free-text-risks" ? "active" : ""}" type="button" data-action="run-ai-workshop" data-ai-workshop-task="free-text-risks">Neues Risiko aus Freitext erzeugen</button>
              <button class="action-btn ${state.ui?.aiWorkshop?.activeTask === "measures-residual" ? "active" : ""}" type="button" data-action="run-ai-workshop" data-ai-workshop-task="measures-residual">Nur Maßnahmenvorschläge und Restrisiko erzeugen</button>
            </div>
            <p class="form-note">${isQuestionTask
              ? "Die Schnellfrage wird direkt beantwortet und verändert das Risikoregister nicht."
              : state.ui?.aiWorkshop?.activeTask === "measures-residual"
              ? "Der Maßnahmen-Flow ergänzt ein bestehendes Risiko. Ein neues Risiko wird hier nicht angelegt."
              : "Der Risiko-Flow erzeugt genau ein neues Risiko für das Risikoregister."}</p>
            <div class="code-box ai-workshop-output ${state.ui?.aiWorkshop?.busy ? "is-loading" : ""} ${state.ui?.aiWorkshop?.resultTone === "success" ? "tone-success" : state.ui?.aiWorkshop?.resultTone === "danger" ? "tone-danger" : "tone-neutral"}">
              <strong>${escapeHtml((state.ui?.aiWorkshop?.activeTask === "free-text-risks" || state.ui?.aiWorkshop?.activeTask === "measures-residual" || String(state.ui?.aiWorkshop?.activeTask || "").startsWith("question-")) ? (state.ui?.aiWorkshop?.resultTitle || "KI bereit") : "KI bereit")}</strong>
              ${(() => {
                const resultData = state.ui?.aiWorkshop?.resultData;
                const activeTask = state.ui?.aiWorkshop?.activeTask;
                const isRiskSuggestionTask = activeTask === "free-text-risks";
                const isMeasuresTask = activeTask === "measures-residual";
                const isQuestionTask = String(activeTask || "").startsWith("question-");
                if (isRiskSuggestionTask && resultData?.resultType === "risk-suggestion" && Array.isArray(resultData.items) && resultData.items.length) {
                  return `
                    <div class="ai-workshop-result-list">
                      ${resultData.items.map((item, index) => `
                        <article class="ai-workshop-result-card">
                          <div class="ai-workshop-result-card-head">
                            <strong>${escapeHtml(item.title || `Vorschlag ${index + 1}`)}</strong>
                            <span class="badge">Risikovorschlag</span>
                          </div>
                          <div class="ai-workshop-result-card-grid">
                            <div class="ai-workshop-result-card-column">
                              <div><span>Kategorie</span><strong>${escapeHtml(item.category || "—")}</strong></div>
                              <div><span>Phase</span><strong>${escapeHtml(item.phase || "—")}</strong></div>
                              <div><span>Verantwortlich</span><strong>${escapeHtml(item.owner || "—")}</strong></div>
                              <div><span>Eintrittswahrscheinlichkeit (1-5)</span><strong>${escapeHtml(String(deriveRiskLikelihoodFromPercent(item.probabilityPercent, item.likelihood) ?? "—"))}</strong></div>
                            </div>
                            <div class="ai-workshop-result-card-column">
                              <div><span>Schaden in Euro</span><strong>${formatCurrency(Number(item.financialImpact) || 0)}</strong></div>
                              <div><span>Eintrittswahrscheinlichkeit in %</span><strong>${escapeHtml(String(item.probabilityPercent ?? "—"))}%</strong></div>
                              <div><span>Erwarteter Schaden</span><strong>${formatCurrency((Number(item.financialImpact) || 0) * (Math.max(0, Math.min(100, Number(item.probabilityPercent) || 0)) / 100))}</strong></div>
                              <div><span>Auswirkung</span><strong>${escapeHtml(String(item.impact ?? "—"))}</strong></div>
                            </div>
                          </div>
                          <div class="ai-workshop-result-description">
                            <span>Beschreibung</span>
                            <p>${escapeHtml(item.description || "—")}</p>
                          </div>
                          <div class="ai-workshop-result-foot">
                            <div class="ai-workshop-result-foot-head">Maßnahmen und Rest-Risiko</div>
                            <div class="ai-workshop-result-foot-grid">
                              <div class="ai-workshop-result-foot-item">
                                <span>Maßnahmen</span>
                                <p>${escapeHtml(item.measures || "—")}</p>
                              </div>
                              <div class="ai-workshop-result-foot-item">
                                <span>Qualitatives Rest-Risiko</span>
                                <p>${escapeHtml(item.residualRisk || "—")}</p>
                              </div>
                            </div>
                          </div>
                        </article>
                      `).join("")}
                    </div>
                  `;
                }
                if (isMeasuresTask && resultData?.resultType === "risk-measures" && Array.isArray(resultData.items) && resultData.items.length) {
                  return `
                    <div class="ai-workshop-result-list">
                      ${resultData.items.map((item, index) => `
                        <article class="ai-workshop-result-card">
                          <div class="ai-workshop-result-card-head">
                            <strong>${escapeHtml(item.riskId || `Ziel ${index + 1}`)}</strong>
                            <span class="badge">Maßnahmenentwurf</span>
                          </div>
                          <div class="ai-workshop-result-card-grid">
                            <div><span>Verantwortlich</span><strong>${escapeHtml(item.owner || "—")}</strong></div>
                            <div><span>Fällig am</span><strong>${escapeHtml(item.dueDate || "—")}</strong></div>
                          </div>
                          <div class="ai-workshop-result-foot">
                            <div class="ai-workshop-result-foot-head">Maßnahmen und Rest-Risiko</div>
                            <div class="ai-workshop-result-foot-grid">
                              <div class="ai-workshop-result-foot-item">
                                <span>Maßnahmen</span>
                                <p>${escapeHtml(item.measures || "—")}</p>
                              </div>
                              <div class="ai-workshop-result-foot-item">
                                <span>Qualitatives Rest-Risiko</span>
                                <p>${escapeHtml(item.residualRisk || "—")}</p>
                              </div>
                            </div>
                          </div>
                        </article>
                      `).join("")}
                    </div>
                  `;
                }
                return `<div style="margin-top:8px; white-space:pre-wrap;">${escapeHtml(isRiskSuggestionTask || isMeasuresTask || isQuestionTask ? (state.ui?.aiWorkshop?.resultText || (isQuestionTask ? "Wähle eine Schnellfrage für die KI-Ausgabe." : "Wähle eine Funktion für die KI-Startstufe.")) : "Diese Kachel zeigt nur Risikoausgaben, keine Berichte.")}</div>`;
              })()}
            </div>
            ${isQuestionTask ? `
            <p class="form-note" style="margin-top:12px;">Die Antwort wird automatisch angezeigt. Diese Schnellfragen verändern das Risikoregister nicht.</p>
            ` : state.ui?.aiWorkshop?.activeTask === "measures-residual" ? `
            <div class="form-field" style="margin-top:12px;">
              <label for="aiWorkshopSelectedRisk">Zielrisiko</label>
              <select id="aiWorkshopSelectedRisk" data-ai-workshop-field="selectedRiskId">
                <option value="">Bitte ein bestehendes Risiko wählen</option>
                ${result.risks.map((risk) => `
                  <option value="${escapeHtml(risk.id)}" ${String(state.ui?.aiWorkshop?.selectedRiskId || "") === String(risk.id) ? "selected" : ""}>${escapeHtml(risk.id)} · ${escapeHtml(risk.title)}</option>
                `).join("")}
              </select>
            </div>
            ` : `
            <p class="form-note" style="margin-top:12px;">Freitext wird hier in genau ein neues Risiko übersetzt.</p>
            `}
            <div class="ai-workshop-result-actions" style="margin-top:12px;">
              ${isQuestionTask ? "" : `<button class="action-btn primary" type="button" data-action="apply-ai-workshop-result" ${state.ui?.aiWorkshop?.activeTask === "measures-residual" && !String(state.ui?.aiWorkshop?.selectedRiskId || "").trim() ? "disabled" : ""}>Vorschlag übernehmen</button>`}
              <button class="action-btn" type="button" data-action="clear-ai-workshop-result">${isQuestionTask ? "Antwort verwerfen" : "Vorschlag verwerfen"}</button>
            </div>
            <p class="form-note" style="margin-top:8px;">${isQuestionTask ? "Die Schnellfrage dient als direkte Fachauskunft und verändert keine Registerdaten." : "Bitte den Vorschlag nach der Übernahme fachlich prüfen und bei Bedarf im Risikoregister nachschärfen."}</p>
            `;
            })()}
            </div>
          </details>
          <details class="info-card risk-register-card risk-fold-card risk-fold-chart risk-fold-static card-neutral" data-risk-panel-key="chart" style="${panelOrderStyle("chart")}"${foldAllOpen || panelOpenStates.chart ? " open" : ""}>
            <summary class="risk-fold-summary">
              <div class="risk-fold-summary-main">
                <div class="risk-fold-summary-topline">
                  <button class="risk-fold-drag-handle" type="button" data-risk-panel-drag-handle aria-label="Top-Risiken verschieben" title="Tafel verschieben">
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
                    </svg>
                  </button>
                  <span class="risk-fold-toggle" aria-hidden="true"></span>
                  <div class="risk-fold-summary-title">
                    <strong>Top-Risiken nach Risikowert und Priorität</strong>
                    <span>Aktuelle Sicht · Balken nach Priorität oder Risikowert</span>
                  </div>
                </div>
              </div>
              <div class="risk-fold-summary-actions">
                <span class="badge">Top-Risiken</span>
              </div>
            </summary>
            <div class="risk-fold-body">
              <div class="risk-chart-toolbar">
                <div class="risk-chart-toggle">
                  <button class="risk-chart-chip ${sortBy === "value" ? "" : "active"}" type="button" data-action="set-risk-register-chart-sort" data-sort-by="priority">Priorität</button>
                  <button class="risk-chart-chip ${sortBy === "value" ? "active" : ""}" type="button" data-action="set-risk-register-chart-sort" data-sort-by="value">Risikowert</button>
                </div>
                <div class="risk-chart-toggle">
                  ${[[5, "Top 5"], [10, "Top 10"], [20, "Top 20"], [0, "Alle"]].map(([limit, label]) => `
                    <button class="risk-chart-chip ${topLimit === limit ? "active" : ""}" type="button" data-action="set-risk-register-chart-limit" data-limit="${limit}">${label}</button>
                  `).join("")}
                </div>
              </div>
              <div class="risk-chart-state-note">Aktuell: ${sortBy === "value" ? "Risikowert" : "Priorität"} · ${topLimit === 0 ? "Alle Risiken" : `Top ${topLimit}`} · ${topRisks.length} Risiko${topRisks.length === 1 ? "" : "e"} sichtbar</div>
              <div class="risk-chart-list">
                ${topRisks.length ? topRisks.map((risk) => {
                  const riskTone = classifyRiskTone(risk);
                  const metric = sortBy === "value" ? risk.expectedDamage : risk.qualitativeRiskValue;
                  const width = Math.max(12, Math.round((metric / topMetricMax) * 100));
                  const metricLabel = sortBy === "value" ? formatCurrency(risk.expectedDamage) : `${risk.qualitativeRiskValue} von 25`;
                  return `
                    <div class="risk-chart-row risk-tone-${riskTone.key}">
                      <div class="risk-chart-identity">
                        <div class="risk-chart-title">${risk.id}</div>
                        <div class="risk-chart-subtitle">${risk.title}</div>
                        <div class="risk-chart-subtitle">${risk.category || "—"} · ${risk.phase || "—"}</div>
                      </div>
                      <div class="risk-chart-bar">
                        <div class="risk-chart-track">
                          <div class="risk-chart-fill risk-tone-${riskTone.key}" style="width:${width}%"></div>
                        </div>
                      </div>
                      <div class="risk-chart-value">
                        <div class="risk-chart-score">${metricLabel}</div>
                        <div class="risk-chart-meta">Verantwortlich: ${risk.owner || "nicht zugewiesen"}</div>
                      </div>
                      <div class="risk-chart-pill">
                        <span class="risk-tone-pill risk-tone-${riskTone.key}">${riskTone.label}</span>
                      </div>
                    </div>
                  `;
                }).join("") : `<p>Die aktuelle Filtersicht enthält keine Risiken.</p>`}
              </div>
            </div>
          </details>
          <details class="info-card risk-register-card risk-fold-card risk-fold-matrix risk-fold-static card-neutral" data-risk-panel-key="matrix" style="${panelOrderStyle("matrix")}"${foldAllOpen || panelOpenStates.matrix ? " open" : ""}>
            <summary class="risk-fold-summary">
              <div class="risk-fold-summary-main">
                <div class="risk-fold-summary-topline">
                  <button class="risk-fold-drag-handle" type="button" data-risk-panel-drag-handle aria-label="Qualitative 5x5-Matrix verschieben" title="Tafel verschieben">
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                      <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
                    </svg>
                  </button>
                  <span class="risk-fold-toggle" aria-hidden="true"></span>
                  <div class="risk-fold-summary-title">
                    <strong>Qualitative 5x5-Matrix</strong>
                    <span>Verteilung nach Wahrscheinlichkeit und Auswirkung</span>
                  </div>
                </div>
              </div>
              <div class="risk-fold-summary-actions">
                <span class="badge">Qualitative Sicht</span>
              </div>
            </summary>
            <div class="risk-fold-body">
              <div class="risk-matrix-legend">
                <span class="risk-tone-pill risk-tone-neutral">Beobachten</span>
                <span class="risk-tone-pill risk-tone-warn">Erhöht</span>
                <span class="risk-tone-pill risk-tone-critical">Kritisch</span>
                <span class="risk-matrix-legend-note">Farblogik nach 5×5-Score</span>
              </div>
              <div class="risk-matrix-shell">
                <div class="risk-matrix-yaxis">Auswirkung</div>
                <div class="risk-matrix-grid">
                  ${[5, 4, 3, 2, 1].map((impact) => `
                    ${[1, 2, 3, 4, 5].map((likelihood) => {
                      const count = matrixCounts[5 - impact][likelihood - 1];
                      const score = likelihood * impact;
                      const tone = score >= 13 ? "critical" : score >= 9 ? "warn" : "neutral";
                      const isSelected = matrixSelection && matrixSelection.likelihood === likelihood && matrixSelection.impact === impact;
                      return `
                        <button class="risk-matrix-cell risk-matrix-button risk-tone-${tone} ${isSelected ? "is-active" : ""}" type="button" data-action="select-risk-register-matrix-cell" data-likelihood="${likelihood}" data-impact="${impact}">
                          <span class="risk-matrix-code">W ${likelihood} / A ${impact}</span>
                          <strong>${count}</strong>
                          <small>${score} Punkte</small>
                        </button>
                      `;
                    }).join("")}
                  `).join("")}
                </div>
              </div>
              <div class="risk-matrix-xaxis">Eintrittswahrscheinlichkeit</div>
              <div class="risk-matrix-selected">
                <div class="risk-matrix-selected-head">
                  <strong>${matrixSelection ? `Ausgewählte Matrixzelle W ${matrixSelection.likelihood} / A ${matrixSelection.impact}` : "Matrixauswahl"}</strong>
                  <span>${matrixSelection ? `${selectedMatrixRisks.length} Risiko${selectedMatrixRisks.length === 1 ? "" : "e"} gefunden` : "Klicke auf ein Feld, um die zugehörigen Risiken anzuzeigen."}</span>
                </div>
                ${matrixSelection ? (
                  selectedMatrixRisks.length
                    ? `<div class="risk-matrix-selected-list">
                        ${selectedMatrixRisks.map((risk) => {
                          const riskTone = classifyRiskTone(risk);
                          return `
                            <article class="risk-matrix-selected-card risk-tone-${riskTone.key}">
                              <div class="risk-matrix-selected-top">
                                <strong>${risk.id} · ${risk.title}</strong>
                                <span class="risk-tone-pill risk-tone-${riskTone.key}">${riskTone.label}</span>
                              </div>
                              <div class="risk-matrix-selected-meta">${risk.phase || "—"} · ${risk.owner || "nicht zugewiesen"}</div>
                              <div class="risk-matrix-selected-body">
                                <span><strong>W:</strong> ${Number(risk.likelihood) || 0}</span>
                                <span><strong>A:</strong> ${Number(risk.impact) || 0}</span>
                                <span><strong>Score:</strong> ${risk.qualitativeRiskValue} / 25</span>
                                <span><strong>Schaden:</strong> ${formatCurrency(risk.expectedDamage)}</span>
                              </div>
                            </article>
                          `;
                        }).join("")}
                      </div>`
                    : `<p class="risk-matrix-empty-note">Für diese Matrixzelle sind aktuell keine Risiken vorhanden.</p>`
                ) : `<p class="risk-matrix-empty-note">Wähle ein Feld in der Matrix, um die passenden Risiken zu sehen.</p>`}
              </div>
            </div>
          </details>
          </div>
          <template id="risk-edit-legacy-template">
            <summary class="risk-fold-summary">
              <div class="risk-fold-summary-main">
                <div class="risk-fold-summary-topline">
                  <span class="risk-fold-toggle" aria-hidden="true"></span>
                  <div class="risk-fold-summary-title">
                    <strong>Risiken erfassen und bearbeiten</strong>
                    <span>Einträge pflegen · Werte, Status, Maßnahmen und Archivierung ändern</span>
                  </div>
                </div>
              </div>
              <div class="risk-fold-summary-actions">
                <span class="badge">Bearbeiten</span>
              </div>
            </summary>
            <div class="risk-fold-body">
              <div class="risk-register-history-actions" style="margin-bottom:14px;">
                <button class="action-btn risk-add-btn" type="button" data-action="add-risk-register-item"><span class="risk-add-icon" aria-hidden="true">+</span><span>Neues Risiko hinzufügen</span></button>
                <button class="action-btn" type="button" data-action="undo-risk-register-change" ${riskUndoCount > 0 ? "" : "disabled"}><span class="risk-history-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M10 6 4 12l6 6" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12H4" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/></svg></span><span>Letzten Schritt rückgängig</span></button>
                <button class="action-btn" type="button" data-action="redo-risk-register-change" ${riskRedoCount > 0 ? "" : "disabled"}><span class="risk-history-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M14 6 20 12l-6 6" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12H20" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/></svg></span><span>Letzten Schritt wiederherstellen</span></button>
              </div>
              <div class="risk-edit-list">
              ${result.editRisks.map((risk, index) => `
                <details class="risk-edit-card risk-tone-${classifyRiskTone(risk).key} risk-fold-card risk-edit-fold"${foldAllOpen ? " open" : ""}>
                  <summary class="risk-edit-summary">
                    <div class="risk-edit-summary-main">
                      <span class="risk-fold-toggle" aria-hidden="true"></span>
                      <div class="risk-edit-summary-text">
                        <span class="risk-edit-id">${risk.id}</span>
                        <strong>${risk.title}</strong>
                        <span class="risk-edit-summary-value">${risk.qualitativeRiskValue} / 25 · ${formatCurrency(risk.expectedDamage)}</span>
                      </div>
                    </div>
                    <span class="risk-tone-pill risk-tone-${classifyRiskTone(risk).key}">${classifyRiskTone(risk).label}</span>
                  </summary>
                  <div class="risk-edit-grid">
                    <div class="form-field">
                      <label for="risk_id_${index}">Risiko-ID</label>
                      <input id="risk_id_${index}" data-risk-index="${index}" data-risk-field="id" type="text" value="${risk.id}">
                    </div>
                    <div class="form-field half">
                      <label for="risk_title_${index}">Risikobezeichnung</label>
                      <input id="risk_title_${index}" data-risk-index="${index}" data-risk-field="title" type="text" value="${risk.title}">
                    </div>
                    <div class="form-field">
                      <label for="risk_phase_${index}">Projektphase / Zuordnung</label>
                      <select id="risk_phase_${index}" data-risk-index="${index}" data-risk-field="phase">
                        ${buildRiskPhaseOptions(risk.phase).map((phase) => `
                          <option value="${escapeHtml(phase)}" ${String(risk.phase || "").trim().toLowerCase() === String(phase).trim().toLowerCase() ? "selected" : ""}>${escapeHtml(phase)}</option>
                        `).join("")}
                      </select>
                    </div>
                    <div class="form-field wide">
                      <label for="risk_description_${index}">Risikobeschreibung</label>
                      <textarea class="risk-description-textarea" id="risk_description_${index}" data-risk-index="${index}" data-risk-field="description" rows="2">${risk.description}</textarea>
                    </div>
                    <div class="form-field">
                      <label for="risk_category_${index}">Kategorie</label>
                      <select id="risk_category_${index}" data-risk-index="${index}" data-risk-field="category">
                        ${buildRiskCategoryOptions(risk.category).map((category) => `
                          <option value="${escapeHtml(category)}" ${String(risk.category || "").trim().toLowerCase() === String(category).trim().toLowerCase() ? "selected" : ""}>${escapeHtml(category)}</option>
                        `).join("")}
                      </select>
                    </div>
                    <div class="form-field">
                      <label for="risk_owner_${index}">Verantwortlich</label>
                      <input id="risk_owner_${index}" data-risk-index="${index}" data-risk-field="owner" type="text" list="risk_owner_options_${index}" value="${risk.owner}">
                      <datalist id="risk_owner_options_${index}">
                        ${result.ownerOptions.map((owner) => `
                          <option value="${escapeHtml(owner)}"></option>
                        `).join("")}
                      </datalist>
                    </div>
                    <div class="form-field">
                      <label for="risk_status_${index}">Status</label>
                      <select id="risk_status_${index}" data-risk-index="${index}" data-risk-field="status">
                        ${statusOptions.map((status) => `
                          <option value="${status.value}" ${normalizeRiskStatusValue(risk.status) === status.value ? "selected" : ""}>${status.label}</option>
                        `).join("")}
                      </select>
                    </div>
                    <div class="form-field">
                      <label for="risk_due_${index}">Fällig am</label>
                      <input id="risk_due_${index}" data-risk-index="${index}" data-risk-field="dueDate" type="date" value="${risk.dueDate}">
                    </div>
                    <div class="risk-input-grid wide">
                      <div class="form-field">
                        <label for="risk_financial_${index}">Schaden in Euro</label>
                        <div class="eva-stepper-field risk-stepper-field">
                          <input class="compact-input currency-input" id="risk_financial_${index}" data-risk-index="${index}" data-risk-field="financialImpact" type="text" inputmode="numeric" value="${formatCurrencyInput(risk.financialImpact)}">
                          <div class="eva-stepper-buttons">
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="financialImpact" data-step="1000" data-direction="up" data-index="${index}" aria-label="Schaden erhöhen">▲</button>
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="financialImpact" data-step="1000" data-direction="down" data-index="${index}" aria-label="Schaden verringern">▼</button>
                          </div>
                        </div>
                      </div>
                      <div class="form-field">
                        <label for="risk_probability_${index}">EINTRITTSWAHRSCHEINLICHKEIT IN %</label>
                        <div class="eva-stepper-field risk-stepper-field">
                          <input class="compact-input integer-input" id="risk_probability_${index}" data-risk-index="${index}" data-risk-field="probabilityPercent" type="text" inputmode="numeric" value="${formatIntegerInput(risk.probabilityPercent, "%")}">
                          <div class="eva-stepper-buttons">
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="probabilityPercent" data-step="1" data-direction="up" data-index="${index}" aria-label="Eintrittswahrscheinlichkeit erhöhen">▲</button>
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="probabilityPercent" data-step="1" data-direction="down" data-index="${index}" aria-label="Eintrittswahrscheinlichkeit verringern">▼</button>
                          </div>
                        </div>
                      </div>
                      <div class="form-field">
                        <label>Erwarteter Schaden</label>
                        <div class="risk-value-box risk-value-large">${formatCurrency(risk.expectedDamage)}</div>
                      </div>
                      <div class="risk-grid-spacer" aria-hidden="true"></div>
                    </div>
                    <div class="risk-output-grid wide">
                      <div class="form-field">
                        <label for="risk_likelihood_${index}">Eintrittswahrscheinlichkeit (1-5)</label>
                        <div class="risk-value-box risk-value-large">${deriveRiskLikelihoodFromPercent(risk.probabilityPercent, risk.likelihood)}</div>
                      </div>
                      <div class="form-field">
                        <label for="risk_impact_${index}">Auswirkung (1-5)</label>
                        <div class="eva-stepper-field risk-stepper-field">
                          <input class="compact-input integer-input" id="risk_impact_${index}" data-risk-index="${index}" data-risk-field="impact" type="text" inputmode="numeric" value="${formatIntegerInput(risk.impact)}">
                          <div class="eva-stepper-buttons">
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="impact" data-step="1" data-direction="up" data-index="${index}" aria-label="Auswirkung erhöhen">▲</button>
                            <button type="button" class="eva-stepper-btn" data-action="risk-step" data-field="impact" data-step="1" data-direction="down" data-index="${index}" aria-label="Auswirkung verringern">▼</button>
                          </div>
                        </div>
                      </div>
                      <div class="form-field">
                        <label>Risikowert 5×5</label>
                        <div class="risk-value-box risk-value-large">${risk.qualitativeRiskValue} / 25</div>
                      </div>
                      <div class="risk-grid-spacer" aria-hidden="true"></div>
                    </div>
                    <div class="form-field wide">
                      <label for="risk_measures_${index}">Maßnahmenplanung</label>
                      <textarea id="risk_measures_${index}" data-risk-index="${index}" data-risk-field="measures">${risk.measures}</textarea>
                    </div>
                    <div class="risk-residual-stack">
                      <div class="form-field">
                        <label for="risk_residual_${index}">Rest-Risiko</label>
                        <textarea id="risk_residual_${index}" data-risk-index="${index}" data-risk-field="residualRisk" rows="3">${risk.residualRisk}</textarea>
                      </div>
                    </div>
                  </div>
              `).join("")}
            </div>
            </div>
          </template>
          </section>
        </div>
      `;
    }
  },
  reports: {
    key: "reports",
    label: "Berichte",
    subtitle: "Berichtsausgaben aus dem Risikoregister",
    render(state) {
      const reportExportName = state.ui?.reportExportName || "";
      const reportExportFormat = ["json", "txt", "doc", "pdf"].includes(String(state.ui?.reportExportFormat || "").toLowerCase())
        ? String(state.ui.reportExportFormat).toLowerCase()
        : "txt";
      const reportOutputTitle = "Risikobericht";
      const reportOutputButtonLabel = "Risikobericht exportieren";
      const reportOutputPdfButtonLabel = "Druckansicht öffnen";
      const reportDraft = String(state?.ui?.reportDraft || "").trim();
      const reportPreviewText = reportDraft
        ? reportDraft
        : state?.ui?.reportDraftCleared === true
          ? ""
          : renderRiskReportText(state);
      const reportExportBaseName = String(reportExportName || reportOutputTitle)
        .replace(/[^\wäöüÄÖÜß.-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || reportOutputTitle;
      const reportMarkup = sanitizeReportDraftHtml(reportPreviewText);
      const reportPdfDate = (() => {
        const parsed = new Date();
        return Number.isNaN(parsed.getTime()) ? "nicht angegeben" : parsed.toLocaleDateString("de-DE");
      })();
      const reportExportPlainTextBody = reportMarkupToPlainText(reportMarkup) || reportPreviewText;
      const reportExportPlainText = `${reportOutputTitle}\n\n${reportExportPlainTextBody}`.trim();
      const reportExportJson = JSON.stringify({
        reportMode: "risk",
        reportTitle: reportOutputTitle,
        generatedAt: new Date().toISOString(),
        reportText: reportExportPlainText,
        ...buildSelectedReportData(state)
      }, null, 2);
      const reportExportDocHtml = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="color-scheme" content="light"><title>${escapeHtml(reportOutputTitle)}</title><style>@page{margin:0;}html,body{background:#ffffff;color:#08131d;}body{font-family:"Source Sans 3","Segoe UI",sans-serif;margin:0;}h1{font-family:"DM Serif Display",Georgia,serif;font-size:30px;margin:0;color:#091f33;}.report-title-spacer{height:18px;line-height:18px;font-size:18px;}.meta{color:#425466;margin-bottom:12px;line-height:1.6;}.copy{line-height:1.7;font-size:15px;}.copy ul,.copy ol{margin:0 0 12px 1.25em;padding-left:1.1em;}.copy li{margin:0 0 5px;}.copy .report-section-heading{margin:18px 0 6px;}.copy .report-section-heading:first-of-type{margin-top:0;}.copy .report-project-line{margin:0 0 5px;color:#091f33;line-height:1.45;font-weight:400;}.copy .report-project-line-main{font-size:1.18rem;font-weight:800;}.copy .report-project-line-secondary{font-size:1rem;font-weight:400;}.copy .report-meta-line-break{margin-bottom:12px;}.copy .report-paragraph-spacer{height:12px;}.copy blockquote{margin:0 0 12px;padding:2px 0 2px 14px;border-left:3px solid #9fb3c6;color:#334454;font-style:italic;}.copy font[size="5"]{font-size:1.18em;}.copy font[size="4"]{font-size:1.08em;}.copy font[size="3"]{font-size:1em;}.copy font[size="2"]{font-size:0.9em;}</style></head><body><h1>${escapeHtml(reportOutputTitle)}</h1><div class="report-title-spacer" aria-hidden="true">&nbsp;</div><div class="copy">${reportMarkup}</div></body></html>`;
      const reportPdfPreviewHtml = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="color-scheme" content="light"><title>${escapeHtml(reportExportBaseName || reportOutputTitle)}</title><style>@page{margin:0;}html,body{background:#ffffff;color:#08131d;}body{font-family:"Source Sans 3","Segoe UI",sans-serif;margin:0;padding:20mm;box-sizing:border-box;}h1{font-family:"DM Serif Display",Georgia,serif;font-size:30px;margin:0;color:#091f33;}.report-title-spacer{height:18px;line-height:18px;font-size:18px;}.meta{color:#425466;margin-bottom:12px;line-height:1.6;}.copy{line-height:1.7;font-size:15px;}.copy ul,.copy ol{margin:0 0 12px 1.25em;padding-left:1.1em;}.copy li{margin:0 0 5px;}.copy .report-section-heading{margin:18px 0 6px;}.copy .report-section-heading:first-of-type{margin-top:0;}.copy .report-project-line{margin:0 0 5px;color:#091f33;line-height:1.45;font-weight:400;}.copy .report-project-line-main{font-size:1.18rem;font-weight:800;}.copy .report-project-line-secondary{font-size:1rem;font-weight:400;}.copy .report-meta-line-break{margin-bottom:12px;}.copy .report-paragraph-spacer{height:12px;}.copy blockquote{margin:0 0 12px;padding:2px 0 2px 14px;border-left:3px solid #9fb3c6;color:#334454;font-style:italic;}.copy font[size="5"]{font-size:1.18em;}.copy font[size="4"]{font-size:1.08em;}.copy font[size="3"]{font-size:1em;}.copy font[size="2"]{font-size:0.9em;}</style></head><body><h1>${escapeHtml(reportOutputTitle)}</h1><div class="report-title-spacer" aria-hidden="true">&nbsp;</div><div class="copy">${reportMarkup}</div><script>window.addEventListener('load',()=>window.setTimeout(()=>window.print(),120),{once:true});</script></body></html>`;
      const reportTxtHref = typeof globalThis.__riskCreateReportExportObjectUrl === "function"
        ? globalThis.__riskCreateReportExportObjectUrl(reportExportPlainText, "text/plain;charset=utf-8")
        : `data:text/plain;charset=utf-8,${encodeURIComponent(reportExportPlainText)}`;
      const reportJsonHref = typeof globalThis.__riskCreateReportExportObjectUrl === "function"
        ? globalThis.__riskCreateReportExportObjectUrl(reportExportJson, "application/json;charset=utf-8")
        : `data:application/json;charset=utf-8,${encodeURIComponent(reportExportJson)}`;
      const reportDocHref = typeof globalThis.__riskCreateReportExportObjectUrl === "function"
        ? globalThis.__riskCreateReportExportObjectUrl(reportExportDocHtml, "application/msword;charset=utf-8")
        : `data:application/msword;charset=utf-8,${encodeURIComponent(reportExportDocHtml)}`;
      const reportPdfHref = typeof globalThis.__riskCreateReportExportObjectUrl === "function"
        ? globalThis.__riskCreateReportExportObjectUrl(reportPdfPreviewHtml, "text/html;charset=utf-8")
        : `data:text/html;charset=utf-8,${encodeURIComponent(reportPdfPreviewHtml)}`;
      const reportSelectedExportHref = reportExportFormat === "json"
        ? reportJsonHref
        : reportExportFormat === "doc"
          ? reportDocHref
          : reportExportFormat === "pdf"
            ? reportPdfHref
            : reportTxtHref;
      const reportSelectedExportDownloadName = `${reportExportBaseName}.${reportExportFormat === "json" ? "json" : reportExportFormat === "doc" ? "doc" : "txt"}`;
      const reportWorkshopTask = "risk-report";
      const reportWorkshopState = state.ui?.aiWorkshop || {};
      const reportWorkshopActive = reportWorkshopState.activeTask === reportWorkshopTask;
      const reportWorkshopTitle = reportWorkshopActive && typeof reportWorkshopState.resultTitle === "string" && reportWorkshopState.resultTitle.trim()
        ? reportWorkshopState.resultTitle
        : "KI bereit";
      const reportWorkshopText = reportWorkshopActive && typeof reportWorkshopState.resultText === "string" && reportWorkshopState.resultText.trim()
        ? reportWorkshopState.resultText
        : "Risikobericht ist ausgewählt. Bitte auf Bericht generieren klicken.";
      const reportWorkshopTone = reportWorkshopActive && ["neutral", "success", "danger"].includes(reportWorkshopState.resultTone)
        ? reportWorkshopState.resultTone
        : "neutral";
      const reportWorkshopProgress = Math.round(Math.max(0, Math.min(100, Number(reportWorkshopState.progressPercent) || (reportWorkshopState.busy ? 18 : 0))));
      const reportWorkshopLoadingIndicator = reportWorkshopState.busy
        ? `
          <div class="report-ai-loader" aria-live="polite" aria-busy="true">
            <span class="report-ai-loader-spinner" aria-hidden="true"></span>
            <span class="report-ai-loader-text">KI verarbeitet den Bericht ...</span>
            <span class="report-ai-loader-percent" aria-hidden="true">${reportWorkshopProgress}%</span>
          </div>
        `
        : "";
      return `
        <div class="module-shell">
          <div class="module-title project-module-title">
            ${renderModuleHeaderBody(state, "Berichte", "Operativ bearbeitbarer Risikobericht für das Register.")}
            <span class="badge">Bericht</span>
          </div>
          ${renderReportMetaBar(state)}
          <section class="info-card report-output-card card-neutral">
            <div class="report-process-note">
              <strong>Ablauf</strong>
              <div class="report-process-grid">
                <div class="report-process-step">
                  <span class="report-process-step-number">1</span>
                  <span class="report-process-step-text">Projektdaten und Risikodaten prüfen.</span>
                </div>
                <div class="report-process-step">
                  <span class="report-process-step-number">2</span>
                  <span class="report-process-step-text">Bericht aus den aktuellen Daten erzeugen.</span>
                </div>
                <div class="report-process-step">
                  <span class="report-process-step-number">3</span>
                  <span class="report-process-step-text">Den Bericht bei Bedarf mit KI weiter ausarbeiten.</span>
                </div>
                <div class="report-process-step">
                  <span class="report-process-step-number">4</span>
                  <span class="report-process-step-text">KI-Vorschlag prüfen und wieder in den Bericht übernehmen.</span>
                </div>
                <div class="report-process-step">
                  <span class="report-process-step-number">5</span>
                  <span class="report-process-step-text">Den Bericht bei Bedarf manuell formatieren.</span>
                </div>
                <div class="report-process-step">
                  <span class="report-process-step-number">6</span>
                  <span class="report-process-step-text">Den Bericht in der Vorschau abschließend prüfen.</span>
                </div>
                <div class="report-process-step">
                  <span class="report-process-step-number">7</span>
                  <span class="report-process-step-text">Dateinamen und Format prüfen.</span>
                </div>
                <div class="report-process-step">
                  <span class="report-process-step-number">8</span>
                  <span class="report-process-step-text">Wenn der Bericht stimmig ist, den Risikobericht exportieren.</span>
                </div>
                <div class="report-process-note-tile">
                  <span class="report-process-note-badge" aria-hidden="true">!</span>
                  <span class="report-process-note-text">Beim Export gilt stets der aktuelle Entwurfsstand.</span>
                </div>
              </div>
            </div>
            <div class="ai-workshop-grid report-workshop-actions report-workshop-actions-inline" style="margin-bottom:10px;">
              <button class="action-btn primary" type="button" data-action="build-report-draft" onclick="void globalThis.__riskBuildReportDraft?.()">Berichts Entwurf aus aktuellen Daten erzeugen</button>
              <button class="action-btn" type="button" data-action="clear-report-draft" onclick="void globalThis.__riskClearReportDraft?.()">Entwurf leeren</button>
            </div>
            <h3 id="reportDraftHeading">${reportOutputTitle}</h3>
            <p class="form-note">Der Bericht ist direkt bearbeitbar und wird automatisch gespeichert.</p>
            <p class="report-draft-toolbar-note">Bitte zuerst Text markieren, dann formatieren.</p>
            <div class="report-draft-toolbar" role="toolbar" aria-label="Bericht formatieren">
              <div class="report-draft-toolbar-group">
                <button class="action-btn" type="button" data-report-format-action="bold" onclick="void globalThis.__riskApplyReportDraftFormatting?.('bold')">Fett</button>
                <button class="action-btn" type="button" data-report-format-action="underline" onclick="void globalThis.__riskApplyReportDraftFormatting?.('underline')">Unterstrichen</button>
                <button class="action-btn" type="button" data-report-format-action="bullet" onclick="void globalThis.__riskApplyReportDraftFormatting?.('bullet')">Aufzählung</button>
                <button class="action-btn" type="button" data-report-format-action="numbered" onclick="void globalThis.__riskApplyReportDraftFormatting?.('numbered')">Nummerierung</button>
                <button class="action-btn" type="button" data-report-format-action="quote" onclick="void globalThis.__riskApplyReportDraftFormatting?.('quote')">Zitat</button>
                <button class="action-btn" type="button" data-report-format-action="large" onclick="void globalThis.__riskApplyReportDraftFormatting?.('large')">Größer</button>
                <button class="action-btn" type="button" data-report-format-action="small" onclick="void globalThis.__riskApplyReportDraftFormatting?.('small')">Kleiner</button>
                <button class="action-btn" type="button" data-report-format-action="clear" onclick="void globalThis.__riskApplyReportDraftFormatting?.('clear')">Format löschen</button>
              </div>
              <div class="report-draft-toolbar-spacer" aria-hidden="true"></div>
              <div class="report-draft-toolbar-history" aria-label="Bearbeitung rückgängig machen">
                <button class="action-btn" type="button" data-report-format-action="undo" onclick="void globalThis.__riskApplyReportDraftFormatting?.('undo')">Rückgängig</button>
                <button class="action-btn" type="button" data-report-format-action="redo" onclick="void globalThis.__riskApplyReportDraftFormatting?.('redo')">Wiederherstellen</button>
              </div>
            </div>
            <div class="code-box report-output-box report-draft-editor" data-report-draft-field="text" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true">${renderReportDraftEditorHtml(reportPreviewText)}</div>
          </section>
          <section class="info-card report-workshop-card card-info">
            <h3>KI für Berichtstexte</h3>
            <p class="form-note">Die KI erstellt hier einen ausführlichen Berichtsdraft aus den aktuellen Projektdaten.</p>
            <div class="ai-workshop-grid report-workshop-actions">
              <button class="action-btn primary ${reportWorkshopActive ? "active" : ""}" type="button" data-action="run-ai-workshop" data-ai-workshop-task="${reportWorkshopTask}" onclick="void globalThis.__riskRunAiWorkshop?.('${reportWorkshopTask}')">Bericht generieren</button>
            </div>
            <p class="form-note">Die KI verdichtet, formuliert und strukturiert den Berichtsvorschlag. Der Bericht wird erst nach dem Übernehmen aktualisiert.</p>
            <div class="code-box ai-workshop-output ${reportWorkshopState.busy ? "is-loading" : ""} ${reportWorkshopTone === "success" ? "tone-success" : reportWorkshopTone === "danger" ? "tone-danger" : "tone-neutral"}">
              <strong>${escapeHtml(reportWorkshopTitle)}</strong>
              ${reportWorkshopLoadingIndicator}
              <div style="margin-top:8px;">${renderFormattedReportTextHtml(reportWorkshopText)}</div>
            </div>
            <div class="ai-workshop-grid report-workshop-actions" style="margin-top:10px;">
              <button class="action-btn primary" type="button" data-action="apply-ai-report-result" onclick="void globalThis.__riskApplyAiReportResult?.()">Vorschlag als neuen Entwurf übernehmen</button>
            </div>
          </section>
          <div class="card-grid report-export-grid-shell" style="grid-template-columns:minmax(0,1fr); align-items:start;">
            <section class="info-card card-neutral">
              <h3>Reportprofil</h3>
              <p class="form-note">Die Vertraulichkeit legst du hier fest. Sie steuert, ob der Bericht intern, vertraulich oder stärker geschützt verwendet wird.</p>
              <ul>
                <li><strong>Erstellt von:</strong> ${state.reportProfile.author || "nicht gepflegt"}</li>
                <li><strong>Erstellende Stelle:</strong> ${state.reportProfile.company || "nicht gepflegt"}</li>
                <li><strong>Empfänger:</strong> ${state.reportProfile.clientName || "nicht gepflegt"}</li>
                <li><strong>Vertraulichkeit:</strong> ${state.reportProfile.confidentiality || "Vertraulich"}</li>
              </ul>
            </section>
            <section class="info-card card-neutral">
              <h3>Exporte</h3>
              <div class="export-stack">
                <div class="export-mini-card">
                  <h4>Bericht exportieren</h4>
                  <p class="form-note">Wähle hier den Dateinamen und das Format für den Bericht.</p>
                  <ul class="export-format-help">
                    <li><strong>TXT (.txt):</strong> Für Mail, Protokoll, schnelle Weitergabe und das Einfügen in andere Dokumente.</li>
                    <li><strong>DOC (.doc):</strong> Für die Bearbeitung in Word, redaktionelle Nacharbeit und spätere Kommentierung.</li>
                    <li><strong>PDF (.pdf):</strong> Für Freigabe, Versand, Druckansicht öffnen und eine unveränderliche Dokumentfassung.</li>
                    <li><strong>JSON (.json):</strong> Für strukturierte Berichtsdaten, Import, KI-Verarbeitung und technische Weitergabe.</li>
                  </ul>
                  <div class="report-export-grid">
                    <div class="form-field">
                      <label for="reportExportFileName">Dateiname</label>
                      <input id="reportExportFileName" data-report-export-field="fileName" type="text" value="${escapeHtml(reportExportName)}" placeholder="z. B. Risikobericht für ${escapeHtml(state.project?.name || "Projekt")}">
                    </div>
                    <div class="form-field">
                      <label for="reportExportFormat">Format</label>
                      <select id="reportExportFormat" data-report-export-field="format">
                        <option value="txt"${reportExportFormat === "txt" ? " selected" : ""}>Text (.txt)</option>
                        <option value="json"${reportExportFormat === "json" ? " selected" : ""}>Berichtsdaten (.json)</option>
                        <option value="doc"${reportExportFormat === "doc" ? " selected" : ""}>Word-Dokument (.doc)</option>
                        <option value="pdf"${reportExportFormat === "pdf" ? " selected" : ""}>Druckansicht (.pdf)</option>
                      </select>
                    </div>
                  </div>
                  <p class="form-note">Alle Berichtsexporte werden im Downloads-Ordner gespeichert.</p>
                  <div class="report-output-actions">
                    ${reportExportFormat === "pdf"
                      ? `<a class="action-btn primary" id="reportExportButton" href="${reportSelectedExportHref}" target="_blank" rel="noopener noreferrer" onclick="void globalThis.__riskExportSelectedReport?.()">${reportOutputPdfButtonLabel}</a>`
                      : `<a class="action-btn primary" id="reportExportButton" href="${reportSelectedExportHref}" download="${reportSelectedExportDownloadName}" target="_blank" rel="noopener noreferrer" onclick="void globalThis.__riskExportSelectedReport?.()">${reportOutputButtonLabel}</a>`
                    }
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      `;
    }
  },
  ai: {
    key: "ai",
    label: "KI",
    subtitle: "Fach-Chat und Hilfe-Chat",
    render(state) {
      const project = state.project || {};
      const reportProfile = state.reportProfile || {};
      const aiChats = globalThis.__riskRegisterAiChats || {};
      const aiDrafts = globalThis.__riskRegisterUiDrafts?.aiChatDrafts || {};
      const aiPanelOpenStates = normalizeAiPanelOpenStates(state.ui?.aiPanelOpenStates);
      const aiPanelOrder = Array.isArray(globalThis.__riskRegisterAiPanelOrder) && globalThis.__riskRegisterAiPanelOrder.length
        ? globalThis.__riskRegisterAiPanelOrder
        : ["aiConnectionPanel", "fachChatPanel", "hilfeChatPanel"];
      const aiPanelRank = new Map(aiPanelOrder.map((key, index) => [key, index]));
      const aiPanelOrderStyle = (key) => `order:${aiPanelRank.get(key) ?? 999};`;
      const fachChat = aiChats.fach || {};
      const hilfeChat = aiChats.hilfe || {};
      const auditMissing = typeof globalThis.__riskCollectProjectFileAudit === "function"
        ? globalThis.__riskCollectProjectFileAudit(state)
        : [];
      const projectSummary = [
        project.name,
        project.type,
        project.bauart
      ].filter(Boolean).join(" · ") || "Noch keine Projektdaten gepflegt";
      const projectLocation = [
        [project.location?.street, project.location?.houseNumber].filter(Boolean).join(" "),
        [project.location?.postalCode, project.location?.city].filter(Boolean).join(" ")
      ].filter(Boolean).join(", ") || "Standort noch nicht gepflegt";
      const projectFacts = [
        `Budget ${formatCurrency(Number(project.budget) || 0)}`,
        `Phase ${project.phase || "nicht gepflegt"}`,
        `Vertraulichkeit ${reportProfile.confidentiality || "Vertraulich"}`
      ];
      const missingItems = Array.isArray(auditMissing) && auditMissing.length ? auditMissing : [];
      const fachContext = [
        `Projekt: ${projectSummary}`,
        `Standort: ${projectLocation}`,
        ...projectFacts
      ].concat(missingItems.length ? [`Fehlende Angaben: ${missingItems.slice(0, 4).join(", ")}`] : ["Kernangaben vollständig"]).join(" · ");
      const helpContext = [
        `Aktive Ansicht: ${state.ui?.activeModule || "project"}`,
        "Fragen zur Bedienung: Speichern, Laden, Berichte, Risikoregister, KI und Dateiverwaltung."
      ].join(" ");
      const fachChatMessages = Array.isArray(fachChat.messages) ? fachChat.messages : [];
      const hilfeChatMessages = Array.isArray(hilfeChat.messages) ? hilfeChat.messages : [];
      return `
        <div class="module-shell">
          <div class="module-title project-module-title">
            ${renderModuleHeaderBody(state, "KI", "Fach-Chat und Hilfe-Chat für das Register.")}
            <span class="badge">KI-Dialog</span>
          </div>
          <div class="card-grid ai-hub-grid">
            <details class="info-card card-info risk-register-card risk-fold-card ai-connection-panel" id="aiConnectionPanel" data-ai-panel-key="aiConnectionPanel"${aiPanelOpenStates.aiConnectionPanel ? " open" : ""} style="grid-column:1 / -1; ${aiPanelOrderStyle("aiConnectionPanel")}">
              <summary class="risk-fold-summary">
                <div class="risk-fold-summary-main">
                  <div class="risk-fold-summary-topline">
                    <span class="risk-fold-drag-handle" data-ai-panel-drag-handle aria-hidden="true" title="Tafel verschieben">
                      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <rect x="2" y="3.25" width="12" height="1.5" rx="0.75"></rect>
                        <rect x="2" y="7.25" width="12" height="1.5" rx="0.75"></rect>
                        <rect x="2" y="11.25" width="12" height="1.5" rx="0.75"></rect>
                      </svg>
                    </span>
                    <span class="risk-fold-toggle" aria-hidden="true"></span>
                    <div class="risk-fold-summary-title">
                      <strong>KI-Verbindung</strong>
                      <span>Der API-Schlüssel bleibt lokal im Browser; Speichern prüft die Verbindung und zeigt den Status rechts.</span>
                    </div>
                  </div>
                </div>
                <div class="risk-fold-summary-actions">
                  <span class="badge ai-connection-badge">Live-Check</span>
                </div>
              </summary>
              <div class="panel-body ai-connection-panel-body">
                <div class="ai-connection-layout">
                  <div class="ai-connection-main">
                    <div class="action-file-grid">
                      <div class="form-field" style="grid-column:1/-1;">
                        <label for="aiApiKey">Anthropic API-Schlüssel</label>
                        <div class="ai-secret-field">
                          <span class="ai-secret-key-icon" aria-hidden="true">🔑</span>
                          <input id="aiApiKey" data-ai-setting-field="apiKey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-form-type="other" value="" placeholder="sk- ...">
                          <button class="ai-secret-toggle" id="aiApiKeyToggle" type="button" aria-label="Schlüssel anzeigen" aria-pressed="false" onclick="void globalThis.__riskToggleAiApiKeyVisibility?.()">👁</button>
                        </div>
                      </div>
                    </div>
                    <div class="ai-connection-controls">
                      <button class="action-btn primary" id="saveAiSettingsBtn" type="button" onclick="void globalThis.__riskSaveAiSettings?.()">Einstellungen speichern</button>
                      <button class="action-btn" id="testAiSettingsBtn" type="button" onclick="void globalThis.__riskTestAiSettings?.()">Verbindung erneut prüfen</button>
                      <button class="action-btn danger" id="disconnectAiSettingsBtn" type="button" onclick="void globalThis.__riskDisconnectAiConnection?.()">Verbindung trennen</button>
                      <button class="action-btn danger" id="deleteAiSettingsBtn" type="button" onclick="void globalThis.__riskDeleteAiApiKey?.()">API-Schlüssel löschen</button>
                      <button class="storage-status storage-status-box ai-status-neutral" id="aiStatus" type="button" disabled style="grid-column:1 / -1;">Noch keine KI-Verbindung eingerichtet.</button>
                    </div>
                  </div>
                  <div class="ai-connection-info">
                    <strong>API-Schlüssel &amp; Kosten</strong>
                    <p class="ai-connection-copy-singleline">Kein Claude-Free-Account nötig: Es genügt ein Anthropic-API-Schlüssel aus der Console.</p>
                    <div class="ai-connection-links">
                      <a class="action-btn" href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console öffnen</a>
                    </div>
                    <p>Modell: Claude Sonnet 4. Für die automatische KI-Nutzung benötigt die App einen technischen Anthropic-API-Schlüssel. Das ist kein normaler Benutzer- oder Claude-Account, sondern der Zugriff für die direkte KI-Anbindung im Browser. Für den Einstieg werden 10 Euro empfohlen. Das ist kein ausgelesener Kontostand, sondern nur eine Orientierung: Je nach Umfang reicht das grob für zahlreiche kurze Prüfungen oder etwa 150 bis 300 Seiten komprimierter Berichtstexte; bei längeren, ausführlicheren Berichten entsprechend weniger. Die Abrechnung läuft direkt zwischen dir und Anthropic/Claude und wird separat nach Verbrauch berechnet. Die offizielle <a href="https://docs.anthropic.com/en/docs/about-claude/pricing" target="_blank" rel="noopener noreferrer">Anthropic-Dokumentation zur Preisübersicht</a> findest du dort.</p>
                  </div>
                </div>
              </div>
            </details>
            ${renderAiChatThreadHtml({
              chatId: "fach",
              panelKey: "fachChatPanel",
              panelStyle: aiPanelOrderStyle("fachChatPanel"),
              title: "Fach-Chat",
              description: "Frage zum Bauprojekt, Risiken, Maßnahmen, Bauphasen, Berichtsinhalten und Plausibilität.",
              context: fachContext,
              prompts: [
                "Welche Risiken sind aktuell am kritischsten?",
                "Welche Maßnahmen passen zur aktuellen Phase?",
                "Was sollte ins Risikoregister ergänzt werden?",
                "Welche Angaben fehlen noch im Bauprojekt?",
                "Fasse das Bauprojekt kurz zusammen.",
                "Welche Punkte sollte ich als Nächstes prüfen?"
              ],
              inputId: "aiChatFachDraft",
              inputLabel: "Individuelle Fachfrage",
              placeholder: "Stelle eine Frage zu Projekt, Risiken, Maßnahmen oder Bericht.",
              sendLabel: "Fachfrage senden",
              outputMinHeight: 240,
              composerClass: "ai-chat-composer compact",
              collapsible: true,
              draft: String(aiDrafts.fach || ""),
              busy: Boolean(fachChat.busy),
              status: String(fachChat.status || "Bereit"),
              messages: fachChatMessages,
              open: aiPanelOpenStates.fachChatPanel
            })}
            ${renderAiChatThreadHtml({
              chatId: "hilfe",
              panelKey: "hilfeChatPanel",
              panelStyle: aiPanelOrderStyle("hilfeChatPanel"),
              title: "Hilfe-Chat",
              description: "Fragen zur Bedienung der Anwendung, zu Menüs, Feldern, Speichern, Laden und Exporten.",
              context: helpContext,
              prompts: [
                "Wie speichere ich ein Projekt dauerhaft in der App?",
                "Wie lade ich eine JSON-Datei mit einem gespeicherten Projekt oder Backup?",
                "Wie prüfe ich vor dem Weiterarbeiten, ob noch Eingaben fehlen?",
                "Wie übernehme ich einen KI-Vorschlag in den Bericht oder das Risikoregister?",
                "Wie stelle ich eine KI-Verbindung her und welche Kosten entstehen dabei?"
              ],
              inputId: "aiChatHilfeDraft",
              inputLabel: "Individuelle Hilfefrage",
              placeholder: "Stelle eine Frage zur Bedienung der Anwendung.",
              sendLabel: "Hilfefrage senden",
              outputMinHeight: 240,
              composerClass: "ai-chat-composer compact",
              promptsClass: "help-flow",
              collapsible: true,
              draft: String(aiDrafts.hilfe || ""),
              busy: Boolean(hilfeChat.busy),
              status: String(hilfeChat.status || "Bereit"),
              messages: hilfeChatMessages,
              open: aiPanelOpenStates.hilfeChatPanel
            })}
          </div>
        </div>
      `;
    }
  }
};

globalThis.__riskSanitizeReportDraftHtml = sanitizeReportDraftHtml;
