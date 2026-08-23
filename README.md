# ⚡ Syslog Anomaly AI

> **AI Linux Observability Pipeline & Predictive Telemetry**

**Syslog Anomaly AI** vectorizes Linux syslog streams to predict system failures before downtime occurs. It combines a Scikit-Learn inference engine with a Flask REST API and Server-Sent Events (SSE) stream, delivering real-time telemetry metrics and risk scores directly to a modern React dashboard.

---

## ⚡ Tech Stack & Overview

- **Stack:** Python, Scikit-Learn, Flask, React.js, Linux
- **Vectorized Observability:** Ingests raw syslog streams and extracts key operational vectors (`[errors, cpu, disk]`).
- **Scikit-Learn Inference:** Evaluates failure probabilities using trained Random Forest decision trees (`predict_proba()`) to generate continuous risk scores ($0.0\%$ to $100.0\%$).
- **Live SSE Stream:** Broadcasts real-time system metrics and risk assessments over Server-Sent Events.
- **Interactive React UI:** Real-time sparkline telemetry waveforms, immediate anomaly injection testing, file batch analysis, and an incident audit log.

---

## ⚡ Core Functionality

| Layer | Responsibility | Primary Tech |
| :--- | :--- | :--- |
| **Linux Vectorizer & Ingest** | Extracts error patterns, CPU pressure, and disk latency from syslogs | `Python`, `Flask` |
| **Inference Engine** | Scikit-Learn model calculating continuous failure risk scores | `Scikit-Learn` (Random Forest) |
| **Streaming API** | Server-Sent Events (SSE) real-time metric transport & REST endpoints | `Flask`, `EventSource` |
| **Dashboard UI** | Live risk gauge, metric sparklines, batch upload & anomaly inspector | `React 18`, `Lucide Icons` |

---

## 📂 System Architecture

```text
syslog-anomaly-ai/
├── api/
│   ├── main.py                  # Flask API, SSE stream & static SPA server
│   ├── requirements.txt         # Python dependencies (Flask, Scikit-Learn, Gunicorn)
│   ├── models/                  # Scikit-Learn model & training routines
│   └── services/                # Syslog parser & feature vectorization
├── src/
│   ├── App.jsx                  # Main application component
│   ├── components/              # LiveTelemetryStream, StreamIngest, AnomalyInspector
│   └── styles/                  # Clean high-contrast dark dashboard theme
├── samples/                     # Sample baseline and critical syslog files
├── server.ts                    # Node/Express development gateway (for dev environment)
└── package.json                 # Node dependencies & build scripts
```

---

## 💻 Local Development

### 1. Unified Dev Mode
```bash
npm install
pip install -r api/requirements.txt
npm run dev
```
The application will launch on `http://localhost:3000`.

### 2. Standalone Production Mode (Pure Python)
```bash
npm run build
pip install -r api/requirements.txt
python api/main.py
```
Open `http://localhost:5000` (Flask will serve both the React frontend and the Scikit-Learn API).

---

## 🔒 License

Personal Project. All rights reserved.
