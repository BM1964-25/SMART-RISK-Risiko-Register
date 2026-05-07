export const initialState = {
  meta: {
    app: "Risiko Register",
    version: "1.0.0",
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    savedAt: new Date().toISOString(),
  },
  project: {
    name: "Neubau Wohnbau Nordpark",
    type: "Wohnungsbau",
    bauart: "Neubau",
    phase: "LPH 5",
    status: "Ausschreibung / Vergabe",
    landArea: 2400,
    bgf: 3000,
    floorsAboveGround: 5,
    floorsBelowGround: 2,
    budget: 18500000,
    costBasis: "netto",
    currency: "EUR",
    location: {
      street: "Marktplatz",
      houseNumber: "18",
      postalCode: "40221",
      city: "Düsseldorf",
      country: "DE"
    },
    client: "Nordpark Immobilien GmbH",
    clientRoles: ["Auftraggeber", "Investor"],
    clientFunctions: ["Projektleitung", "Bauherrenvertretung"],
    clientAddressLine: "Walter-Gropius Straße 1",
    clientPostalCode: "80333",
    clientCity: "München",
    projectLead: "Dipl.-Ing. Jana Richter",
    startDate: "2026-04-01",
    endDate: "2027-08-31",
    analysisDate: "2026-04-04",
    description: "Neubau eines Mehrfamilienhauses mit 5 Obergeschossen und 2 Untergeschossen in massiver Bauweise. Die tragenden Bauteile werden in Stahlbeton und Mauerwerk ausgeführt, die Decken als Stahlbetondecken. Nichttragende Innenwände werden überwiegend in Trockenbauweise hergestellt. Die beiden Untergeschosse werden als wasserundurchlässige Konstruktion ausgeführt und nehmen Tiefgarage, Technik-, Abstell- und Nebenräume auf.\nIn den 5 Obergeschossen entstehen Wohnungen unterschiedlicher Größe mit funktionalen Grundrissen, Balkonen oder Loggien sowie barrierearmer Erschließung über ein zentrales Treppenhaus mit Aufzug. Das Gebäude erhält ein Flachdach mit hochwertiger Abdichtung, optionaler Begrünung und moderner Fassadendämmung. Vorgesehen sind energieeffiziente Fenster, eine zeitgemäße Heizungs-, Sanitär- und Elektroinstallation sowie ansprechend gestaltete Außenanlagen.\nIm Sinne von Nachhaltigkeit und ESG wird das Gebäude ressourcenschonend geplant und betrieben. Ziel sind eine energieeffiziente Gebäudehülle, reduzierte Betriebskosten, langlebige und wartungsarme Materialien sowie ein möglichst geringer CO2-Ausstoß über den Lebenszyklus. Ergänzend werden Aspekte wie Regenwassermanagement, Fahrradstellplätze, gute Aufenthaltsqualität und barrierearme Nutzung berücksichtigt."
  },
  reportProfile: {
    company: "BuiltSmart Hub",
    companyAddress: "Am Kastenacker 4, 82266 Inning",
    author: "Bernhard Metzger",
    clientName: "Nordpark Immobilien GmbH",
    clientAddress: "Walter-Gropius Straße 1, 80333 München",
    projectAddress: "Bauhofstraße 18, 40221 Düsseldorf",
    confidentiality: "Vertraulich",
    notes: "",
    logoDataUrl: null
  },
  riskRegister: {
    risks: [
      {
        id: "R-0005",
        createdAt: "2026-04-05T08:00:00.000Z",
        title: "Sicherheitsmangel bei Arbeiten am Baugerüst",
        description: "Unzureichend gesicherte Arbeitsbereiche können zu Unterbrechungen und Nachforderungen führen.",
        phase: "Compliance / Fassade / Arbeitssicherheit",
        category: "Compliance",
        area: "Arbeitssicherheit / Gerüst",
        financialImpact: 400000,
        probabilityPercent: 15,
        expectedDamage: 60000,
        likelihood: 3,
        impact: 3,
        qualitativeRiskValue: 9,
        owner: "HSE-Koordination",
        measures: "Tägliche Sicherheitsbegehungen und Nachschulungen der Gewerke durchführen",
        dueDate: "2026-04-05",
        status: "Maßnahme läuft",
        residualRisk: "Sicherheitsrisiko bleibt reduziert"
      },
      {
        id: "R-0004",
        createdAt: "2026-04-04T08:00:00.000Z",
        title: "Witterungsbedingte Unterbrechung der Dachabdichtung",
        description: "Anhaltender Regen oder Sturm können Außenarbeiten und Taktung verzögern.",
        phase: "Operativ / Ausbau / Dach",
        category: "Operativ",
        area: "Dach / Witterung",
        financialImpact: 90000,
        probabilityPercent: 45,
        expectedDamage: 40500,
        likelihood: 3,
        impact: 4,
        qualitativeRiskValue: 12,
        owner: "Bauleitung Ausbau",
        measures: "Wetterfenster täglich bewerten, Schutzabdeckungen bereithalten, Puffer einplanen",
        dueDate: "2026-04-15",
        status: "In Beobachtung",
        residualRisk: "Wetterrisiko bleibt mittel"
      },
      {
        id: "R-0003",
        createdAt: "2026-04-03T08:00:00.000Z",
        title: "Unerwartete Bodenverhältnisse im Baugrubenaushub",
        description: "Abweichende Bodenklassen oder Altlasten können Tiefbau und Gründung deutlich beeinflussen.",
        phase: "Technisch / Baugrube / Gründung",
        category: "Technisch",
        area: "Baugrube / Geotechnik",
        financialImpact: 320000,
        probabilityPercent: 25,
        expectedDamage: 80000,
        likelihood: 3,
        impact: 3,
        qualitativeRiskValue: 9,
        owner: "Projektleitung Tiefbau",
        measures: "Zusätzliche Sondierungen veranlassen, Bodengutachter einbinden, Reserven prüfen",
        dueDate: "2026-04-07",
        status: "Offen",
        residualRisk: "Nachgründung möglich"
      },
      {
        id: "R-0002",
        createdAt: "2026-04-02T08:00:00.000Z",
        title: "Kostensteigerung bei Bewehrungsstahl",
        description: "Steigende Stahlpreise können die freigegebenen Budgets in der Rohbauvergabe belasten.",
        phase: "Finanziell / Vergabe / Rohbau",
        category: "Finanziell",
        area: "Rohbau / Materialkosten",
        financialImpact: 250000,
        probabilityPercent: 30,
        expectedDamage: 75000,
        likelihood: 5,
        impact: 3,
        qualitativeRiskValue: 15,
        owner: "Einkauf / Projektkaufmann",
        measures: "Preisklauseln prüfen, Vergabepakete vorziehen, Marktanalyse aktualisieren",
        dueDate: "2026-04-12",
        status: "In Beobachtung",
        residualRisk: "Kostenrisiko bleibt erhöht"
      },
      {
        id: "R-0001",
        createdAt: "2026-04-01T08:00:00.000Z",
        title: "Lieferverzug bei Betonfertigteilen",
        description: "Die termingerechte Montage der Fertigteile ist gefährdet und kann Folgegewerke verzögern.",
        phase: "Operativ / Rohbau / Terminsteuerung",
        category: "Operativ",
        area: "Rohbau / Lieferkette",
        financialImpact: 180000,
        probabilityPercent: 35,
        expectedDamage: 63000,
        likelihood: 5,
        impact: 3,
        qualitativeRiskValue: 15,
        owner: "Projektleitung Rohbau",
        measures: "Alternativlieferanten anfragen, Montagefolgen takten, Lieferstatus täglich prüfen",
        dueDate: "2026-04-09",
        status: "Maßnahme läuft",
        residualRisk: "Terminrisiko bleibt mittel"
      }
    ],
    lastResult: {
      totalExpectedDamage: 318500,
      criticalCount: 2,
      activeCount: 5,
      closedCount: 0,
      overdueCount: 1
    }
  },
  ui: {
    activeModule: "riskRegister",
    dirty: false,
    lastSavedAt: null,
    visibleModules: ["project", "riskRegister", "reports", "ai"],
    aiWorkshop: {
      activeTask: "management-report",
      freeText: "",
      selectedRiskId: "",
      busy: false,
      resultTitle: "KI bereit",
      resultText: "Wähle eine Funktion für die KI-Startstufe.",
      resultTone: "neutral",
      resultData: null
    },
    aiPanelOpenStates: {
      aiConnectionPanel: false,
      fachChatPanel: false,
      hilfeChatPanel: false
    },
    projectExportName: "Wohnbau01",
    reportExportName: "",
    reportExportFormat: "txt",
    reportMode: "risk",
    riskRegisterView: {
      search: "",
      status: "alle",
      owner: "alle",
      criticalOnly: false,
      foldAllOpen: false,
      panelOrder: ["overview", "table", "edit", "chart", "matrix", "ai"],
      visibleColumns: ["select", "category", "phase", "impact", "value", "priority", "status", "owner", "dueDate", "measures"],
      topLimit: 5,
      sortBy: "priority",
      editSortBy: "newest",
      matrixSelection: null
    },
    transferSelections: {
      riskIds: []
    },
    riskRegisterRedoStack: []
  }
};

export function cloneState() {
  return JSON.parse(JSON.stringify(initialState));
}

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater) {
    state = typeof updater === "function" ? updater(state) : updater;
    state.ui.dirty = true;
    listeners.forEach((listener) => listener(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function markSaved() {
    state = {
      ...state,
      meta: { ...state.meta, savedAt: new Date().toISOString() },
      ui: { ...state.ui, dirty: false, lastSavedAt: new Date().toISOString() }
    };
    listeners.forEach((listener) => listener(state));
  }

  return { getState, setState, subscribe, markSaved };
}
