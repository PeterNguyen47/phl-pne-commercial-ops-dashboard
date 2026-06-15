import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileUp,
  FileJson,
  FileSpreadsheet,
  FileText,
  Filter,
  Fuel,
  Gauge,
  GitBranch,
  Landmark,
  ListChecks,
  Plane,
  ShieldAlert,
  Target,
  TrendingUp,
  Upload,
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
  feedConnections,
  insightItems,
  portfolioDrilldowns,
  roadmapItems,
  capabilityAlignment,
  severityRank,
  sourceQualityScores,
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
  FeedConnection,
  InsightItem,
  KpiMetric,
  PortfolioDrilldown,
  PeriodKey,
  RoadmapItem,
  SourceKind,
  SourceQualityScore,
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

interface TemplateFieldProfile {
  name: string;
  mapped: boolean;
  dataType: "Quantitative" | "Qualitative" | "Blank / Unknown";
  sampleValues: string[];
}

interface TemplateProfile {
  fileName: string;
  rowCount: number;
  fields: TemplateFieldProfile[];
  uploadedAt: string;
}

interface PredictionSummary {
  readinessScore: number;
  confidence: number;
  predictedRisk: string;
  recommendedAction: string;
  executiveFocus: string;
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

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Access needed";
  }

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

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current.trim());
  return cells;
}

function inferFieldType(values: string[]): TemplateFieldProfile["dataType"] {
  const populatedValues = values.map((value) => value.trim()).filter(Boolean);

  if (populatedValues.length === 0) {
    return "Blank / Unknown";
  }

  return populatedValues.every((value) => Number.isFinite(Number(value.replace(/[$,%]/g, ""))))
    ? "Quantitative"
    : "Qualitative";
}

function profileRows(fileName: string, headers: string[], rows: string[][], knownColumns: Set<string>): TemplateProfile {
  const normalizedHeaders = headers.map((header, index) => header || `unnamed_column_${index + 1}`);
  const fields = normalizedHeaders.map((header, columnIndex) => {
    const sampleValues = rows.map((row) => row[columnIndex] ?? "").filter(Boolean).slice(0, 3);

    return {
      name: header,
      mapped: knownColumns.has(header.toLowerCase()),
      dataType: inferFieldType(rows.map((row) => row[columnIndex] ?? "")),
      sampleValues,
    };
  });

  return {
    fileName,
    rowCount: rows.length,
    fields,
    uploadedAt: new Date().toLocaleString(),
  };
}

function parseTemplateUpload(fileName: string, text: string, knownColumns: Set<string>): TemplateProfile {
  const trimmed = text.trim();

  if (fileName.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(trimmed) as unknown;
    const records = Array.isArray(parsed) ? parsed : [parsed];
    const objectRecords = records.filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === "object");
    const headers = Array.from(new Set(objectRecords.flatMap((record) => Object.keys(record))));
    const rows = objectRecords.map((record) => headers.map((header) => String(record[header] ?? "")));

    return profileRows(fileName, headers, rows, knownColumns);
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  const rows = lines.slice(1).map(parseCsvLine);

  return profileRows(fileName, headers, rows, knownColumns);
}

function predictTemplateReadiness(templateProfile?: TemplateProfile): PredictionSummary {
  if (!templateProfile) {
    return {
      readinessScore: 58,
      confidence: 46,
      predictedRisk: "No uploaded workstream template yet; forecast uses dashboard fixture coverage only.",
      recommendedAction: "Upload a department or unit template to classify mapped fields, custom fields, and data quality signals.",
      executiveFocus: "Use the first upload to align team workflow fields with centralized metadata without forcing teams to abandon their current process.",
    };
  }

  const mappedCount = templateProfile.fields.filter((field) => field.mapped).length;
  const quantitativeCount = templateProfile.fields.filter((field) => field.dataType === "Quantitative").length;
  const qualitativeCount = templateProfile.fields.filter((field) => field.dataType === "Qualitative").length;
  const fieldCount = Math.max(templateProfile.fields.length, 1);
  const mappedCoverage = mappedCount / fieldCount;
  const mixedEvidenceBonus = quantitativeCount > 0 && qualitativeCount > 0 ? 12 : 0;
  const rowVolumeBonus = Math.min(templateProfile.rowCount, 25);
  const readinessScore = Math.min(96, Math.round(mappedCoverage * 55 + mixedEvidenceBonus + rowVolumeBonus + 18));
  const confidence = Math.min(92, Math.round(42 + mappedCoverage * 30 + Math.min(templateProfile.rowCount, 20)));
  const customCount = templateProfile.fields.length - mappedCount;

  return {
    readinessScore,
    confidence,
    predictedRisk:
      customCount > mappedCount
        ? "High custom-field volume; preserve the workflow, but require metadata definitions before executive rollup."
        : "Template is mostly aligned to dashboard fields; next risk is refresh cadence and owner accountability.",
    recommendedAction:
      customCount > 0
        ? `Register ${customCount} custom field${customCount === 1 ? "" : "s"} as qualitative or quantitative metadata before the next reporting cycle.`
        : "Approve the template as a source candidate for recurring executive reporting.",
    executiveFocus:
      qualitativeCount > 0
        ? "Qualitative inputs can surface staff morale, role friction, tenant sentiment, and customer satisfaction alongside numeric performance."
        : "Add qualitative context fields so the executive view can explain human impact, morale, and service experience beyond numeric performance.",
  };
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
      publicAccessStatus: agreement.publicAccessStatus,
      publicBasis: agreement.publicBasis,
      internalRecordNeeded: agreement.internalRecordNeeded,
      status: agreement.complianceFlag,
      recommendedAction: agreement.recommendedAction,
      source: agreement.source,
    }),
  );
  const feedRows = feedConnections.map((feed) =>
    reportRow("Feed connection", feed.feedName, {
      airport: feed.airport,
      domain: feed.domain,
      accountableOwner: feed.accountableOwner,
      currentState: feed.currentState,
      refreshTarget: feed.refreshTarget,
      firstMetrics: feed.firstMetrics.join(" | "),
      qualityGate: feed.qualityGate,
      executiveUse: feed.executiveUse,
      status: feed.status,
      source: feed.source,
    }),
  );
  const qualityRows = sourceQualityScores.map((score) =>
    reportRow("Source quality", score.sourceName, {
      airport: score.airport,
      accountableOwner: score.accountableOwner,
      overall: `${score.overall}/100`,
      completeness: `${score.completeness}/100`,
      freshness: `${score.freshness}/100`,
      lineage: `${score.lineage}/100`,
      stewardship: `${score.stewardship}/100`,
      nextControl: score.nextControl,
      escalationRule: score.escalationRule,
      status: score.status,
      source: score.source,
    }),
  );
  const portfolioRows = portfolioDrilldowns.map((drilldown) =>
    reportRow("Leadership drilldown", drilldown.audience, {
      airport: drilldown.airport,
      portfolioScope: drilldown.portfolioScope,
      decisionQuestions: drilldown.decisionQuestions.join(" | "),
      publicEvidence: drilldown.publicEvidence,
      feedGaps: drilldown.feedGaps,
      executiveActions: drilldown.executiveActions.join(" | "),
      source: drilldown.source,
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
      secondaryCitation: insight.secondaryCitationLabel ?? "",
      secondaryCitationDate: insight.secondaryCitationDate ?? "",
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
  const portfolioReportRows = [
    ...kpiRows,
    ...verticalRows,
    ...agreementRows,
    ...feedRows,
    ...qualityRows,
    ...portfolioRows,
    ...evidenceRows,
    ...assetRows,
    ...decisionRows,
  ];

  return [
    {
      id: "airport-phl",
      title: "PHL Executive Commercial Portfolio Report",
      scope: "PHL",
      description: "Airport-specific executive report for PHL commercial data, revenue verticals, agreements, and evidence chains.",
      rows: portfolioReportRows.filter(
        (row) => row.airport === "PHL" || row.airport === "ALL" || row.airport === undefined,
      ),
    },
    {
      id: "airport-pne",
      title: "PNE Executive Commercial Asset Report",
      scope: "PNE",
      description: "Airport-specific executive report for PNE hangars, ground leases, development agreements, and governance decisions.",
      rows: portfolioReportRows.filter(
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
        ...qualityRows,
        ...portfolioRows,
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
      description: "Public agreement-access register with managing unit, public basis, internal record gaps, completeness, and recommended action.",
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
        ...feedRows,
        ...qualityRows,
        ...portfolioRows,
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
    {
      id: "source-quality",
      title: "Source Quality And Feed Accountability Report",
      scope: "PHL + PNE",
      description: "Accountable owners, source-quality scores, feed connection status, refresh targets, and escalation rules.",
      rows: [...qualityRows, ...feedRows],
    },
  ];
}

function App() {
  const [selectedView, setSelectedView] = useState<ViewKey>("cockpit");
  const [selectedAirport, setSelectedAirport] = useState<AirportCode>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [templateProfile, setTemplateProfile] = useState<TemplateProfile>();
  const [templateError, setTemplateError] = useState("");
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
  const scopedFeeds = useMemo(
    () => filterBySeverity(filterByAirport(feedConnections, selectedAirport), severityFilter, (item) => item.status),
    [selectedAirport, severityFilter],
  );
  const scopedSourceQuality = useMemo(
    () => filterBySeverity(filterByAirport(sourceQualityScores, selectedAirport), severityFilter, (item) => item.status),
    [selectedAirport, severityFilter],
  );
  const scopedPortfolioDrilldowns = useMemo(
    () => portfolioDrilldowns.filter((item) => selectedAirport === "ALL" || item.airport === selectedAirport),
    [selectedAirport],
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
  const knownReportColumns = useMemo(
    () => new Set(reportDefinitions.flatMap((report) => report.rows.flatMap((row) => Object.keys(row).map((key) => key.toLowerCase())))),
    [reportDefinitions],
  );
  const predictionSummary = useMemo(() => predictTemplateReadiness(templateProfile), [templateProfile]);

  async function handleTemplateUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setTemplateProfile(parseTemplateUpload(file.name, text, knownReportColumns));
      setTemplateError("");
    } catch (error) {
      setTemplateProfile(undefined);
      setTemplateError(error instanceof Error ? error.message : "Unable to read the uploaded template.");
    } finally {
      event.currentTarget.value = "";
    }
  }

  return (
    <div className="app-shell">
      <div className="city-service-bar">
        <span>City of Philadelphia</span>
        <span className="service-separator" aria-hidden="true">
          {" / "}
        </span>
        <strong>Department of Aviation</strong>
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
          <div className="filter-help" aria-live="polite">
            Airport scopes records, period changes trend snapshots, and status narrows action/watch items.
          </div>
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

      <ReportCenter
        reports={reportDefinitions}
        templateProfile={templateProfile}
        templateError={templateError}
        prediction={predictionSummary}
        onTemplateUpload={handleTemplateUpload}
      />

      <ProvenanceExplainer />

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
            feeds={scopedFeeds}
            sourceQualityScores={scopedSourceQuality}
            portfolioDrilldowns={scopedPortfolioDrilldowns}
            chartData={chartData}
            isCompact={isCompact}
            templateProfile={templateProfile}
            prediction={predictionSummary}
            onTemplateUpload={handleTemplateUpload}
          />
        )}
        {selectedView === "revenue" && (
          <RevenueVerticals
            verticals={scopedVerticals}
            insights={scopedInsights}
            chartData={chartData}
            isCompact={isCompact}
            prediction={predictionSummary}
          />
        )}
        {selectedView === "agreements" && (
          <AgreementGovernance agreements={scopedAgreements} decisions={scopedDecisions} isCompact={isCompact} />
        )}
        {selectedView === "roadmap" && (
          <DataStrategyRoadmap
            assets={scopedAssets}
            decisions={scopedDecisions}
            feeds={scopedFeeds}
            sourceQualityScores={scopedSourceQuality}
            portfolioDrilldowns={scopedPortfolioDrilldowns}
            isCompact={isCompact}
          />
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

      <div className="civic-footer">
        <p>
          Interface pattern guided by{" "}
          <a href="https://ui.phila.gov/" target="_blank" rel="noopener noreferrer">
            PhilaUI
          </a>{" "}
          and the CityOfPhiladelphia/phila-ui reference.
        </p>
      </div>
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
            className={`${value === option.value ? "active" : ""} filter-${option.value}`}
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

function ReportCenter({
  reports,
  templateProfile,
  templateError,
  prediction,
  onTemplateUpload,
}: {
  reports: ReportDefinition[];
  templateProfile?: TemplateProfile;
  templateError: string;
  prediction: PredictionSummary;
  onTemplateUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
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
          <h2>Executive exports and workstream template intake</h2>
          <p>
            Reports can follow department, unit, or workstream templates. Teams may keep their current workflow,
            upload their filled template, and add new qualitative or quantitative fields for centralized metadata
            reporting.
          </p>
        </div>
        <Download aria-hidden="true" size={22} />
      </div>
      <div className="template-intake">
        <div>
          <p className="eyebrow">Metadata Intake</p>
          <h3>Upload a workstream template</h3>
          <p>
            Upload a CSV or JSON file from a unit such as parking, concessions, PNE administration, contracts, or IT.
            Columns not currently in the dashboard are preserved as custom metadata so they can be tracked rather than
            discarded.
          </p>
        </div>
        <label className="upload-control">
          <Upload aria-hidden="true" size={16} />
          Upload template
          <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onTemplateUpload} />
        </label>
      </div>
      <div className="template-results">
        <article className="prediction-card">
          <div className="metric-topline">
            <span className="source-badge illustrative-model">Illustrative ML Model</span>
            <Brain aria-hidden="true" size={18} />
          </div>
          <h3>Upload readiness prediction</h3>
          <div className="prediction-score">{prediction.readinessScore}/100</div>
          <p>{prediction.predictedRisk}</p>
          <p>
            <strong>Recommended action:</strong> {prediction.recommendedAction}
          </p>
          <p>
            <strong>Executive focus:</strong> {prediction.executiveFocus}
          </p>
          <small>Confidence {prediction.confidence}% after the latest upload/refresh.</small>
        </article>
        <article className="template-profile-card">
          <h3>{templateProfile ? templateProfile.fileName : "No template uploaded"}</h3>
          {templateError && <p className="template-error">{templateError}</p>}
          {templateProfile ? (
            <>
              <p>
                {templateProfile.rowCount} rows | {templateProfile.fields.length} fields | Uploaded {templateProfile.uploadedAt}
              </p>
              <div className="field-chip-list">
                {templateProfile.fields.slice(0, 10).map((field) => (
                  <span className={field.mapped ? "mapped" : "custom"} key={field.name}>
                    {field.name} | {field.mapped ? "Mapped" : "Custom"} | {field.dataType}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p>
              Use this intake to test how team-owned templates would feed centralized executive reporting while
              preserving local columns for morale, satisfaction, notes, exceptions, or other qualitative context.
            </p>
          )}
        </article>
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

function ProvenanceExplainer() {
  return (
    <section className="provenance-explainer" aria-label="Data provenance and metadata model">
      <article>
        <SourceBadge source="Public Source" />
        <h3>Public Source</h3>
        <p>
          Public information anchors the context: airport facts, City records, federal aviation datasets, and published
          guidance. It is credible for framing questions, but it does not replace unit-owned operational records.
        </p>
      </article>
      <article>
        <SourceBadge source="Illustrative Model" />
        <h3>Illustrative Model</h3>
        <p>
          Illustrative values represent how team workflows could feed a centralized metadata layer. Teams can keep their
          own templates and add local columns while the system classifies fields for executive reporting.
        </p>
      </article>
      <article>
        <SourceBadge source="Derived From Public" />
        <h3>Decision Metadata</h3>
        <p>
          The goal is not only numeric reporting. Qualitative fields such as staff morale, role friction, tenant
          sentiment, customer satisfaction, and workflow blockers can explain why a metric is moving.
        </p>
      </article>
    </section>
  );
}

function CommercialBiCockpit({
  kpis,
  risks,
  insights,
  decisions,
  feeds,
  sourceQualityScores,
  portfolioDrilldowns,
  chartData,
  isCompact,
  templateProfile,
  prediction,
  onTemplateUpload,
}: {
  kpis: KpiMetric[];
  risks: DomainRisk[];
  insights: InsightItem[];
  decisions: DecisionItem[];
  feeds: FeedConnection[];
  sourceQualityScores: SourceQualityScore[];
  portfolioDrilldowns: PortfolioDrilldown[];
  chartData: Array<{
    label: string;
    opportunity: number;
    dataReadiness: number;
    agreementCompleteness: number;
    adoption: number;
  }>;
  isCompact: boolean;
  templateProfile?: TemplateProfile;
  prediction: PredictionSummary;
  onTemplateUpload: (event: ChangeEvent<HTMLInputElement>) => void;
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
          <div className="maturity-brief">
            <div>
              <h3>What the path means</h3>
              <p>
                The graph links template intake, agreement taxonomy, dashboard adoption, and modeled revenue risk.
                As teams submit refreshed reports, a future production model would re-score data readiness, flag
                quality issues, and recommend executive remediation actions.
              </p>
            </div>
            <div className="maturity-upload">
              <span className="source-badge illustrative-model">ML-ready intake</span>
              <strong>{prediction.readinessScore}/100 readiness</strong>
              <small>{templateProfile ? templateProfile.fileName : "Awaiting workstream upload"}</small>
              <label className="upload-control compact-upload">
                <FileUp aria-hidden="true" size={15} />
                Upload template
                <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onTemplateUpload} />
              </label>
            </div>
          </div>
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
        <InsightPanel insights={insights} prediction={prediction} />
      </section>

      <section className="dashboard-grid equal">
        <SourceQualityPanel scores={sourceQualityScores} />
        <PortfolioDrilldownPanel drilldowns={portfolioDrilldowns} />
      </section>

      <section className="panel">
        <PanelHeading
          icon={GitBranch}
          title="Feed Connection Blueprint"
          meta={`${feeds.length} scoped feeds with owner, refresh target, quality gate, and executive use`}
        />
        <FeedConnectionRows feeds={feeds} />
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
  prediction,
}: {
  verticals: CommercialVerticalMetric[];
  insights: InsightItem[];
  chartData: Array<{ label: string; opportunity: number }>;
  isCompact: boolean;
  prediction: PredictionSummary;
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

        <InsightPanel insights={insights} prediction={prediction} />
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
  }));
  const agreementDecisions = decisions.filter((decision) => decision.domain === "Lease Governance");
  const publicAccessCount = agreements.filter((agreement) => agreement.source === "Public Source").length;

  return (
    <div className="view-stack">
      <section className="summary-strip">
        <SummaryTile icon={Briefcase} label="Agreement access records" value={String(agreements.length)} source="Public Source" />
        <SummaryTile
          icon={Gauge}
          label="Avg completeness"
          value={`${Math.round(agreements.reduce((sum, item) => sum + item.completeness, 0) / Math.max(agreements.length, 1))}%`}
          source="Derived From Public"
        />
        <SummaryTile
          icon={FileText}
          label="Publicly anchored"
          value={`${publicAccessCount}/${agreements.length}`}
          source="Public Source"
        />
        <SummaryTile
          icon={AlertTriangle}
          label="Internal records needed"
          value={String(agreements.filter((item) => item.source !== "Public Source" || item.value === null).length)}
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
        <PanelHeading
          icon={Briefcase}
          title="Public Agreement Access Register"
          meta="Public agreement signals are separated from internal lease economics, amendments, tenant terms, and compliance records"
        />
        <div className="agreement-table" role="table" aria-label="Agreement register model">
          <div className="agreement-header" role="row">
            <span>Public agreement signal</span>
            <span>Managing unit</span>
            <span>Access</span>
            <span>Completeness</span>
            <span>Internal record needed</span>
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
              <div className="access-cell">
                <strong>{agreement.publicAccessStatus}</strong>
                <small>{agreement.publicBasis}</small>
              </div>
              <div className="sla-cell">
                <span>{agreement.completeness}%</span>
                <div className="progress-track">
                  <div className={agreement.complianceFlag} style={{ width: `${agreement.completeness}%` }} />
                </div>
              </div>
              <p>{agreement.internalRecordNeeded}</p>
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
  feeds,
  sourceQualityScores,
  portfolioDrilldowns,
  isCompact,
}: {
  assets: DataAsset[];
  decisions: DecisionItem[];
  feeds: FeedConnection[];
  sourceQualityScores: SourceQualityScore[];
  portfolioDrilldowns: PortfolioDrilldown[];
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

      <section className="dashboard-grid equal">
        <SourceQualityPanel scores={sourceQualityScores} />
        <PortfolioDrilldownPanel drilldowns={portfolioDrilldowns} />
      </section>

      <section className="panel">
        <PanelHeading
          icon={GitBranch}
          title="Production Feed Connection Plan"
          meta="Parking, concessions, ground transportation, cargo, gate, schedule, and PNE asset feeds mapped to owners"
        />
        <FeedConnectionRows feeds={feeds} />
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

function SourceQualityPanel({ scores }: { scores: SourceQualityScore[] }) {
  if (scores.length === 0) {
    return (
      <article className="panel">
        <PanelHeading icon={Target} title="Source Quality Scorecard" meta="No matching sources for current filters" />
        <div className="empty-state">No source-quality records match the current filters.</div>
      </article>
    );
  }

  return (
    <article className="panel">
      <PanelHeading
        icon={Target}
        title="Source Quality Scorecard"
        meta="Accountable owners, four-part score, next control, and escalation rule"
      />
      <div className="quality-list">
        {scores.map((score) => {
          const componentScores: Array<[string, number]> = [
            ["Completeness", score.completeness],
            ["Freshness", score.freshness],
            ["Lineage", score.lineage],
            ["Stewardship", score.stewardship],
          ];

          return (
            <div className={`quality-row ${score.status}`} key={score.id}>
              <div className="quality-score">
                <span>Score</span>
                <strong>{score.overall}/100</strong>
              </div>
              <div>
                <div className="row-title">
                  {score.sourceName} <span>{score.airport}</span>
                </div>
                <p>
                  <strong>Owner:</strong> {score.accountableOwner}
                </p>
                <div className="quality-bars" aria-label={`${score.sourceName} component scores`}>
                  {componentScores.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <div className="progress-track">
                        <div className={score.status} style={{ width: `${value}%` }} />
                      </div>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <p>
                  <strong>Next control:</strong> {score.nextControl}
                </p>
                <p>
                  <strong>Escalation:</strong> {score.escalationRule}
                </p>
                <SourceBadge source={score.source} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function FeedConnectionRows({ feeds }: { feeds: FeedConnection[] }) {
  if (feeds.length === 0) {
    return <div className="empty-state">No feed connections match the current filters.</div>;
  }

  return (
    <div className="feed-grid">
      {feeds.map((feed) => (
        <article className={`feed-card ${feed.status}`} key={feed.id}>
          <div className="metric-topline">
            <span className="airport-code small">{feed.airport}</span>
            <StatusPill status={feed.status} />
          </div>
          <h3>{feed.feedName}</h3>
          <p>{feed.currentState}</p>
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>{feed.accountableOwner}</dd>
            </div>
            <div>
              <dt>Refresh target</dt>
              <dd>{feed.refreshTarget}</dd>
            </div>
            <div>
              <dt>First metrics</dt>
              <dd>{feed.firstMetrics.join(", ")}</dd>
            </div>
            <div>
              <dt>Quality gate</dt>
              <dd>{feed.qualityGate}</dd>
            </div>
            <div>
              <dt>Executive use</dt>
              <dd>{feed.executiveUse}</dd>
            </div>
          </dl>
          <SourceBadge source={feed.source} />
        </article>
      ))}
    </div>
  );
}

function PortfolioDrilldownPanel({ drilldowns }: { drilldowns: PortfolioDrilldown[] }) {
  if (drilldowns.length === 0) {
    return (
      <article className="panel">
        <PanelHeading icon={Landmark} title="Leadership Portfolio Drilldowns" meta="No matching audience view" />
        <div className="empty-state">No portfolio drilldowns match the current airport filter.</div>
      </article>
    );
  }

  return (
    <article className="panel">
      <PanelHeading
        icon={Landmark}
        title="Leadership Portfolio Drilldowns"
        meta="PHL and PNE leadership lenses with decision questions, feed gaps, and executive actions"
      />
      <div className="portfolio-drilldown-list">
        {drilldowns.map((drilldown) => (
          <div className="portfolio-drilldown" key={drilldown.id}>
            <div className="metric-topline">
              <span className="airport-code small">{drilldown.airport}</span>
              <SourceBadge source={drilldown.source} />
            </div>
            <h3>{drilldown.audience}</h3>
            <p>{drilldown.portfolioScope}</p>
            <dl className="detail-list">
              <div>
                <dt>Decision questions</dt>
                <dd>{drilldown.decisionQuestions.join(" | ")}</dd>
              </div>
              <div>
                <dt>Public evidence</dt>
                <dd>{drilldown.publicEvidence}</dd>
              </div>
              <div>
                <dt>Feed gaps</dt>
                <dd>{drilldown.feedGaps}</dd>
              </div>
              <div>
                <dt>Executive actions</dt>
                <dd>{drilldown.executiveActions.join(" | ")}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </article>
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
              <span>Score</span>
              <strong>{risk.score}/100</strong>
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

function InsightPanel({ insights, prediction }: { insights: InsightItem[]; prediction?: PredictionSummary }) {
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
                {insight.secondaryCitationUrl && insight.secondaryCitationLabel && (
                  <>
                    {" "}
                    <span className="citation-date">also</span>{" "}
                    <a href={insight.secondaryCitationUrl} target="_blank" rel="noopener noreferrer">
                      {insight.secondaryCitationLabel}
                      <ExternalLink aria-hidden="true" size={12} />
                    </a>{" "}
                    <span className="citation-date">({insight.secondaryCitationDate})</span>
                  </>
                )}
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
      {prediction && (
        <div className="ml-evidence-note">
          <Brain aria-hidden="true" size={18} />
          <div>
            <h3>Predictive refresh layer</h3>
            <p>
              Each template upload or data refresh can update readiness, confidence, and risk signals. The executive
              decision layer can then compare current evidence against predicted risk and choose remediation, escalation,
              or a deeper unit review.
            </p>
            <strong>
              Current prediction: {prediction.readinessScore}/100 readiness, {prediction.confidence}% confidence.
            </strong>
          </div>
        </div>
      )}
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
