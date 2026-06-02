# PHL + PNE Commercial Data Management & Analysis Dashboard

Prototype v1 of a recruiter-facing Commercial Data Management & Analysis dashboard for the Philadelphia Department of Aviation portfolio: Philadelphia International Airport (PHL) and Northeast Philadelphia Airport (PNE).

The dashboard is designed as a job-preparation and showcase artifact for the Director, Commercial Data Management & Analysis role. It uses public airport, aviation, and City sources as the evidence base, then clearly marks any non-public operating details as illustrative models of what the Director would request, govern, and operationalize after joining.

## Prototype Screenshots

### Commercial BI Cockpit

![Prototype v1 commercial BI cockpit](docs/screenshots/prototype-v1-commercial-bi-cockpit-preview.webp)

### Revenue Verticals

![Prototype v1 revenue verticals](docs/screenshots/prototype-v1-revenue-verticals-preview.webp)

### Mobile View

![Prototype v1 mobile view](docs/screenshots/prototype-v1-mobile-preview.webp)

## What The Dashboard Is

This is a Vite, React, and TypeScript prototype that translates the posted Director role into an executive BI experience. It is not a production airport system and does not claim access to private airport feeds. The first screen answers: how would this Director organize Commercial Division data into useful BI for PHL and PNE?

The dashboard includes four role-aligned views:

- **Commercial BI Cockpit**: portfolio KPIs, role-alignment map, data maturity trend, public-source insights, and a Director decision worklist.
- **Revenue Verticals**: parking, ground transportation, concessions, advertising, cargo, gates, airline schedules, PNE hangars, and development-agreement opportunity views.
- **Lease & Agreement Governance**: agreement completeness, modeled value, compliance flags, renewal/action needs, and a standardized agreement register model.
- **Data Strategy Roadmap**: source inventory, data-readiness model, Commercial staff adoption, IT/data partnership needs, AI-assisted analysis guardrails, and first-90-days execution plan.

## Data Used

Prototype v1 is public-first. Public sources establish the role context and airport operating context. Illustrative model data is used only where the job posting implies internal systems that are not publicly exposed, such as lease completeness, feed readiness, staff adoption, and internal revenue-system visibility.

| Data category | Used for | Provenance |
| --- | --- | --- |
| Director job posting | Role responsibilities, portfolio scope, BI/data-governance mandate, staff training, IT partnership, and AI exploration | Public Source |
| PHL annual reports, statistical information, and airport pages | Airport context, passenger/activity framing, and commercial portfolio narrative | Public Source |
| PNE public airport profile | Reliever-airport context, general aviation framing, tenant/hangar/ground-lease lens | Public Source |
| City open contract data | Public procurement and agreement-discovery starting point | Public Source |
| FAA passenger/cargo data and BTS on-time data | Passenger, cargo, schedule, reliability, and aviation-activity context | Public Source |
| Revenue vertical visibility, agreement completeness, internal feed readiness, and BI adoption | Candidate model of what the Director would request and govern internally | Illustrative Model |
| Public observations converted into business questions and recommendations | Inference layer connecting public evidence to strategic action | Derived From Public |

Public anchors are linked in the app footer:

- [Director job posting](https://jobs.smartrecruiters.com/CityofPhiladelphia/744000124935537--director-commercial-data-management-analysis-department-of-aviation-)
- [PHL Annual Reports](https://www.phl.org/business/reports/annual-report)
- [PHL Statistical Information](https://www.phl.org/business/investor-information/statistical-information)
- [PHL + PNE About Us](https://www.phl.org/about/about-us)
- [Northeast Philadelphia Airport](https://www.phl.org/PNE)
- [City Open Contract Data](https://www.phila.gov/contracts/data/)
- [BTS On-Time Statistics](https://www.transtats.bts.gov/ONTIME/)
- [FAA Passenger and Cargo Data](https://www.faa.gov/airports/planning_capacity/passenger_allcargo_stats/passenger)

## Strategic Story

The story of the dashboard is that the Commercial Director role is not simply about producing charts. It is about building a repeatable BI operating model for Commercial leadership.

Prototype v1 surfaces that story in a few ways:

- **Public evidence becomes a data strategy**: public airport reports, FAA/BTS data, City contracts, and public PHL/PNE pages are connected to business questions and internal data requests.
- **Commercial revenue becomes a portfolio**: parking, ground transportation, concessions, advertising, cargo, gates, airline schedules, PNE hangars, ground leases, and development agreements are shown as distinct verticals with different data needs.
- **Lease and agreement hygiene becomes executive work**: agreement records are modeled around tenant/vendor, value, expiration, completeness, compliance flags, and recommended action.
- **PNE receives its own commercial asset lens**: PNE is framed around general aviation, hangars, ground leases, development agreements, and tenant portfolio visibility.
- **Dashboard adoption is part of the job**: the roadmap includes staff training, IT partnership, source ownership, refresh cadence, and AI-assisted analysis guardrails.

The intended recruiter-facing question is: can this candidate use public information to understand the role, structure the Commercial Division data problem, and propose a practical BI roadmap?

## How It Was Built

- **Frontend**: Vite + React + TypeScript
- **Charts**: Recharts
- **Icons**: lucide-react
- **Data**: typed local fixtures in `src/data/dashboardData.ts`
- **Design approach**: responsive executive dashboard, compact hierarchy, clear filters, restrained status colors, and explicit provenance labels

Core files:

- `src/App.tsx`: dashboard layout, filtering, charts, and role-aligned view composition.
- `src/data/dashboardData.ts`: typed public-first prototype data, role alignment, commercial verticals, agreement records, insights, and roadmap items.
- `src/types/dashboard.ts`: shared TypeScript interfaces for commercial BI, agreements, data assets, and roadmap items.
- `src/styles.css`: responsive dashboard styling.

## Run Locally

```bash
pnpm install
pnpm dev
```

Then open:

```text
http://127.0.0.1:5173
```

Production build:

```bash
pnpm build
```

## Prototype Status

This is prototype v1. It is not a production BI deployment and does not connect to live airport, parking, lease, contract, concessions, gate, cargo, or aviation systems. Internal operational metrics are intentionally marked as illustrative models until real feeds are available.

## Changelog

### v1 - Role-aligned Commercial Data Management showcase

Added:

- Role-specific dashboard framing for the Director, Commercial Data Management & Analysis posting.
- New views for Commercial BI Cockpit, Revenue Verticals, Lease & Agreement Governance, and Data Strategy Roadmap.
- Public-first provenance labels: `Public Source`, `Illustrative Model`, and `Derived From Public`.
- Role-alignment panel mapping dashboard modules to posted job responsibilities.
- Public information story cards connecting public observations to internal data requests and executive recommendations.
- Commercial vertical model covering parking, ground transportation, concessions, advertising, property development, leases, cargo, gates, airline schedules, aviation activity, and PNE assets.
- Agreement governance model with completeness, compliance flags, value, expiration, and recommended action.
- First-90-days data strategy roadmap, data asset inventory, staff adoption items, IT partnership needs, and AI-assisted analysis guardrails.

Changed:

- Repositioned the app from an airport operations control-room dashboard to a recruiter-facing Commercial Division BI showcase.
- Shifted KPIs away from ground-ops SLA and toward data readiness, commercial portfolio scope, agreement completeness, public-source confidence, revenue opportunity, and BI adoption.
- Reframed PHL/PNE filters around commercial strategy rather than daily operational exceptions.
- Updated README story, data model explanation, and strategic insights.

Removed:

- Primary `Ground Operations` tab.
- Ground-ops-first SLA, staffing, delay, and ramp exception framing as the main dashboard narrative.
- `Sample Internal` and `Derived` provenance labels in favor of clearer public-first terminology.

### v0 - Commercial operations executive prototype

- Initial Vite + React + TypeScript dashboard for PHL/PNE commercial operations.
- Included executive cockpit, ground operations, parking/commercial, and contract/action views.
- Added local fixtures, public source links, screenshots, and GitHub showcase README.

## Recommended Next Steps

- Replace illustrative lease and agreement records with real commercial agreement data if access is available.
- Connect parking, concessions, ground transportation, cargo, gate, schedule, and PNE asset feeds.
- Add a source-quality scoring workflow with accountable data owners.
- Add portfolio drilldowns for PHL and PNE leadership audiences.
- Add role-specific interview prep notes or a companion deck that explains the dashboard story.
