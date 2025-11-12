# Umsatz Support Tool

Ein Support-Tool zur Verwaltung von Bank-Mappings für das Projekt [umsatz-anonymizer](https://github.com/aidev311936/umsatz-anonymizer). Das Tool besteht aus einem Vue 3 Frontend und einem Node.js/Express Backend, die gemeinsam CSV-Exporte unterschiedlicher Banken analysieren und passende Mapping-Konfigurationen in einer Postgres-Datenbank speichern.

## Projektstruktur

```
.
├── backend/     # Express API für Bank-Mappings, CSV-Analyse und KI-Vorschläge
├── frontend/    # Vue 3/Tailwind UI zur Pflege und Suche der Bank-Mappings
├── package.json # Yarn Workspaces Konfiguration
└── README.md
```

## Voraussetzungen

- Node.js 20+
- Yarn 1.x (Classic) oder neuer (Workspaces aktiviert)
- Postgres Datenbank mit der Tabelle `bank_mapping`

## Installation

```bash
yarn install
```

Damit werden die Abhängigkeiten für Frontend und Backend installiert.

## Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `DATABASE_URL` | Connection String zur Postgres-Datenbank. |
| `DB_SSL` | `true`, wenn eine SSL-Verbindung zur DB aufgebaut werden soll (empfohlen für Render). |
| `PGSSLMODE` | Wert für den `sslmode`-Parameter (z. B. `require`), wird automatisch an die `DATABASE_URL` angehängt. |
| `SUPPORT_TOKEN` | Token, das bei allen API-Requests im Header `x-support-token` mitgeschickt werden muss. |
| `OPENAI_API_KEY` | API Key für den OpenAI-Endpunkt (für KI-Vorschläge). |
| `OPENAI_ASSISTANT_ID` | ID des vorhandenen OpenAI-Assistants. |
| `OPENAI_MODEL` | Modellname, der für die OpenAI Responses API verwendet werden soll. |
| `CORS_ORIGIN` | Kommagetrennte Liste erlaubter Origins für das Backend (z. B. `http://localhost:5173`). |
| `PORT` | Port, auf dem das Backend lauscht (Standard: `4000`). |
| `VITE_API_BASE_URL` | (Optional) Basis-URL für das Frontend, wenn eine andere API als `/api` angesprochen werden soll. |

Ein Beispiel finden Sie in `backend/.env.example`.

## Entwicklung

### Backend

```bash
cd backend
yarn start
```

Der Befehl startet das Express Backend (Produktivmodus). Für die lokale Entwicklung steht auch `yarn dev` (mit automatischem Reload durch `nodemon`) zur Verfügung.

### Frontend

```bash
cd frontend
yarn dev
```

Das Frontend läuft standardmäßig auf `http://localhost:5173` und proxyt API-Aufrufe nach `http://localhost:4000`.

## Build & Deployment

### Frontend Build

```bash
cd frontend
yarn build
```

Der Produktionsbuild liegt anschließend im Ordner `dist/`.

### Backend Start (Produktion)

```bash
cd backend
node src/server.js
```

Auf render.com können Frontend und Backend separat deployt werden:

- **Backend:** Node Service mit Startkommando `yarn start`, Environment Variablen wie oben beschrieben.
- **Frontend:** Static Site mit Build Kommando `yarn build` und Publish Directory `dist`. Stellen Sie `VITE_API_BASE_URL` so ein, dass das Backend erreichbar ist.

## API-Überblick

| Methode & Pfad | Beschreibung |
| --- | --- |
| `GET /api/bank-mappings` | Liste aller Bank-Mappings (optional `?search=`). |
| `GET /api/bank-mappings/:id` | Detail eines Bank-Mappings. |
| `POST /api/bank-mappings` | Neues Mapping anlegen. |
| `PUT /api/bank-mappings/:id` | Bestehendes Mapping aktualisieren. |
| `POST /api/bank-mappings/analyze` | CSV-Datei hochladen, um Struktur und Hinweise zu ermitteln. |
| `POST /api/bank-mappings/suggest` | CSV analysieren und über den OpenAI-Assistenten einen Vorschlag abrufen. |

Alle Endpunkte (außer `/healthz`) erfordern das Support-Token.

## CSV-Analyse

Die Analyse liefert unter anderem folgende Informationen, um beim Ausfüllen des Formulars zu helfen:

- `without_header`: Gibt an, ob vermutlich keine Kopfzeile vorhanden ist.
- `column_markers`: Typ pro Spalte (Date, Number, Text, Empty) für CSVs ohne Header.
- `header_signature`: Vollständige Kopfzeile für CSVs mit Header.
- `booking_date_parse_format`: Erkanntes Datumsformat.

Auf Basis dieser Informationen lassen sich zügig Mappings für `booking_date`, `booking_text`, `booking_type` und `amount` erstellen.

## Authentifizierung

Das Frontend speichert das Support-Token im `localStorage` und überträgt es bei jedem Request. Sollte später eine Nutzerverwaltung mit Rollen (`user_token.role`) ergänzt werden, können die Token hier erweitert werden.

## Weiterentwicklung

- Zusätzliche Validierungen für eingereichte Mappings (z. B. Pflichtfelder).
- Erweiterte CSV-Analyse (z. B. automatische Delimiter-Erkennung, Vorschau mehrerer Formate).
- Anzeigen von Änderungsverlauf und Audit-Logs.

Viel Erfolg beim Ausbau des Tools!
