# GreenGrid AI

> **AI climate resilience planner for growing cities.**

GreenGrid AI helps cities test sustainable infrastructure plans that improve green space, transit access, walkability, heat resilience, and emissions. It analyzes urban heat islands, green-space gaps, and transit deserts, then generates an AI-recommended climate-resilient infrastructure plan and visualizes the before-and-after impact on environmental metrics.

**Hackathon target:** Tech to Treasure Environmental Hackathon

---

## Demo Flow

1. **Landing screen** — Brief overview of GreenGrid AI and the demo city, **Fremon, CA** (213,000 residents, +35% growth projected).
2. **Analyze** — The AI Copilot scans Fremon's satellite heat signatures, green coverage, and transit access. Heat-risk zones (red/orange/yellow polygons) appear over the map:
   - **Central Heat Island** (downtown core)
   - **West Congestion Emissions Zone**
   - **North Transit Access Gap**
   - **New Housing Green Space Gap**
3. **AI Plan** — The Copilot generates a 6-element climate-resilient infrastructure plan:
   - 🌳 **Central Green Corridor** (headline recommendation)
   - 🚊 North Transit Hub
   - 🚌 West Congestion Relief Transit Stop
   - 🏘️ New Housing Expansion Community Center
   - 🏥 South Emergency Gap Clinic
   - 🏫 East Education District School
4. **Apply AI Plan** — One click and the map transforms: heat zones fade, a green corridor appears downtown, and color-coded coverage rings (green for parks, purple for transit, red for emergency, blue for education) expand across the city.
5. **Environmental metrics update** — All 8 environmental metrics animate to their new values (e.g., Climate Resilience 52 → 81, CO₂ Estimate 100 → 84, Green Space 52 → 74).
6. **Environmental Impact Report** — Full multi-section report with executive summary, climate risks, AI plan, before/after table, cost, residents benefited, assumptions, and next steps.

### Pitch summary

> GreenGrid AI analyzed Fremon under 35% projected growth, detected heat, green space, and transit gaps, then generated a climate-resilient infrastructure plan that improves Climate Resilience from **52 to 81** and serves **74,000 residents**.

---

## Setup Instructions

```bash
git clone <this-repo>
cd greengrid-ai
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

The app runs entirely in the browser — no backend, API keys, or external services required for the demo. The map uses [OpenFreeMap](https://openfreemap.org/) tiles, which are free and tokenless.

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite 5** — dev server and build
- **MapLibre GL** — interactive map (no Mapbox token required; uses OpenFreeMap tiles)
- **Framer Motion** — animations for panels, metric counters, and map transitions
- **Tailwind CSS** — utility styling alongside inline styles
- **Lucide React** — icons
- **Zustand** — state (carried over from the base; the demo page is self-contained)

---

## Environmental Metrics Tracked

| Metric                   | Before | After |
| :----------------------- | -----: | ----: |
| Climate Resilience Score |     52 |    81 |
| Green Space Access       |    52% |   74% |
| CO₂ Estimate             |    100 |    84 |
| Transit Coverage         |    48% |   72% |
| Heat Risk                |     74 |    49 |
| Walkability              |     56 |    76 |
| Tree Canopy Access       |    38% |   61% |
| 15-Minute City Score     |     54 |    79 |

---

## Project Structure

```
greengrid-ai/
├── frontend/                              # Vite + React app
│   ├── src/
│   │   ├── App.tsx                        # Entrypoint (landing → demo)
│   │   ├── components/
│   │   │   ├── UI/LandingScreen.tsx       # GreenGrid-branded landing
│   │   │   └── Demo/
│   │   │       └── GreenGridDemoPage.tsx  # Full demo: map + copilot + metrics + report
│   │   └── ...                            # Stores, utils, types from the base project
│   ├── index.html
│   └── package.json
├── package.json                           # Root proxy (npm install / npm run dev)
└── README.md
```

The core demo lives in **`frontend/src/components/Demo/GreenGridDemoPage.tsx`**. It owns the map, the AI Copilot panel, the environmental metrics panel, and the report modal — all in one self-contained component.

---

## Submission Summary

GreenGrid AI is a sustainable city planning simulator built for the **Tech to Treasure Environmental Hackathon**. It demonstrates how AI can help growing cities reduce heat, improve green space, increase transit access, and lower emissions.

Using a fictional Central Valley city (Fremon, CA) under +35% growth pressure, it identifies four climate-risk zones and generates a six-element infrastructure plan, then visualizes the measurable environmental impact: Climate Resilience improves from 52 to 81 and 74,000 residents gain improved green and service access.

The core innovation is the **before/after map transformation**: red heat zones visibly fade as the AI plan's green corridor and color-coded coverage rings appear, making the climate impact of urban planning decisions immediately legible to non-technical stakeholders.
