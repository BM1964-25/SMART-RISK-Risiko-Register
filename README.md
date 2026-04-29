# Risiko Register Arbeitsstruktur

Dieses Projekt ist die eigenständige Auskopplung des Risikoregisters.

## GitHub-Links

- Landingpage: `https://BM1964-25.github.io/Risikoregister/shell/landing.html`
- Anwendung: `https://BM1964-25.github.io/Risikoregister/`

## Ordner

- `shell/`
  Für Landingpage, Login, Dashboard, App-Übergang und gemeinsame Shell-Dateien.
  Das ist ab jetzt die Arbeitskopie der Hülle.

- `app/`
  Für die eigentliche Fachanwendung des Risiko Registers.
  Das ist die Arbeitskopie der Anwendung; aktuell noch aus `platform/` gespiegelt.

- `integrations/`
  Für Supabase, Stripe, Redirects und andere technische Schnittstellen.

- `backups/`
  Für vollständige Sicherungen von Zwischenständen.

- `exports/`
  Für erzeugte Berichte, PDF-/Word-Exporte und andere Ausgabedateien.

- `snapshots/`
  Für technische Zwischenstände oder Referenzstände vor größeren Änderungen.

- `platform/`
  Enthält die laufende Anwendung mit Oberfläche, Modulen und Logik.

- `landing.html`
  Öffentliche Einstiegsseite als Weiterleitung auf `shell/landing.html`.

- `auth-portal.html`
  Login- und Registrierungsseite als Weiterleitung auf `shell/auth-portal.html`.

- `dashboard.html`
  Uebersichtsseite nach dem Login, Weiterleitung auf `shell/dashboard.html`.

- `app-page.html`
  Startseite fuer den Uebergang in die bestehende Risiko-Register-Anwendung, Weiterleitung auf `shell/app-page.html`.

- `site-shell.css`
  Gemeinsame Layout- und Designbasis fuer die neue Huelle, lädt die Shell-Styles.

## Empfehlung

- Die Arbeitskopie der Hülle liegt in `shell/`.
- Die Arbeitskopie der Anwendung liegt in `app/` und wird derzeit noch aus `platform/` gespiegelt.
- Auf GitHub Pages zeigt der direkte Landingpage-Link auf `shell/landing.html`.
- Der Root-Link zeigt die Anwendung im Repository-Hauptpfad.
- Zwischenstände immer mit Datum und kurzer Bezeichnung ablegen.
- `snapshots/` für schnelle Referenzstände.
- `backups/` für vollständige Archiv-Sicherungen.
- Exporte nicht mit Quellcode vermischen.
- Die Fachanwendung getrennt von Landingpage und Auth-Huelle halten.
- Die bestehenden Dateien bleiben vorerst an ihrem Platz, bis wir sie gezielt umziehen.
- Die Root-Dateien sind jetzt nur noch Kompatibilitäts-Einstiege; die Pflege erfolgt in `shell/`.
- Archivstände wie `index-v399.html` und `index-v401.html` bleiben nur noch als Referenz.
- Alle neuen Zwischenstände zuerst in `snapshots/` sichern und wichtige Meilensteine zusätzlich in `backups/`.
- Die bisherigen Root-Dateien bleiben als Live-Links kompatibel, bis wir sie bewusst auf die neuen Pfade umstellen.

## Beispielnamen

- `2026-04-13_risiko-register_backup.zip`
- `2026-04-13_risiko-register_report.json`
- `2026-04-13_snapshot_before_register_change/`
