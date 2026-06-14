# PHL + PNE Commercial Data Management & Analysis Dashboard

Interview resource mapped to the City of Philadelphia `Director, Commercial Data Management & Analysis - Department of Aviation` posting for Philadelphia International Airport (PHL) and Northeast Philadelphia Airport (PNE).

This is a public-source commercial analytics prototype. It uses the posting as the capability framework, uses public PHL/PNE, City, FAA, and BTS sources as evidence, and labels non-public operating details as illustrative models of the internal data that would need to be requested, governed, and operationalized.

## Prototype Screenshots

### Commercial BI Cockpit

![Prototype v1 commercial BI cockpit](docs/screenshots/prototype-v1-commercial-bi-cockpit-preview.webp)

### Revenue Verticals

![Prototype v1 revenue verticals](docs/screenshots/prototype-v1-revenue-verticals-preview.webp)

### Mobile View

![Prototype v1 mobile view](docs/screenshots/prototype-v1-mobile-preview.webp)

## What This Demonstrates

- Commercial BI design for a two-airport portfolio covering PHL and PNE.
- Public-data research translated into executive metrics, evidence chains, and action lists.
- Data governance thinking for lease/agreement hygiene, source ownership, refresh cadence, quality status, and access status.
- Portfolio analytics across parking, ground transportation, concessions, advertising, property development, terminal leases, ground leases, air cargo, gates, airline schedules, and aviation activity.
- Stakeholder enablement through a first-90-days roadmap, training/adoption items, and IT/ETL partnership backlog.
- Responsible AI framing where AI-assisted analysis supports summarization and anomaly prompts without replacing source validation.

## How This Maps To The Posting

The posting is used as the explicit capability framework, not as the product identity. The dashboard turns the posting's responsibilities into working modules:

| Posting capability | Dashboard implementation |
| --- | --- |
| Business intelligence and analytics | Commercial BI cockpit with KPIs, risk map, trend model, source library, and decision worklist |
| Dashboards and reporting tools | Four-tab executive BI prototype with consistent airport, period, and severity filters |
| Strategic recommendations and operational improvements | Evidence-chain cards connecting public facts to business questions, internal data requests, and recommended action |
| Lease/agreement storage, retrieval, expirations, compliance, and tenant reporting | Agreement governance model with completeness, value, expiration, compliance flag, and action fields |
| Staff training and tool adoption | Adoption workstream and first-90-days roadmap |
| ETL/data warehouse partnership with IT | Data asset readiness model separating public anchors from internal feeds needed |
| Cross-departmental data governance | Source-owner, cadence, quality, access, and commercial-use-case fields |
| AI-assisted analysis exploration | Governed AI guardrail roadmap item |

## How Public Data Becomes Commercial BI

The app uses a repeatable evidence chain:

`Posting requirement -> Public source fact -> Commercial analytics question -> Internal data needed -> Dashboard/reporting artifact -> Decision or operational improvement supported`

Example: PHL public facts show more than 30M 2025 passengers, 126 gates, 16,126 parking spaces, 449,761 square feet of cargo space, 28 carriers, 134 nonstop destinations, January 2026 passenger/cargo/activity figures, and a $1.8B PHL/PNE capital program. The dashboard converts those facts into commercial questions about parking yield, concessions coverage, advertising inventory, cargo facility use, gate/schedule utilization, and data pipeline priorities.

PNE is treated as a distinct commercial asset portfolio. Public sources describe PNE as Pennsylvania's third busiest airport with on-call Customs, Immigration, and USDA services and approximately 215 based aircraft; PHL Fast Facts also lists PNE hangar inventory, January 2026 movements, and active capital projects. The dashboard translates that into hangar, tenant, ground lease, and development-agreement governance needs.

## Data Used

| Data category | Used for | Provenance |
| --- | --- | --- |
| City of Philadelphia posting | Capability framework for Commercial BI, data governance, agreements, adoption, IT partnership, and AI-assisted analysis | Public Source |
| PHL annual reports, Fast Facts, statistical information, and airport pages | Passenger/activity context, gates, parking, cargo, carrier/destination, capital program, and commercial portfolio narrative | Public Source |
| PNE public airport profile and Fast Facts | Reliever-airport context, based-aircraft context, hangar inventory, tenant/hangar/ground-lease lens | Public Source |
| City open contract data | Public procurement and agreement-discovery starting point | Public Source |
| FAA passenger/cargo data and BTS on-time data | Passenger, cargo, schedule, reliability, and aviation-activity context | Public Source |
| Revenue vertical visibility, agreement completeness, internal feed readiness, and BI adoption | Illustrative model of internal commercial data to request and govern | Illustrative Model |
| Public observations converted into business questions and recommendations | Inference layer connecting public evidence to strategic action | Derived From Public |

Public anchors are linked in the app footer:

- [City of Philadelphia posting](https://jobs.smartrecruiters.com/CityofPhiladelphia/744000124935537--director-commercial-data-management-analysis-department-of-aviation-)
- [PHL Annual Reports](https://www.phl.org/business/reports/annual-report)
- [PHL Fast Facts](https://www.phl.org/about/news/fast-facts)
- [PHL Statistical Information](https://www.phl.org/business/investor-information/statistical-information)
- [PHL + PNE About Us](https://www.phl.org/about/about-us)
- [Northeast Philadelphia Airport](https://www.phl.org/PNE)
- [City Open Contract Data](https://www.phila.gov/contracts/data/)
- [BTS On-Time Statistics](https://www.transtats.bts.gov/ONTIME/)
- [FAA Passenger and Cargo Data](https://www.faa.gov/airports/planning_capacity/passenger_allcargo_stats/passenger)

## Capability Map

The dashboard is organized around four views:

- **Commercial BI Cockpit**: portfolio KPIs, role capability map, data maturity trend, evidence chains, and commercial decision worklist.
- **Revenue Verticals**: parking, ground transportation, concessions, advertising, cargo, gate utilization, airline schedules, PNE hangars, and development-agreement opportunity views.
- **Lease & Agreement Governance**: agreement completeness, modeled value, compliance flags, renewal/action needs, and standardized agreement register model.
- **Data Strategy Roadmap**: source inventory, data-readiness model, Commercial staff adoption, IT/data partnership needs, AI-assisted analysis guardrails, and first-90-days execution plan.

## Codebase Walkthrough

- `src/types/dashboard.ts`: shared TypeScript interfaces for airports, sources, KPIs, commercial verticals, data assets, agreements, evidence-chain insights, adoption items, roadmap items, and decisions.
- `src/data/dashboardData.ts`: typed local fixtures, source references, current public facts, illustrative internal models, capability map, commercial verticals, agreement records, data assets, insight chains, roadmap, and decision worklist.
- `src/App.tsx`: dashboard state, filter/derived-metric functions, chart transformations, reusable components, and four tab compositions.
- `src/styles.css`: responsive executive dashboard styling, card grids, status treatments, provenance badges, charts, tables, and mobile behavior.

Inline comments are included where they clarify the data model, provenance boundary, filter behavior, derived chart values, and dashboard composition.

## Data Provenance

The app uses three labels:

- `Public Source`: directly available public information such as the posting, PHL/PNE pages, City data, FAA, and BTS.
- `Derived From Public`: analytical inference from public facts, such as turning passenger scale into a commercial BI question.
- `Illustrative Model`: realistic internal operating data that is not publicly available, such as lease completeness, parking yield opportunity, feed readiness, and BI adoption progress.

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

This is prototype v1.2. It is not a production BI deployment and does not connect to live airport, parking, lease, contract, concessions, gate, cargo, or aviation systems. Internal operational metrics are intentionally marked as illustrative models until real feeds are available.

## Changelog

### v1.2 - Explicit posting-aligned interview resource

Added:

- City of Philadelphia posting as an intentional source and capability framework.
- Interview-resource framing in the app and README.
- Role capability map covering BI, dashboards, strategic recommendations, agreement governance, training, IT/ETL partnership, data governance, and AI-assisted analysis.
- Evidence-chain model from posting requirement to public fact, analytics question, internal data needed, dashboard artifact, and decision supported.
- Current public PHL/PNE facts from PHL Annual Reports, PHL Fast Facts, and the PNE public profile.
- Inline comments explaining provenance modeling, filters, derived chart values, and dashboard composition.

Changed:

- Refreshed dashboard copy, source library, data fixtures, README story, and screenshot previews for explicit interview use.
- Reframed public-source insights as evidence chains rather than generic public information story cards.

Removed:

- Prior neutral framing that no longer matched the intended interview-resource story.

### v1.1 - Public portfolio framing cleanup

Added:

- Changelog entry documenting the public portfolio framing cleanup.

Changed:

- Reframed README and dashboard language around Commercial Division duties, portfolio management, data governance, and BI operating model.
- Renamed visible alignment copy to capability alignment.
- Kept the same commercial analytics scope while simplifying the earlier framing.

Removed:

- Earlier source-framing language from README and app copy.
- Earlier framework link from the public evidence library.

### v1 - Commercial Data Management BI prototype

Added:

- Commercial Data Management & Analysis dashboard framing.
- New views for Commercial BI Cockpit, Revenue Verticals, Lease & Agreement Governance, and Data Strategy Roadmap.
- Public-first provenance labels: `Public Source`, `Illustrative Model`, and `Derived From Public`.
- Capability-alignment panel mapping dashboard modules to Commercial Division data duties.
- Public information story cards connecting public observations to internal data requests and executive recommendations.
- Commercial vertical model covering parking, ground transportation, concessions, advertising, property development, leases, cargo, gates, airline schedules, aviation activity, and PNE assets.
- Agreement governance model with completeness, compliance flags, value, expiration, and recommended action.
- First-90-days data strategy roadmap, data asset inventory, staff adoption items, IT partnership needs, and AI-assisted analysis guardrails.

Changed:

- Repositioned the app from an airport operations control-room dashboard to a Commercial Division BI prototype.
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
- Added local fixtures, public source links, screenshots, and GitHub README.

## Recommended Next Steps

- Replace illustrative lease and agreement records with real commercial agreement data if access is available.
- Connect parking, concessions, ground transportation, cargo, gate, schedule, and PNE asset feeds.
- Add a source-quality scoring workflow with accountable data owners.
- Add portfolio drilldowns for PHL and PNE leadership audiences.
- Add a companion executive briefing deck that explains the dashboard story.
