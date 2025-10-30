# Bank Mapping Tool

Vollständiges Full-Stack-Projekt zur automatischen Erkennung von Bank-Mappings aus CSV-Umsätzen mit einer Vue 3 Oberfläche und einem Express Backend. Die Lösung ist für den Betrieb auf [Render.com](https://render.com) optimiert und nutzt eine bestehende Postgres-Tabelle `banking_mappings` zur Speicherung.

## Projektüberblick

- **Frontend**: Vue 3 (Composition API) + Vite + TypeScript + Tailwind CSS + SASS
- **Backend**: Node.js + Express + TypeScript
- **Datenbank**: PostgreSQL (Tabelle `banking_mappings` wird vorausgesetzt)
- **KI-Integration**: OpenAI Assistants API (bestehender Assistant über `OPENAI_ASSISTANT_ID`)
- **Deployment**: Render.com ohne Docker (siehe `render.yaml`)

## Projektstruktur

```
bank-mapping-tool/
├─ frontend/            # Vue 3 Anwendung
├─ backend/             # Express API
├─ shared/              # Geteilte Typdefinitionen (TypeScript)
├─ render.yaml          # Render.com Konfiguration
├─ .env.example         # Environment-Variablen Vorlage
└─ README.md
```

## Lokales Setup

### Voraussetzungen

- Node.js ≥ 18
- Zugriff auf eine Postgres-Datenbank mit Tabelle `banking_mappings`
- OpenAI API Key und Assistant ID

### Environment konfigurieren

Kopiere `.env.example` und passe Werte an:

```bash
cp .env.example .env
```

Die Variablen `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID` und `DATABASE_URL` sind Pflicht. Für das lokale Frontend muss `VITE_API_BASE` auf die Backend-URL zeigen (z. B. `http://localhost:8080`).

### Backend installieren & starten

```bash
cd backend
npm install
npm run dev
```

Der Entwicklungsserver lauscht standardmäßig auf Port `8080` und stellt die REST-API unter `/api` bereit.

### Frontend installieren & starten

```bash
cd frontend
npm install
npm run dev
```

Das Frontend läuft auf Port `5173` und proxied API-Aufrufe automatisch zum Backend (abhängig von `VITE_API_BASE`).

## API Referenz

### GET `/api/mappings`

Gibt alle gespeicherten Bank-Mappings zurück.

```bash
curl http://localhost:8080/api/mappings
```

### POST `/api/mappings`

Speichert oder aktualisiert ein Mapping über `bank_name` (UPSERT).

```bash
curl -X POST http://localhost:8080/api/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "bank_name": "Musterbank",
    "booking_date": ["Datum"],
    "amount": ["Betrag"],
    "booking_text": ["Verwendungszweck"],
    "booking_type": [],
    "booking_date_parse_format": "dd.MM.yyyy",
    "without_header": false,
    "detection_hints": {}
  }'
```

### POST `/api/ai/detect`

Fordert die KI auf, ein Mapping aus einem CSV-Sample abzuleiten. Der Request enthält das CSV im Rohformat.

```bash
curl -X POST http://localhost:8080/api/ai/detect \
  -H "Content-Type: application/json" \
  -d '{
    "csv": "Datum;Betrag;Verwendungszweck\n2024-06-01;42,00;Beispiel",
    "userBankGuess": "Beispielbank"
  }'
```

Die Antwort entspricht dem Schema:

```json
{
  "booking_date": ["Datum"],
  "amount": ["Betrag"],
  "booking_text": ["Verwendungszweck"],
  "booking_type": [],
  "booking_date_parse_format": "dd.MM.yyyy",
  "without_header": false,
  "detection_hints": {}
}
```

## KI-Integration

- Das Backend erzeugt für jeden Erkennungs-Request einen neuen Thread über die OpenAI Assistants API.
- Die Anfrage enthält das CSV-Sample (max. 500 Zeilen oder 64 KB), heuristische Sniffer-Daten und Referenzbeispiele.
- Der Assistant wird über `OPENAI_ASSISTANT_ID` identifiziert; es wird **kein** zusätzlicher System-Prompt gesendet.
- Die Antwort wird strikt als JSON erwartet und serverseitig validiert.

## Sicherheit & Robustheit

- Rate Limiting (60 Requests/Minute) und Request-Body-Limit (5 MB)
- Konsistentes Request-Logging inkl. korrelierter Request-IDs
- Einheitliche JSON-Fehlerantworten via zentralem Error-Handler
- CORS ist auf `CORS_ORIGIN` beschränkt

## Deployment auf Render.com

1. Repository nach GitHub pushen.
2. In Render zwei Services anlegen:
   - **Backend**: Web Service (Node) → `render.yaml` liefert Build-/Start-Kommandos.
   - **Frontend**: Static Site → Build mit Vite, Publish-Path `frontend/dist`.
3. Postgres-Instanz als Managed Database anlegen und `DATABASE_URL` im Backend-Service setzen.
4. Environment-Variablen (`OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`, `CORS_ORIGIN`, `VITE_API_BASE`) gemäß Umgebung hinterlegen.

## Tests & Validierung

- `npm run build` für Backend/Frontend erstellt produktionsfertige Artefakte.
- Die Beispiel-CSV aus der README funktioniert als Smoke-Test für `/api/ai/detect`.

## Lizenz

MIT Lizenz (kann nach Bedarf angepasst werden).
