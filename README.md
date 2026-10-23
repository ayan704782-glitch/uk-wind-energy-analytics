# ⚡ Gridbricks — UK Wind Energy Analytics Terminal

An enterprise-grade, full-stack telemetry dashboard built with **FastAPI (Python)** and **React (Vite)**. It processes and visualizes Day-Ahead Actual Renewable Wind Generation against BMRS Forecasted load across half-hourly settlement periods (January 2026).

---

## 🚀 Key Enterprise Features

* **Real-Time Telemetry Architecture:** Connects to the Elexon BMRS (`FUELHH`) API stream with intelligent automatic fallback to verified January 2026 settlement records.
* **Executive KPI Engine:** Instant calculation of **Peak Wind Output (MW)**, **Average Generation**, **Day-Ahead Forecast Accuracy (%)**, and **Net Grid Balance**.
* **Interactive Time-Series Matrix:** Filter settlement periods dynamically by `ALL`, `SURPLUS`, or `DEFICIT` statuses.
* **Visual Telemetry Curve:** Dual-bar comparative load distribution mapping Actual vs. Forecasted megawatt output per 30-minute interval[cite: 25, 26].
* **One-Click CSV Reporting:** Export live filtered telemetry matrices directly to `.csv` for offline financial and grid auditing[cite: 24].
* **Zero-Artifact Dark UI:** Custom-engineered responsive Bloomberg-style dark interface with sleek scrollbars and full viewport adaptability[cite: 27, 28].

---

## 🛠️ Tech Stack

* **Backend:** Python 3.11+, FastAPI, Uvicorn, Requests, CORS Middleware
* **Frontend:** React 18, Vite, CSS3 Grid/Flexbox Architecture
* **Data Source:** Elexon BMRS API (`FUELHH` Wind Stream)[cite: 24]
* **Containerization:** Docker

---

## ⚙️ Local Setup & Installation Guide

### 1. Start the FastAPI Backend
Open a terminal in the project root directory and run:

```bash
cd backend
python -m venv venv
# Activate virtual environment (Windows):
venv\Scripts\activate
# Install dependencies:
pip install -r requirements.txt
# Run server:
uvicorn main:app --reload --port 8000