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
  ChevronRight,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
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
type ReportFormat = "csv" | "json" | "md";
type ReportRow = Record<string, string | number>;

interface ReportDefinition {
  id: string;
  title: string;
  scope: string;
  description: string;
  rows: ReportRow[];
}

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

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeCsvCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: ReportRow[]) {
  if (rows.length === 0) {
    return "section,name,status,summary\n";
  }

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const body = rows.map((row) => headers.map((header) => escapeCsvCell(row[header] ?? "")).join(","));
  return [headers.join(","), ...body].join("\n");
}

function toMarkdown(report: ReportDefinition) {
  const lines = [`# ${report.title}`, "", report.description, "", `Scope: ${report.scope}`, ""];

  report.rows.forEach((row, index) => {
    lines.push(`## ${index + 1}. ${row.name ?? row.section ?? "Report item"}`);
    Object.entries(row).forEach(([key, value]) => {
      lines.push(`- ${key}: ${value}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

function downloadReport(report: ReportDefinition, format: ReportFormat) {
  const serializers: Record<ReportFormat, { mime: string; extension: string; body: string }> = {
    csv: {
      mime: "text/csv;charset=utf-8",
      extension: "csv",
      body: toCsv(report.rows),
    },
    json: {
      mime: "application/json;charset=utf-8",
      extension: "json",
      body: JSON.stringify({ title: report.title, scope: report.scope, rows: report.rows }, null, 2),
    },
    md: {
      mime: "text/markdown;charset=utf-8",
      extension: "md",
      body: toMarkdown(report),
    },
  };
  const serialized = serializers[format];
  const blob = new Blob([serialized.body], { type: serialized.mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${safeFilename(report.title)}.${serialized.extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function reportRow(section: string, name: string, values: Omit<ReportRow, "section" | "name">): ReportRow {
  return { section, name, ...values };
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
  // "ALL" records are shared portfolio records, so they should remain visible
  // when either airport is selected.
  return items.filter((item) => airportMatches(item.airport, selectedAirport));
}

function filterBySeverity<T>(items: T[], severity: SeverityFilter, getStatus: (item: T) => StatusKind) {
  // The same severity filter is reused across verticals, agreements, assets,
  // insights, and decisions to keep the dashboard behavior consistent.
  if (severity === "all") {
    return items;
  }

  return items.filter((item) => getStatus(item) === severity);
}

function getChartData(period: PeriodKey, selectedAirport: AirportCode) {
  // Chart fixtures store PHL and PNE opportunity separately; this transform
  // derives the combined portfolio value only when the user is viewing both.
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

function createReportDefinitions(period: PeriodKey): ReportDefinition[] {
  const kpiRows = executiveKpis[period].map((metric) =>
    reportRow("KPI", metric.label, {
      airport: metric.airport,
      value: metric.value,
      target: metric.target,
      status: metric.status,
      trend: metric.delta,
      source: metric.source,
    }),
  );
  const verticalRows = commercialVerticals.map((vertical) =>
    reportRow("Revenue vertical", vertical.vertical, {
      airport: vertical.airport,
      visibility: `${vertical.currentVisibility}%`,
      status: vertical.status,
      opportunity: vertical.opportunity,
      internalDataNeeded: vertical.internalDataNeeded,
      recommendedAction: vertical.recommendedAction,
      source: vertical.source,
    }),
  );
  const agreementRows = agreementRecords.map((agreement) =>
    reportRow("Agreement", agreement.tenantOrVendor, {
      airport: agreement.airport,
      agreementType: agreement.agreementType,
      managingUnit: agreement.managingUnit,
      value: formatCurrency(agreement.value),
      expiration: agreement.expiration,
      completeness: `${agreement.completeness}%`,
      status: agreement.complianceFlag,
      recommendedAction: agreement.recommendedAction,
      source: agreement.source,
    }),
  );
  const roadmapRows = roadmapItems.map((item) =>
    reportRow("Roadmap", item.title, {
      phase: item.phase,
      targetDate: item.targetDate,
      priority: item.priority,
      progress: `${item.progress}%`,
      owner: item.owner,
      executiveSignal: item.executiveSignal,
      status: item.status,
      source: item.source,
    }),
  );
  const evidenceRows = insightItems.map((insight) =>
    reportRow("Evidence chain", insight.title, {
      airport: insight.airport,
      citation: insight.citationLabel,
      citationDate: insight.citationDate,
      trendSignal: insight.trendSignal,
      businessQuestion: insight.businessQuestion,
      internalDataNeeded: insight.internalDataNeeded,
      decisionSupported: insight.decisionSupported,
      source: insight.source,
    }),
  );
  const assetRows = dataAssets.map((asset) =>
    reportRow("Data asset", asset.sourceName, {
      airport: asset.airport,
      owner: asset.owner,
      accessStatus: asset.accessStatus,
      qualityStatus: asset.qualityStatus,
      reportingLayer: asset.reportingLayer,
      executiveQuestion: asset.executiveQuestion,
      decisionUse: asset.decisionUse,
      source: asset.source,
    }),
  );
  const decisionRows = decisionItems.map((decision) =>
    reportRow("Decision", decision.title, {
      airport: decision.airport,
      domain: decision.domain,
      dueDate: decision.dueDate,
      owner: decision.owner,
      status: decision.status,
      severity: decision.severity,
      impact: decision.impact,
      recommendation: decision.recommendation,
      dataRequired: decision.dataRequired,
      riskOfDelay: decision.riskOfDelay,
      source: decision.source,
    }),
  );

  return [
    {
      id: "airport-phl",
      title: "PHL Executive Commercial Portfolio Report",
      scope: "PHL",
      description: "Airport-specific executive report for PHL commercial data, revenue verticals, agreements, and evidence chains.",
      rows: [...kpiRows, ...verticalRows, ...agreementRows, ...evidenceRows, ...assetRows, ...decisionRows].filter(
        (row) => row.airport === "PHL" || row.airport === "ALL" || row.airport === undefined,
      ),
    },
    {
      id: "airport-pne",
      title: "PNE Executive Commercial Asset Report",
      scope: "PNE",
      description: "Airport-specific executive report for PNE hangars, ground leases, development agreements, and governance decisions.",
      rows: [...kpiRows, ...verticalRows, ...agreementRows, ...evidenceRows, ...assetRows, ...decisionRows].filter(
        (row) => row.airport === "PNE" || row.airport === "ALL" || row.airport === undefined,
      ),
    },
    {
      id: "cockpit",
      title: "Commercial BI Cockpit Report",
      scope: "Portfolio",
      description: "KPI, capability-risk, evidence, and decision report for executive cockpit review.",
      rows: [
        ...kpiRows,
        ...domainRisks.map((risk) =>
          reportRow("Capability risk", risk.domain, {
            airport: risk.airport,
            score: risk.score,
            status: risk.status,
            driver: risk.driver,
            action: risk.action,
            source: risk.source,
          }),
        ),
        ...evidenceRows,
        ...decisionRows,
      ],
    },
    {
      id: "revenue",
      title: "Revenue Verticals Report",
      scope: "PHL + PNE",
      description: "Revenue vertical visibility, opportunity, internal data needs, and executive recommendations.",
      rows: verticalRows,
    },
    {
      id: "agreements",
      title: "Lease And Agreement Governance Report",
      scope: "PHL + PNE",
      description: "Agreement register model with managing unit, completeness, expiration, compliance, and recommended action.",
      rows: agreementRows,
    },
    {
      id: "roadmap",
      title: "Data Strategy Roadmap Report",
      scope: "PHL + PNE",
      description: "Roadmap, adoption, data asset, and strategic decision report for implementation planning.",
      rows: [
        ...roadmapRows,
        ...assetRows,
        ...adoptionItems.map((item) =>
          reportRow("Training and adoption", item.audience, {
            priority: item.priority,
            targetDate: item.targetDate,
            status: item.status,
            toolOrProcess: item.toolOrProcess,
            enablementTask: item.enablementTask,
            successMeasure: item.successMeasure,
            riskIfSkipped: item.riskIfSkipped,
            source: item.source,
          }),
        ),
        ...decisionRows.filter((row) => row.domain === "Data Strategy" || row.domain === "Commercial BI"),
      ],
    },
    {
      id: "evidence",
      title: "Evidence Chain Citation Report",
      scope: "Public source credibility",
      description: "Source-linked evidence chain with citations, citation dates, trend signals, and internal data requests.",
      rows: evidenceRows,
    },
  ];
}

function App() {
  const [selectedView, setSelectedView] = useState<ViewKey>("cockpit");
  const [selectedAirport, setSelectedAirport] = useState<AirportCode>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const isCompact = useCompactViewport();

  // All scoped collections are memoized from the same filter state so cards,
  // charts, and worklists always tell the same airport/status story.
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
  const reportDefinitions = useMemo(() => createReportDefinitions(selectedPeriod), [selectedPeriod]);

  return (
    <div className="app-shell">
      <div className="city-service-bar">
        <span>City of Philadelphia</span>
        <strong>Department of Aviation</strong>
        <span>PhilaUI-aligned civic interface pattern</span>
      </div>

      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Plane size={22} />
          </div>
          <div>
            <p className="eyebrow">Philadelphia Department of Aviation commercial analytics</p>
            <h1>Commercial Data Management & Analysis Dashboard</h1>
            <p className="hero-copy">
              Executive commercial BI prototype for PHL and PNE that connects public evidence, internal data requests,
              agreement governance, and revenue-vertical decisions in a repeatable civic dashboard pattern.
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

      <section className="standards-note" aria-label="City interface standard">
        <div>
          <p className="eyebrow">City Standard Alignment</p>
          <h2>React prototype shaped for PhilaUI replication</h2>
          <p>
            The interface uses City-style civic hierarchy, blue and gold accenting, accessible button controls,
            restrained status colors, visible source labels, and report exports. In a production City application,
            these patterns could be rebuilt with PhilaUI Vue components while preserving the same data model and
            executive workflow.
          </p>
        </div>
        <a href="https://ui.phila.gov/" target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden="true" size={15} />
          PhilaUI reference
        </a>
      </section>

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

      <ReportCenter reports={reportDefinitions} />

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
          <h2>Sources supporting the posting-to-BI evidence chain</h2>
        </div>
        <div className="source-links">
          {sourceReferences.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" title={source.useCase}>
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

function ReportCenter({ reports }: { reports: ReportDefinition[] }) {
  const formats: Array<{ format: ReportFormat; label: string; icon: LucideIcon }> = [
    { format: "csv", label: "CSV", icon: FileSpreadsheet },
    { format: "json", label: "JSON", icon: FileJson },
    { format: "md", label: "Brief", icon: FileText },
  ];

  return (
    <section className="report-center" aria-label="Downloadable reports">
      <div className="report-heading">
        <div>
          <p className="eyebrow">Downloadable Reports</p>
          <h2>Executive exports for portfolio review</h2>
          <p>
            Generate scoped CSV, JSON, or Markdown briefing files for airport-level review, dashboard modules,
            evidence citations, agreements, and roadmap decisions.
          </p>
        </div>
        <Download aria-hidden="true" size={22} />
      </div>
      <div className="report-grid">
        {reports.map((report) => (
          <article className="report-card" key={report.id}>
            <div>
              <span>{report.scope}</span>
              <h3>{report.title}</h3>
              <p>{report.description}</p>
            </div>
            <div className="report-actions" aria-label={`${report.title} download formats`}>
              {formats.map(({ format, label, icon: Icon }) => (
                <button key={format} type="button" onClick={() => downloadReport(report, format)}>
                  <Icon aria-hidden="true" size={15} />
                  {label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
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
          <PanelHeading
            icon={Target}
            title="Role Capability Map"
            meta="Posting responsibilities mapped to dashboard modules"
          />
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

      <section className="dashboard-grid equal">
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
            <span>Managing unit</span>
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
              <strong>{agreement.managingUnit}</strong>
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
  const [selectedAssetId, setSelectedAssetId] = useState(() => assets[0]?.id ?? "");
  const qualityChart = assets.map((asset) => ({
    name: asset.sourceName,
    quality: asset.qualityStatus === "normal" ? 90 : asset.qualityStatus === "warning" ? 64 : 38,
  }));
  const strategyDecisions = decisions.filter((decision) => decision.domain === "Data Strategy" || decision.domain === "Commercial BI");
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];

  useEffect(() => {
    if (!selectedAsset && assets.length > 0) {
      setSelectedAssetId(assets[0].id);
    }
    if (selectedAsset && !assets.some((asset) => asset.id === selectedAsset.id)) {
      setSelectedAssetId(assets[0]?.id ?? "");
    }
  }, [assets, selectedAsset]);

  return (
    <div className="view-stack">
      <section className="dashboard-grid equal">
        <article className="panel">
          <PanelHeading
            icon={Wrench}
            title="Data Asset Readiness"
            meta="Public anchors are separated from internal feeds so executives can see what is known, what is modeled, and what must be requested"
          />
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
          <PanelHeading
            icon={Users}
            title="Training & Adoption"
            meta="Adoption plan with priority, target date, enablement task, success measure, and risk if skipped"
          />
          <div className="adoption-list">
            {adoptionItems.map((item) => (
              <AdoptionRow item={item} key={item.id} />
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid equal">
        <article className="panel">
          <PanelHeading
            icon={Database}
            title="Data Asset Drilldown"
            meta="Select an asset to inspect its reporting layer, executive question, diagnostic, nuance, and decision use"
          />
          <div className="asset-selector">
            {assets.map((asset) => (
              <button
                type="button"
                className={`asset-option ${asset.qualityStatus} ${selectedAsset?.id === asset.id ? "active" : ""}`}
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
              >
                <span className="airport-code small">{asset.airport}</span>
                <span>{asset.sourceName}</span>
                <ChevronRight aria-hidden="true" size={15} />
              </button>
            ))}
          </div>
        </article>

        {selectedAsset && (
          <article className={`panel asset-detail ${selectedAsset.qualityStatus}`}>
            <div className="metric-topline">
              <SourceBadge source={selectedAsset.source} />
              <StatusPill status={selectedAsset.qualityStatus} />
            </div>
            <h2>{selectedAsset.sourceName}</h2>
            <p>{selectedAsset.commercialUseCase}</p>
            <dl className="detail-list">
              <div>
                <dt>Reporting layer</dt>
                <dd>{selectedAsset.reportingLayer}</dd>
              </div>
              <div>
                <dt>Executive question</dt>
                <dd>{selectedAsset.executiveQuestion}</dd>
              </div>
              <div>
                <dt>Diagnostic</dt>
                <dd>{selectedAsset.diagnostic}</dd>
              </div>
              <div>
                <dt>Data nuance</dt>
                <dd>{selectedAsset.dataNuance}</dd>
              </div>
              <div>
                <dt>Decision use</dt>
                <dd>{selectedAsset.decisionUse}</dd>
              </div>
              <div>
                <dt>Owner / cadence / access</dt>
                <dd>
                  {selectedAsset.owner} | {selectedAsset.refreshCadence} | {selectedAsset.accessStatus}
                </dd>
              </div>
            </dl>
          </article>
        )}
      </section>

      <section className="panel">
        <PanelHeading
          icon={CalendarDays}
          title="First 90 Days Visual Roadmap"
          meta="Priority, target date, progress, and executive signal compressed into a scannable implementation path"
        />
        <RoadmapVisual items={roadmapItems} />
      </section>

      <section className="dashboard-grid equal">
        <article className="panel">
          <PanelHeading icon={CalendarDays} title="First 90 Days Task Map" meta="Task-level path from public evidence to governed BI" />
          <div className="roadmap-list">
            {roadmapItems.map((item) => (
              <RoadmapRow item={item} key={item.id} />
            ))}
          </div>
        </article>

        <article className="panel">
          <PanelHeading icon={ListChecks} title="Strategy Decisions" meta="Choices, required data, delay risk, and review cadence" />
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
        <PanelHeading icon={FileText} title="Evidence Chain" meta="No matching insights for current filters" />
        <div className="empty-state">No matching public-source insights.</div>
      </article>
    );
  }

  return (
    <article className="panel">
      <PanelHeading
        icon={FileText}
        title="Evidence Chain"
        meta="Requirement, cited public fact, trend signal, internal data request, artifact, decision"
      />
      <div className="insight-list">
        {insights.map((insight) => (
          <div className="insight-row" key={insight.id}>
            <div className={`severity-rail ${insight.status}`} />
            <div>
              <div className="row-title">
                {insight.title} <span>{insight.airport}</span>
              </div>
              <p>
                <strong>Posting requirement:</strong> {insight.postingRequirement}
              </p>
              <p>
                <strong>Public source fact:</strong> {insight.publicObservation}
              </p>
              <p>
                <strong>Citation:</strong>{" "}
                <a href={insight.citationUrl} target="_blank" rel="noopener noreferrer">
                  {insight.citationLabel}
                  <ExternalLink aria-hidden="true" size={12} />
                </a>{" "}
                <span className="citation-date">({insight.citationDate})</span>
              </p>
              <p>
                <strong>Trend signal:</strong> {insight.trendSignal}
              </p>
              <p>
                <strong>Commercial analytics question:</strong> {insight.businessQuestion}
              </p>
              <p>
                <strong>Internal data needed:</strong> {insight.internalDataNeeded}
              </p>
              <p>
                <strong>Dashboard artifact:</strong> {insight.dashboardArtifact}
              </p>
              <p>
                <strong>Decision supported:</strong> {insight.decisionSupported}
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
            <dl className="decision-detail-list">
              <div>
                <dt>Rationale</dt>
                <dd>{decision.rationale}</dd>
              </div>
              <div>
                <dt>Choices</dt>
                <dd>{decision.choices.join(" | ")}</dd>
              </div>
              <div>
                <dt>Data required</dt>
                <dd>{decision.dataRequired}</dd>
              </div>
              <div>
                <dt>Risk of delay</dt>
                <dd>{decision.riskOfDelay}</dd>
              </div>
            </dl>
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
                {decision.dueDate} | {decision.nextReview}
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
        <div className="row-title">
          {item.audience} <span>{item.priority} | {item.targetDate}</span>
        </div>
        <p>{item.skillGap}</p>
        <dl className="adoption-detail-list">
          <div>
            <dt>Enablement task</dt>
            <dd>{item.enablementTask}</dd>
          </div>
          <div>
            <dt>Success measure</dt>
            <dd>{item.successMeasure}</dd>
          </div>
          <div>
            <dt>Risk if skipped</dt>
            <dd>{item.riskIfSkipped}</dd>
          </div>
        </dl>
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
        <span className="phase-pill">{item.phase} | {item.priority} | {item.targetDate}</span>
        <div className="row-title">{item.title}</div>
        <p>{item.outcome}</p>
        <div className="progress-track roadmap-progress">
          <div className={item.status} style={{ width: `${item.progress}%` }} />
        </div>
        <strong>{item.executiveSignal}</strong>
        <div className="row-meta">
          <span>{item.owner}</span>
          <SourceBadge source={item.source} />
        </div>
      </div>
      <StatusPill status={item.status} />
    </div>
  );
}

function RoadmapVisual({ items }: { items: RoadmapItem[] }) {
  return (
    <div className="roadmap-visual">
      {items.map((item) => (
        <article className={`roadmap-step ${item.status}`} key={item.id}>
          <div className="roadmap-step-top">
            <span>{item.phase}</span>
            <strong>{item.priority}</strong>
          </div>
          <h3>{item.title}</h3>
          <p>{item.executiveSignal}</p>
          <div className="progress-track">
            <div className={item.status} style={{ width: `${item.progress}%` }} />
          </div>
          <div className="roadmap-step-meta">
            <span>{item.progress}%</span>
            <span>{item.targetDate}</span>
          </div>
        </article>
      ))}
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
