/**
 * Request body: a raw string, or JSON that gets stringified before sending
 */
export type RequestBody = string | unknown[] | Record<string, unknown> | undefined;

/**
 * Generic request format (default)
 */
export interface GenericRequest {
  url?: string;
  referenceUrl?: string;
  targetUrl?: string;
  method?: string;
  body?: RequestBody;
  headers?: Record<string, string>;
  name?: string;  // Optional display name for the request
}

/**
 * Configuration for reference or target environment
 */
export interface EnvironmentConfiguration {
  variables?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * Top-level configuration for requests file
 */
export interface RequestFileConfiguration {
  referenceBaseUrl?: string;
  targetBaseUrl?: string;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
  referenceConfiguration?: EnvironmentConfiguration;
  targetConfiguration?: EnvironmentConfiguration;
}

/**
 * New structured format for request files
 */
export interface StructuredRequestFile {
  configuration?: RequestFileConfiguration;
  requests: GenericRequest[];
}

/**
 * Parsed configuration with merged values
 */
export interface ParsedConfiguration {
  referenceVariables: Record<string, any>;
  targetVariables: Record<string, any>;
  referenceHeaders: Record<string, string>;
  targetHeaders: Record<string, string>;
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
 * The request as it was actually put on the wire, after variable replacement
 * and body serialization. Reported verbatim so the report cannot drift from
 * what was really sent.
 */
export interface SentRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
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
  request?: SentRequest;
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
  referenceName?: string;
  targetName?: string;
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
    request?: SentRequest;
  };
  target: {
    statusCode: number;
    statusText: string;
    body?: unknown;
    duration: number;
    error?: string;
    headers?: Record<string, string>;
    request?: SentRequest;
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
  referenceName?: string;
  targetName?: string;
  referenceHeaders?: Record<string, string>;
  targetHeaders?: Record<string, string>;
  from?: number;
  limit?: number;
  noTimestampInReportFilenames?: boolean;
  normalizedJsonComparison?: boolean;
  stripUrls?: boolean;
  normalizeUrls?: boolean;
  stripMoreUrls?: string[];
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
  inputRequests: GenericRequest[];  // Deprecated: kept for backward compatibility
  inputFile: StructuredRequestFile;  // Full structured input file with configuration
  inputFileName?: string;
  reportBaseName?: string;
}
