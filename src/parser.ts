import type { GenericRequest, RequestBody, RestfoxExport, RestfoxRequest, StructuredRequestFile, ParsedConfiguration } from "./types";

/**
 * Parse a generic JSON file - supports both legacy array format and new structured format
 */
export async function parseGenericFile(filePath: string): Promise<{ requests: GenericRequest[], configuration: ParsedConfiguration, structuredFile: StructuredRequestFile }> {
  const file = Bun.file(filePath);
  const content = await file.text();
  const data = JSON.parse(content);

  // Check if it's the new structured format
  if (data && typeof data === 'object' && 'requests' in data && Array.isArray(data.requests)) {
    const structured = data as StructuredRequestFile;
    const configuration = parseConfiguration(structured.configuration);
    return { requests: structured.requests, configuration, structuredFile: structured };
  }
  
  // Legacy format: just an array of requests
  if (Array.isArray(data)) {
    const configuration: ParsedConfiguration = {
      referenceVariables: {},
      targetVariables: {},
      referenceHeaders: {},
      targetHeaders: {}
    };
    // Convert legacy format to structured format
    const structuredFile: StructuredRequestFile = {
      requests: data as GenericRequest[]
    };
    return { requests: data as GenericRequest[], configuration, structuredFile };
  }

  throw new Error("Generic JSON file must be either an array of requests (legacy) or an object with 'requests' property (new format)");
}

/**
 * Parse and merge configuration from structured format
 */
function parseConfiguration(config?: RequestFileConfiguration): ParsedConfiguration {
  const result: ParsedConfiguration = {
    referenceVariables: {},
    targetVariables: {},
    referenceHeaders: {},
    targetHeaders: {}
  };

  if (!config) return result;

  // Base variables and headers apply to both
  const baseVariables = config.variables || {};
  const baseHeaders = config.headers || {};

  // Reference: base + reference-specific (reference overrides base)
  result.referenceVariables = { ...baseVariables, ...(config.referenceConfiguration?.variables || {}) };
  result.referenceHeaders = { ...baseHeaders, ...(config.referenceConfiguration?.headers || {}) };

  // Target: base + target-specific (target overrides base)
  result.targetVariables = { ...baseVariables, ...(config.targetConfiguration?.variables || {}) };
  result.targetHeaders = { ...baseHeaders, ...(config.targetConfiguration?.headers || {}) };

  return result;
}

/**
 * Parse a Restfox export file and convert to generic format
 */
export async function parseRestfoxFile(filePath: string): Promise<GenericRequest[]> {
  const file = Bun.file(filePath);
  const content = await file.text();
  const data: RestfoxExport = JSON.parse(content);

  // Filter out only requests (not request groups)
  const restfoxRequests = data.collection.filter(
    (item): item is RestfoxRequest => item._type === "request"
  );

  // Convert to generic format
  return restfoxRequests.map((request) => {
    const generic: GenericRequest = {
      url: request.url,
      method: request.method,
      name: request.name,  // Preserve the request name
    };

    // Add body if present
    if (request.body && request.body.mimeType !== "No Body" && request.body.text) {
      generic.body = request.body.text;
    }

    // Add headers if present
    if (request.headers && request.headers.length > 0) {
      generic.headers = {};
      for (const header of request.headers) {
        generic.headers[header.name] = header.value;
      }
    }

    return generic;
  });
}

/**
 * Replace {{baseUrl}} placeholder in URL with actual base URL
 */
export function replaceBaseUrl(url: string, baseUrl: string): string {
  return url.replace(/\{\{baseUrl\}\}/g, baseUrl);
}

/**
 * Replace all variable placeholders in a string
 */
export function replaceVariables(text: string, variables: Record<string, any>): string {
  let result = text;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(placeholder, String(value));
  }
  
  return result;
}

/**
 * Replace variables in request body (if it's a string or object with string values)
 */
export function replaceVariablesInBody(body: RequestBody, variables: Record<string, any>): RequestBody {
  if (!body) return body;

  if (typeof body === 'string') {
    return replaceVariables(body, variables);
  }

  // Arrays must stay arrays: rebuilding them as objects would send {"0":...} instead of [...]
  if (Array.isArray(body)) {
    return body.map(item => replaceVariablesInValue(item, variables));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    result[key] = replaceVariablesInValue(value, variables);
  }

  return result;
}

/**
 * Replace variables in an arbitrary body value, preserving its type
 */
function replaceVariablesInValue(value: unknown, variables: Record<string, any>): unknown {
  if (typeof value === 'string') {
    return replaceVariables(value, variables);
  }

  if (value !== null && typeof value === 'object') {
    return replaceVariablesInBody(value as RequestBody, variables);
  }

  return value;
}

/**
 * Replace placeholders in headers
 */
export function replaceHeaderPlaceholders(
  headers: Record<string, string> | undefined,
  replacements: Record<string, string>
): Record<string, string> {
  if (!headers) return {};

  const result: Record<string, string> = {};
  
  for (const [name, value] of Object.entries(headers)) {
    let replacedValue = value;
    
    // Replace placeholders like {{apiKey}}
    for (const [key, replaceValue] of Object.entries(replacements)) {
      replacedValue = replacedValue.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), replaceValue);
    }
    
    result[name] = replacedValue;
  }

  return result;
}
