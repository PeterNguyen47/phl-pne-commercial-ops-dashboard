import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  Fuel,
  Gauge,
  Landmark,
  ListChecks,
  Plane,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adoptionItems,
  agreementRecords,
  airportMatches,
  airportProfiles,
  commercialVerticals,
  dataAssets,
  decisionItems,
  domainRisks,
  executiveKpis,
  insightItems,
  roadmapItems,
  capabilityAlignment,
  severityRank,
  sourceReferences,
  trendData,
} from "./data/dashboardData";
import type {
  AgreementRecord,
  AirportCode,
  CommercialVerticalMetric,
  DataAsset,
  DecisionItem,
  DomainRisk,
  InsightItem,
  KpiMetric,
  PeriodKey,
  RoadmapItem,
  SourceKind,
  StatusKind,
  TrainingOrAdoptionItem,
} from "./types/dashboard";

type ViewKey = "cockpit" | "revenue" | "agreements" | "roadmap";
type SeverityFilter = "all" | StatusKind;

const airportOptions: Array<{ label: string; value: AirportCode; icon: LucideIcon }> = [
  { label: "PHL + PNE", value: "ALL", icon: Building2 },
  { label: "PHL", value: "PHL", icon: Plane },
  { label: "PNE", value: "PNE", icon: Fuel },
];

const periodOptions: Array<{ label: string; value: PeriodKey }> = [
  { label: "Today", value: "today" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
];

const severityOptions: Array<{ label: string; value: SeverityFilter; icon: LucideIcon }> = [
  { label: "All", value: "all", icon: Filter },
  { label: "Action", value: "critical", icon: ShieldAlert },
  { label: "Watch", value: "warning", icon: AlertTriangle },
];

const viewTabs: Array<{ label: string; value: ViewKey; icon: LucideIcon }> = [
  { label: "Commercial BI Cockpit", value: "cockpit", icon: Gauge },
  { label: "Revenue Verticals", value: "revenue", icon: Landmark },
  { label: "Lease & Agreement Governance", value: "agreements", icon: Briefcase },
  { label: "Data Strategy Roadmap", value: "roadmap", icon: Wrench },
];

const statusText: Record<StatusKind, string> = {
  normal: "Ready",
  warning: "Watch",
  critical: "Action",
};

const statusColors: Record<StatusKind, string> = {
  normal: "#25805a",
  warning: "#b76500",
  critical: "#b42318",
};

function formatCurrency(value: number) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }

  return `$${Math.round(value / 1000)}K`;
}

function sourceClass(source: SourceKind) {
  return source.toLowerCase().replace(/\s+/g, "-");
}

function SourceBadge({ source }: { source: SourceKind }) {
  return <span className={`source-badge ${sourceClass(source)}`}>{source}</span>;
}

function StatusPill({ status }: { status: StatusKind }) {
  const Icon = status === "critical" ? ShieldAlert : status === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <span className={`status-pill ${status}`}>
      <Icon aria-hidden="true" size={14} />
      {statusText[status]}
    </span>
  );
}

function TrendMark({ metric }: { metric: KpiMetric }) {
  if (metric.trend === "up") {
    return (
      <span className="trend up">
        <ArrowUpRight aria-hidden="true" size={15} />
        {metric.delta}
      </span>
    );
  }

  if (metric.trend === "down") {
    return (
      <span className="trend down">
        <ArrowDownRight aria-hidden="true" size={15} />
        {metric.delta}
      </span>
    );
  }

  return <span className="trend flat">{metric.delta}</span>;
}

function filterByAirport<T extends { airport: AirportCode }>(items: T[], selectedAirport: AirportCode) {
  return items.filter((item) => airportMatches(item.airport, selectedAirport));
}

function filterBySeverity<T>(items: T[], severity: SeverityFilter, getStatus: (item: T) => StatusKind) {
  if (severity === "all") {
    return items;
  }

  return items.filter((item) => getStatus(item) === severity);
}

function getChartData(period: PeriodKey, selectedAirport: AirportCode) {
  return trendData[period].map((point) => {
    const opportunity =
      selectedAirport === "PHL"
        ? point.phlOpportunity
        : selectedAirport === "PNE"
          ? point.pneOpportunity
          : point.phlOpportunity + point.pneOpportunity;

    return {
      ...point,
      opportunity,
    };
  });
}

function App() {
  const [selectedView, setSelectedView] = useState<ViewKey>("cockpit");
  const [selectedAirport, setSelectedAirport] = useState<AirportCode>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const isCompact = useCompactViewport();

  const scopedKpis = useMemo(
    () => filterByAirport(executiveKpis[selectedPeriod], selectedAirport),
    [selectedAirport, selectedPeriod],
  );
  const scopedRisks = useMemo(
    () => filterByAirport(domainRisks, selectedAirport).sort((a, b) => a.score - b.score),
    [selectedAirport],
  );
  const scopedVerticals = useMemo(
    () => filterBySeverity(filterByAirport(commercialVerticals, selectedAirport), severityFilter, (item) => item.status),
    [selectedAirport, severityFilter],
  );
  const scopedAgreements = useMemo(
    () =>
      filterBySeverity(filterByAirport(agreementRecords, selectedAirport), severityFilter, (item) => item.complianceFlag),
    [selectedAirport, severityFilter],
  );
  const scopedAssets = useMemo(
    () => filterBySeverity(filterByAirport(dataAssets, selectedAirport), severityFilter, (item) => item.qualityStatus),
    [selectedAirport, severityFilter],
  );
  const scopedInsights = useMemo(
    () => filterBySeverity(filterByAirport(insightItems, selectedAirport), severityFilter, (item) => item.status),
    [selectedAirport, severityFilter],
  );
  const scopedDecisions = useMemo(
    () =>
      filterBySeverity(filterByAirport(decisionItems, selectedAirport), severityFilter, (item) => item.severity).sort(
        (a, b) => severityRank[a.severity] - severityRank[b.severity],
      ),
    [selectedAirport, severityFilter],
  );
  const chartData = useMemo(() => getChartData(selectedPeriod, selectedAirport), [selectedAirport, selectedPeriod]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Plane size={22} />
          </div>
          <div>
            <p className="eyebrow">Philadelphia Department of Aviation commercial analytics</p>
            <h1>Commercial Data Management & Analysis Dashboard</h1>
            <p className="hero-copy">
              Public-first BI prototype for organizing Commercial Division data across PHL and PNE.
            </p>
          </div>
        </div>

        <div className="toolbar" aria-label="Dashboard filters">
          <SegmentedControl
            label="Airport"
            options={airportOptions}
            value={selectedAirport}
            onChange={setSelectedAirport}
          />
          <div className="segmented compact" aria-label="Period">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={selectedPeriod === option.value ? "active" : ""}
                onClick={() => setSelectedPeriod(option.value)}
              >
                <CalendarDays aria-hidden="true" size={15} />
                {option.label}
              </button>
            ))}
          </div>
          <SegmentedControl
            label="Status"
            options={severityOptions}
            value={severityFilter}
            onChange={setSeverityFilter}
          />
        </div>
      </header>

      <section className="airport-context" aria-label="Airport profiles">
        {airportProfiles
          .filter((profile) => selectedAirport === "ALL" || profile.code === selectedAirport)
          .map((profile) => (
            <article className="profile-card" key={profile.code}>
              <div className="profile-heading">
                <span className="airport-code">{profile.code}</span>
                <div>
                  <h2>{profile.name}</h2>
                  <p>{profile.portfolioFunction}</p>
                </div>
              </div>
              <p className="profile-focus">{profile.focus}</p>
              <div className="fact-row">
                {profile.publicFacts.slice(0, 2).map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
              </div>
              <SourceBadge source={profile.source} />
            </article>
          ))}
      </section>

      <nav className="view-tabs" aria-label="Dashboard views">
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              className={selectedView === tab.value ? "active" : ""}
              onClick={() => setSelectedView(tab.value)}
            >
              <Icon aria-hidden="true" size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main>
        {selectedView === "cockpit" && (
          <CommercialBiCockpit
            kpis={scopedKpis}
            risks={scopedRisks}
            insights={scopedInsights}
            decisions={scopedDecisions}
            chartData={chartData}
            isCompact={isCompact}
          />
        )}
        {selectedView === "revenue" && (
          <RevenueVerticals
            verticals={scopedVerticals}
            insights={scopedInsights}
            chartData={chartData}
            isCompact={isCompact}
          />
        )}
        {selectedView === "agreements" && (
          <AgreementGovernance agreements={scopedAgreements} decisions={scopedDecisions} isCompact={isCompact} />
        )}
        {selectedView === "roadmap" && (
          <DataStrategyRoadmap assets={scopedAssets} decisions={scopedDecisions} isCompact={isCompact} />
        )}
      </main>

      <footer className="source-library">
        <div>
          <p className="eyebrow">Public Evidence Library</p>
          <h2>Sources connected to commercial BI questions</h2>
        </div>
        <div className="source-links">
          {sourceReferences.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" title={source.useCase}>
              <FileText aria-hidden="true" size={15} />
              {source.label}
              <ExternalLink aria-hidden="true" size={13} />
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

function useCompactViewport() {
  const [isCompact, setIsCompact] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 820px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 820px)");
    const handleChange = () => setIsCompact(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isCompact;
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: T; icon: LucideIcon }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" aria-label={label}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            title={option.label}
            className={value === option.value ? "active" : ""}
            onClick={() => onChange(option.value)}
          >
            <Icon aria-hidden="true" size={15} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function CommercialBiCockpit({
  kpis,
  risks,
  insights,
  decisions,
  chartData,
  isCompact,
}: {
  kpis: KpiMetric[];
  risks: DomainRisk[];
  insights: InsightItem[];
  decisions: DecisionItem[];
  chartData: Array<{
    label: string;
    opportunity: number;
    dataReadiness: number;
    agreementCompleteness: number;
    adoption: number;
  }>;
  isCompact: boolean;
}) {
  return (
    <div className="view-stack">
      <section className="metric-grid">
        {kpis.map((metric) => (
          <article className={`metric-card ${metric.status}`} key={metric.id}>
            <div className="metric-topline">
              <SourceBadge source={metric.source} />
              <StatusPill status={metric.status} />
            </div>
            <h2>{metric.label}</h2>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-target">Target {metric.target}</div>
            <TrendMark metric={metric} />
          </article>
        ))}
      </section>

      <section className="dashboard-grid two-one">
        <article className="panel">
          <PanelHeading
            icon={TrendingUp}
            title="BI Maturity Path"
            meta="Modeled opportunity decreases as data readiness, agreement completeness, and adoption improve"
          />
          <div className="chart-frame tall">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 32, bottom: 16, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={isCompact ? 1 : 0}
                  tickMargin={8}
                  height={40}
                />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} width={42} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} width={42} />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="opportunity"
                  name="Modeled opportunity ($K)"
                  fill="#b42318"
                  radius={[4, 4, 0, 0]}
                />
                <Line yAxisId="right" dataKey="dataReadiness" name="Data readiness" stroke="#275d92" strokeWidth={2} />
                <Line
                  yAxisId="right"
                  dataKey="agreementCompleteness"
                  name="Agreement completeness"
                  stroke="#25805a"
                  strokeWidth={2}
                />
                <Line yAxisId="right" dataKey="adoption" name="BI adoption" stroke="#b76500" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={Target} title="Capability Alignment" meta="Dashboard modules mapped to Commercial Division data duties" />
          <div className="capability-list">
            {capabilityAlignment.map((item) => (
              <div className="capability-row" key={item.responsibility}>
                <div>
                  <div className="row-title">{item.responsibility}</div>
                  <p>{item.proofPoint}</p>
                </div>
                <div className="capability-module">
                  <strong>{item.dashboardModule}</strong>
                  <SourceBadge source={item.source} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid equal">
        <DomainRiskPanel risks={risks} />
        <InsightPanel insights={insights} />
      </section>

      <section className="panel">
        <PanelHeading icon={ListChecks} title="Commercial Decision Worklist" meta={`${decisions.length} scoped actions`} />
        <DecisionRows decisions={decisions} />
      </section>
    </div>
  );
}

function RevenueVerticals({
  verticals,
  insights,
  chartData,
  isCompact,
}: {
  verticals: CommercialVerticalMetric[];
  insights: InsightItem[];
  chartData: Array<{ label: string; opportunity: number }>;
  isCompact: boolean;
}) {
  return (
    <div className="view-stack">
      <section className="summary-strip">
        <SummaryTile
          icon={Landmark}
          label="Visible verticals"
          value={String(verticals.length)}
          source="Derived From Public"
        />
        <SummaryTile
          icon={BarChart3}
          label="Avg visibility"
          value={`${Math.round(verticals.reduce((sum, item) => sum + item.currentVisibility, 0) / Math.max(verticals.length, 1))}%`}
          source="Illustrative Model"
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Action verticals"
          value={String(verticals.filter((item) => item.status === "critical").length)}
          source="Illustrative Model"
        />
        <SummaryTile icon={FileText} label="Public insights" value={String(insights.length)} source="Derived From Public" />
      </section>

      <section className="dashboard-grid equal">
        <article className="panel">
          <PanelHeading icon={TrendingUp} title="Modeled Revenue Opportunity" meta="Public context plus internal-data request model" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 32, bottom: 16, left: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={isCompact ? 1 : 0} height={40} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(value: number) => `$${value}K`} />
                <Area
                  type="monotone"
                  dataKey="opportunity"
                  name="Modeled opportunity"
                  stroke="#275d92"
                  fill="#dce8f7"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <InsightPanel insights={insights} />
      </section>

      <section className="vertical-grid">
        {verticals.map((vertical) => (
          <article className={`vertical-card ${vertical.status}`} key={vertical.id}>
            <div className="metric-topline">
              <span className="airport-code small">{vertical.airport}</span>
              <StatusPill status={vertical.status} />
            </div>
            <h2>{vertical.vertical}</h2>
            <p>{vertical.publicSignal}</p>
            <div className="lot-stat">
              <strong>{vertical.currentVisibility}%</strong>
              <span>visibility</span>
            </div>
            <div className="progress-track">
              <div className={vertical.status} style={{ width: `${vertical.currentVisibility}%` }} />
            </div>
            <dl>
              <div>
                <dt>Opportunity</dt>
                <dd>{vertical.opportunity}</dd>
              </div>
              <div>
                <dt>Day 1 internal data request</dt>
                <dd>{vertical.internalDataNeeded}</dd>
              </div>
              <div>
                <dt>Executive recommendation</dt>
                <dd>{vertical.recommendedAction}</dd>
              </div>
            </dl>
            <SourceBadge source={vertical.source} />
          </article>
        ))}
      </section>
    </div>
  );
}

function AgreementGovernance({
  agreements,
  decisions,
  isCompact,
}: {
  agreements: AgreementRecord[];
  decisions: DecisionItem[];
  isCompact: boolean;
}) {
  const agreementChart = agreements.map((agreement) => ({
    name: agreement.tenantOrVendor,
    completeness: agreement.completeness,
    value: Math.round(agreement.value / 1000),
  }));
  const agreementDecisions = decisions.filter((decision) => decision.domain === "Lease Governance");

  return (
    <div className="view-stack">
      <section className="summary-strip">
        <SummaryTile icon={Briefcase} label="Agreement records" value={String(agreements.length)} source="Illustrative Model" />
        <SummaryTile
          icon={Gauge}
          label="Avg completeness"
          value={`${Math.round(agreements.reduce((sum, item) => sum + item.completeness, 0) / Math.max(agreements.length, 1))}%`}
          source="Illustrative Model"
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Compliance flags"
          value={String(agreements.filter((item) => item.complianceFlag !== "normal").length)}
          source="Illustrative Model"
        />
        <SummaryTile
          icon={Landmark}
          label="Modeled value"
          value={formatCurrency(agreements.reduce((sum, item) => sum + item.value, 0))}
          source="Illustrative Model"
        />
      </section>

      <section className="dashboard-grid two-one">
        <article className="panel">
          <PanelHeading icon={BarChart3} title="Agreement Completeness" meta="Taxonomy hygiene before executive reporting" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agreementChart} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={isCompact ? 1 : 0}
                  height={72}
                  angle={isCompact ? 0 : -18}
                  textAnchor={isCompact ? "middle" : "end"}
                />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="completeness" name="Completeness" fill="#275d92" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={ListChecks} title="Lease Governance Actions" meta="Agreement work tied to a Commercial BI program" />
          <DecisionRows decisions={agreementDecisions.length > 0 ? agreementDecisions : decisions} />
        </article>
      </section>

      <section className="panel">
        <PanelHeading icon={Briefcase} title="Agreement Register Model" meta="Illustrative fields Commercial analytics would standardize" />
        <div className="agreement-table" role="table" aria-label="Agreement register model">
          <div className="agreement-header" role="row">
            <span>Agreement</span>
            <span>Value</span>
            <span>Completeness</span>
            <span>Action</span>
          </div>
          {agreements.map((agreement) => (
            <div className="agreement-row" role="row" key={agreement.id}>
              <div>
                <div className="row-title">
                  {agreement.tenantOrVendor} <span>{agreement.airport}</span>
                </div>
                <p>{agreement.agreementType}</p>
                <small>Expiration {agreement.expiration}</small>
              </div>
              <strong>{formatCurrency(agreement.value)}</strong>
              <div className="sla-cell">
                <span>{agreement.completeness}%</span>
                <div className="progress-track">
                  <div className={agreement.complianceFlag} style={{ width: `${agreement.completeness}%` }} />
                </div>
              </div>
              <div>
                <StatusPill status={agreement.complianceFlag} />
                <p>{agreement.recommendedAction}</p>
                <SourceBadge source={agreement.source} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DataStrategyRoadmap({
  assets,
  decisions,
  isCompact,
}: {
  assets: DataAsset[];
  decisions: DecisionItem[];
  isCompact: boolean;
}) {
  const qualityChart = assets.map((asset) => ({
    name: asset.sourceName,
    quality: asset.qualityStatus === "normal" ? 90 : asset.qualityStatus === "warning" ? 64 : 38,
  }));
  const strategyDecisions = decisions.filter((decision) => decision.domain === "Data Strategy" || decision.domain === "Commercial BI");

  return (
    <div className="view-stack">
      <section className="dashboard-grid equal">
        <article className="panel">
          <PanelHeading icon={Wrench} title="Data Asset Readiness" meta="Public anchors separated from internal feeds to request" />
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityChart} margin={{ top: 8, right: 18, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={isCompact ? 1 : 0}
                  angle={isCompact ? 0 : -18}
                  textAnchor={isCompact ? "middle" : "end"}
                  height={isCompact ? 52 : 78}
                />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="quality" name="Readiness proxy" fill="#275d92" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={Users} title="Training & Adoption" meta="Dashboard success depends on Commercial staff use" />
          <div className="adoption-list">
            {adoptionItems.map((item) => (
              <AdoptionRow item={item} key={item.id} />
            ))}
          </div>
        </article>
      </section>

      <section className="asset-grid">
        {assets.map((asset) => (
          <article className={`asset-card ${asset.qualityStatus}`} key={asset.id}>
            <div className="metric-topline">
              <span className="airport-code small">{asset.airport}</span>
              <StatusPill status={asset.qualityStatus} />
            </div>
            <h2>{asset.sourceName}</h2>
            <p>{asset.commercialUseCase}</p>
            <dl>
              <div>
                <dt>Owner</dt>
                <dd>{asset.owner}</dd>
              </div>
              <div>
                <dt>Cadence</dt>
                <dd>{asset.refreshCadence}</dd>
              </div>
              <div>
                <dt>Access</dt>
                <dd>{asset.accessStatus}</dd>
              </div>
            </dl>
            <SourceBadge source={asset.source} />
          </article>
        ))}
      </section>

      <section className="dashboard-grid two-one">
        <article className="panel">
          <PanelHeading icon={CalendarDays} title="First 90 Days Roadmap" meta="A practical path from public evidence to governed BI" />
          <div className="roadmap-list">
            {roadmapItems.map((item) => (
              <RoadmapRow item={item} key={item.id} />
            ))}
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={ListChecks} title="Strategy Decisions" meta="Roadmap choices that need leadership alignment" />
          <DecisionRows decisions={strategyDecisions.length > 0 ? strategyDecisions : decisions} />
        </article>
      </section>
    </div>
  );
}

function DomainRiskPanel({ risks }: { risks: DomainRisk[] }) {
  return (
    <article className="panel">
        <PanelHeading icon={Target} title="Capability Risk Map" meta="Lowest score receives attention first" />
      <div className="risk-list">
        {risks.map((risk) => (
          <div className="risk-row" key={`${risk.airport}-${risk.domain}`}>
            <div className="risk-score" style={{ color: statusColors[risk.status] }}>
              {risk.score}
            </div>
            <div>
              <div className="row-title">
                {risk.domain} <span>{risk.airport}</span>
              </div>
              <p>{risk.driver}</p>
              <strong>{risk.action}</strong>
            </div>
            <SourceBadge source={risk.source} />
          </div>
        ))}
      </div>
    </article>
  );
}

function InsightPanel({ insights }: { insights: InsightItem[] }) {
  if (insights.length === 0) {
    return (
      <article className="panel">
        <PanelHeading icon={FileText} title="Public Information Story" meta="No matching insights for current filters" />
        <div className="empty-state">No matching public-source insights.</div>
      </article>
    );
  }

  return (
    <article className="panel">
      <PanelHeading icon={FileText} title="Public Information Story" meta="Observation, internal data request, executive action" />
      <div className="insight-list">
        {insights.map((insight) => (
          <div className="insight-row" key={insight.id}>
            <div className={`severity-rail ${insight.status}`} />
            <div>
              <div className="row-title">
                {insight.title} <span>{insight.airport}</span>
              </div>
              <p>
                <strong>Public evidence:</strong> {insight.publicObservation}
              </p>
              <p>
                <strong>Business question:</strong> {insight.businessQuestion}
              </p>
              <p>
                <strong>Day 1 data request:</strong> {insight.internalDataNeeded}
              </p>
              <p>
                <strong>Recommendation:</strong> {insight.recommendation}
              </p>
              <SourceBadge source={insight.source} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function DecisionRows({ decisions }: { decisions: DecisionItem[] }) {
  if (decisions.length === 0) {
    return <div className="empty-state">No matching decisions for the current filters.</div>;
  }

  return (
    <div className="decision-list">
      {decisions.map((decision) => (
        <div className="decision-row" key={decision.id}>
          <div className={`severity-rail ${decision.severity}`} />
          <div>
            <div className="row-title">
              {decision.title} <span>{decision.airport}</span>
            </div>
            <p>{decision.recommendation}</p>
            <div className="row-meta">
              <span>
                <Briefcase aria-hidden="true" size={14} />
                {decision.domain}
              </span>
              <span>
                <Users aria-hidden="true" size={14} />
                {decision.owner}
              </span>
              <span>
                <Clock3 aria-hidden="true" size={14} />
                {decision.dueDate}
              </span>
              <SourceBadge source={decision.source} />
            </div>
          </div>
          <div className="decision-impact">
            <strong>{decision.impact}</strong>
            <span>{decision.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdoptionRow({ item }: { item: TrainingOrAdoptionItem }) {
  return (
    <div className="adoption-row">
      <div className={`severity-rail ${item.status}`} />
      <div>
        <div className="row-title">{item.audience}</div>
        <p>{item.skillGap}</p>
        <div className="row-meta">
          <span>{item.toolOrProcess}</span>
          <span>{item.nextMilestone}</span>
          <SourceBadge source={item.source} />
        </div>
      </div>
      <StatusPill status={item.status} />
    </div>
  );
}

function RoadmapRow({ item }: { item: RoadmapItem }) {
  return (
    <div className="roadmap-row">
      <div>
        <span className="phase-pill">{item.phase}</span>
        <div className="row-title">{item.title}</div>
        <p>{item.outcome}</p>
        <div className="row-meta">
          <span>{item.owner}</span>
          <SourceBadge source={item.source} />
        </div>
      </div>
      <StatusPill status={item.status} />
    </div>
  );
}

function PanelHeading({ icon: Icon, title, meta }: { icon: LucideIcon; title: string; meta: string }) {
  return (
    <div className="panel-heading">
      <div className="panel-title">
        <Icon aria-hidden="true" size={18} />
        <h2>{title}</h2>
      </div>
      <p>{meta}</p>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  source,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  source: SourceKind;
}) {
  return (
    <article className="summary-tile">
      <Icon aria-hidden="true" size={20} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <SourceBadge source={source} />
    </article>
  );
}

export default App;
