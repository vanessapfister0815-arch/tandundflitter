# Tand & Flitter

Plattformübergreifendes Resale- und Abrechnungssystem. Vanilla JS, ES-Module, Supabase, Vercel.

## Setup

1. `config.js` öffnen und `SUPABASE_ANON_KEY` eintragen.
2. Repository auf GitHub pushen.
3. Vercel-Projekt mit dem Repository verbinden — kein Build-Command nötig, Output Directory = `.` (Root).

## Struktur

```
tand-flitter/
├── index.html          — Einstiegspunkt
├── config.js           — Supabase-Credentials + Konstanten
├── app.js              — Auth-Gate + Router
├── core/
│   ├── auth.js         — Session, Login, Logout
│   ├── supabase.js     — Client + Query-Wrapper
│   └── helpers.js      — Formatierung, Utilities
├── components/
│   ├── layout.js       — App-Shell, Nav
│   └── shared.js       — KPI-Karten, Badges, Tabellen-Helfer
├── pages/
│   ├── login.js
│   ├── dashboard.js
│   ├── inventory.js
│   ├── sales.js
│   ├── payouts.js
│   ├── customers.js
│   └── accounting.js
└── styles/
    ├── base.css        — Custom Properties, Reset, Typografie
    ├── components.css  — Neumorphic-Komponenten
    ├── layout.css      — Nav, Grid, Seitenstruktur
    └── mobile.css      — Desktop-Overrides ab 640px
```

## Architektur

Vollständige Dokumentation: `ARCHITEKTUR.md`

## Regeln

- Kein Build-Step, kein Node.js lokal erforderlich
- 800 Zeilen Hard Limit pro Datei
- Keine Window-Globals — ES-Module mit expliziten Imports
- STORED GENERATED Spalten werden vom Frontend niemals geschrieben
- Alle Aggregate laufen über RPCs, nicht über Client-seitige Zählung
