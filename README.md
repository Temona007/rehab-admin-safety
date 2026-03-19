# IRF Admission Tool

A fast, 5-minute clinical workflow checklist for inpatient rehabilitation (IRF) admissions. Reduces missed medications, consults, pressure injuries, and workflow inefficiencies.

## Features (MVP)

- **Patient intake form** – Basic demographics and admitting diagnosis
- **Structured admission checklist** – Required steps; cannot proceed until completed
- **Conditional logic** – Fields appear based on answers (allergies, meds, skin/wound)
- **Automatic task generation** – e.g., "Follow up consult", "Wound check", "PT/OT eval"
- **Risk flags** – Polypharmacy, pressure injury risk, fall risk
- **Dashboard** – Active patients with risk indicators
- **PDF summary** – Print admission summary (use browser Print → Save as PDF)

## Quick Start

1. Open `index.html` in your browser (double-click or File → Open). No server needed.
2. Click **Sign In** (credentials are pre-filled for demo).
3. View the dashboard and click a patient or **+** to start a new admission.
4. Complete the 4-step flow: Intake → Clinical → Checklist → Summary.
5. Use **Download PDF Summary** to print/save.

## Tech Stack

- HTML, CSS, JavaScript (vanilla)
- Demo data inlined in HTML (no external data files)
- `localStorage` for persistence (no backend)

## Project Structure

```
rehab-admin-safety/
├── index.html       # Login (pre-filled)
├── dashboard.html   # Active patients + demo data
├── admission.html   # 4-step admission flow + checklist data
├── css/styles.css   # Styles
├── js/admission.js  # Admission logic
└── README.md
```

## Mobile

Fully responsive. Use on tablets/phones for bedside workflow.
