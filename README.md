# ⚡ syslog-anomaly-ai

> **Predictive SRE & Log Telemetry Pipeline for Linux Infrastructure**

`syslog-anomaly-ai` bridges machine learning and infrastructure automation. It ingests unstructured Linux syslogs, extracts operational telemetry vectors, and uses predictive models to spot system anomalies before downtime occurs—triggering self-healing Ansible playbooks automatically.

---

## ⚡ Core Functionality

| Layer | Responsibility | Primary Tech |
| :--- | :--- | :--- |
| **Ingestion & API** | REST endpoints for log uploads and real-time evaluation | `Flask`, `Pandas`, `NumPy` |
| **Inference Engine** | Vectorizes log features and classifies anomaly risk | `Scikit-Learn` (Random Forest) |
| **Telemetry UI** | Interactive upload, live risk metrics, and prediction logs | `React 18`, `Axios` |
| **Self-Healing** | Automated host remediation upon critical anomaly flags | `Ansible` Playbooks |
| **Orchestration** | Multi-container development and K8s deployment manifests | `Docker`, `Docker Compose`, `Kubernetes` |

---

## 📂 System Architecture

```text
syslog-anomaly-ai/
├── api/
│   ├── main.py                  # API service entry point
│   ├── requirements.txt         # Core backend dependencies
│   ├── core/                    # System utilities & logger helpers
│   ├── models/                  # ML training script & serializations
│   └── services/                # Log parsing & anomaly evaluation pipelines
├── dashboard/
│   ├── package.json             # React dependencies
│   └── src/
│       ├── App.jsx              # Main dashboard wrapper
│       └── components/          # StreamIngest, TelemetryMetrics, AnomalyInspector
├── deployments/
│   ├── docker/                  # Backend & Frontend Dockerfiles
│   ├── k8s/                     # Kubernetes manifests
│   └── automation/              # Ansible playbook & inventory
├── samples/
│   └── syslogs/                 # Training logs & dataset samples
└── docker-compose.yml           # Unified stack runner
```

---

## 🚀 Execution Guide

### Option A: Launch with Docker Compose

To spin up the entire API and React UI stack concurrently:

```bash
docker-compose up --build
```
- **React Dashboard:** `http://localhost:3000`
- **Backend Service:** `http://localhost:8000`

---

### Option B: Local Microservice Setup

#### 1. Backend Ingest Engine
```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

#### 2. React Dashboard
```bash
cd dashboard
npm install
npm start
```

#### 3. Model Re-Training
To regenerate `anomaly_model.pkl` with custom datasets:
```bash
cd api
python -m models.detector
```

#### 4. Automated Host Remediation
To execute self-healing tasks across configured target servers:
```bash
ansible-playbook -i deployments/automation/inventory.ini deployments/automation/remediation_playbook.yml
```

---

## 📄 License

Distributed under the **MIT License**.
# syslog-anomaly-ai
