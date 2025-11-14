/**
 * Generic request format (default)
 */
export interface GenericRequest {
  url?: string;
  referenceUrl?: string;
  targetUrl?: string;
  method?: string;
  body?: string | Record<string, unknown>;
  headers?: Record<string, string>;
  name?: string;  // Optional display name for the request
}

/**
 * Restfox export format types
 */
export interface RestfoxExport {
  exportedFrom: string;
  collection: Array<RestfoxRequestGroup | RestfoxRequest>;
}

export interface RestfoxRequestGroup {
  _id: string;
  _type: "request_group";
  name: string;
  parentId: string | null;
  workspaceId: string;
  collapsed: boolean;
  currentEnvironment?: string;
  sortOrder: number;
  environments?: Array<{
    name: string;
    environment: Record<string, unknown>;
  }>;
  environment?: Record<string, unknown>;
  plugins?: unknown[];
}

export interface RestfoxRequest {
  _type: "request";
  _id: string;
  name: string;
  method: string;
  url: string;
  body: {
    mimeType: string;
    text?: string;
  };
  parameters?: Array<{
    name: string;
    value: string;
  }>;
  pathParameters?: unknown[];
  headers?: Array<{
    name: string;
    value: string;
  }>;
  sortOrder: number;
  parentId: string;
  workspaceId: string;
  plugins?: unknown[];
}

/**
 * API response data
 */
export interface ApiResponse {
  statusCode: number;
  statusText: string;
  body: unknown;
  duration: number;
  error?: string;
}

/**
 * Comparison result for a single request
 */
export interface ComparisonResult {
  name: string;
  method: string;
  url: string;
  referenceUrl?: string;
  targetUrl?: string;
  referenceBaseUrl: string;
  targetBaseUrl: string;
  referenceRequestHeaders?: Record<string, string>;
  targetRequestHeaders?: Record<string, string>;
  requestBody?: unknown;
  reference: {
    statusCode: number;
    statusText: string;
    body?: unknown;
    duration: number;
    error?: string;
    headers?: Record<string, string>;
  };
  target: {
    statusCode: number;
    statusText: string;
    body?: unknown;
    duration: number;
    error?: string;
    headers?: Record<string, string>;
  };
  differences: Difference[];
}

export interface Difference {
  type: "status_code" | "body";
  message: string;
  expected?: unknown;
  actual?: unknown;
  diffBlocks?: DiffBlock[];
}

export interface DiffBlock {
  lines: AlignedDiffLine[];
  skipped: boolean;  // true for separator blocks
}

export interface AlignedDiffLine {
  left: DiffLine | null;
  right: DiffLine | null;
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber?: number;
}

/**
 * CLI Options
 */
export interface CliOptions {
  action: "compare" | "report";
  inputFile: string;
  inputFileType?: "generic" | "restfox";
  referenceBaseUrl?: string;
  targetBaseUrl?: string;
  referenceHeaders?: Record<string, string>;
  targetHeaders?: Record<string, string>;
  limit?: number;
  noTimestampInReportFilenames?: boolean;
  normalizedJsonComparison?: boolean;
  outputFile?: string;
  outputDir?: string;
}

/**
 * Final report structure
 */
export interface ComparisonReport {
  timestamp: string;
  commandLine: string;
  options: Partial<CliOptions>;
  results: ComparisonResult[];
  inputRequests: GenericRequest[];
  inputFileName?: string;
  reportBaseName?: string;
}
