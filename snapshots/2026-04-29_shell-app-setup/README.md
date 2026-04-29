# Risiko Register Arbeitsstruktur

Dieses Projekt ist die eigenständige Auskopplung des Risikoregisters.

## Ordner

- `shell/`
  Für Landingpage, Login, Dashboard, App-Übergang und gemeinsame Shell-Dateien.

- `app/`
  Für die eigentliche Fachanwendung des Risiko Registers.

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
  Öffentliche Einstiegsseite im Stil der PERT-Huelle.

- `auth-portal.html`
  Login- und Registrierungsseite als Shell fuer Supabase.

- `dashboard.html`
  Uebersichtsseite nach dem Login.

- `app-page.html`
  Startseite fuer den Uebergang in die bestehende Risiko-Register-Anwendung.

- `site-shell.css`
  Gemeinsame Layout- und Designbasis fuer die neue Huelle.

## Empfehlung

- Zwischenstände immer mit Datum und kurzer Bezeichnung ablegen.
- `snapshots/` für schnelle Referenzstände.
- `backups/` für vollständige Archiv-Sicherungen.
- Exporte nicht mit Quellcode vermischen.
- Die Fachanwendung getrennt von Landingpage und Auth-Huelle halten.
- Die bestehenden Dateien bleiben vorerst an ihrem Platz, bis wir sie gezielt umziehen.
- Archivstände wie `index-v399.html` und `index-v401.html` bleiben nur noch als Referenz.
- Alle neuen Zwischenstände zuerst in `snapshots/` sichern und wichtige Meilensteine zusätzlich in `backups/`.

## Beispielnamen

- `2026-04-13_risiko-register_backup.zip`
- `2026-04-13_risiko-register_report.json`
- `2026-04-13_snapshot_before_register_change/`
