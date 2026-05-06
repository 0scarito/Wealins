# Wealins Investment Tracker — Chamfeuil Capital

A checklist-based tracker for managing Wealins contract procedures — preliminary steps and per-investment validation workflows.

## Project Structure

```
wealins/
├── index.html   # App HTML
├── style.css    # All styles
├── app.js       # All logic (data, render, actions)
└── README.md
```

## Running the App

Open `index.html` directly in a browser — no build step or server needed.

Data is saved automatically in `localStorage` (persists per browser).

## Features

- Add/delete Wealins contracts per client
- 4-step preliminary checklist per contract (mandat tripartite, virement, etc.)
- Per-investment checklists with 3 product types:
  - **Structuré** — 8-step workflow (Term Sheet → ISIN → éligibilité → avenant → ordre)
  - **UCITS** — 3-step workflow
  - **Alternatif** — 5-step workflow
- Progress bars at contract and investment level
- Status tracking: Non démarré / En cours / Complété
- Search and filter by status

## Dependencies (CDN)

- [Tabler Icons](https://tabler.io/icons) — icon font
