import equal from "fast-deep-equal";
import { diffLines } from "diff";
import type { ApiResponse, Difference, DiffLine, DiffBlock, GenericRequest } from "./types";
import { replaceBaseUrl, replaceHeaderPlaceholders } from "./parser";

/**
 * Get standard HTTP status text for a status code
 */
function getStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    0: "Error",
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  
  return statusTexts[statusCode] || "";
}

/**
 * Make an HTTP request and return the response details
 */
export async function makeRequest(
  request: GenericRequest,
  baseUrl: string,
  headerReplacements: Record<string, string> = {},
  additionalHeaders: Record<string, string> = {},
  urlType: 'reference' | 'target' = 'reference'
): Promise<ApiResponse> {
  // Determine which URL to use: referenceUrl/targetUrl if specified, otherwise use url with baseUrl replacement
  let url: string;
  if (urlType === 'reference' && request.referenceUrl) {
    url = replaceBaseUrl(request.referenceUrl, baseUrl);
  } else if (urlType === 'target' && request.targetUrl) {
    url = replaceBaseUrl(request.targetUrl, baseUrl);
  } else if (request.url) {
    url = replaceBaseUrl(request.url, baseUrl);
  } else {
    throw new Error('No URL specified in request');
  }
  
  const method = request.method || "GET";
  
  let headers: Record<string, string> = {};
  if (request.headers) {
    headers = replaceHeaderPlaceholders(request.headers, headerReplacements);
  }
  
  // Merge additional headers (from command line)
  headers = { ...headers, ...additionalHeaders };
  
  const startTime = performance.now();

  try {
    // Prepare request body if present
    let requestBody: string | undefined;
    if (request.body) {
      // If body is already a string, use it as-is
      // If body is an object, stringify it and set Content-Type header
      if (typeof request.body === 'string') {
        requestBody = request.body;
      } else {
        requestBody = JSON.stringify(request.body);
        // Set Content-Type header if not already present
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });

    const duration = performance.now() - startTime;
    
    let responseBody: unknown;
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    return {
      statusCode: response.status,
      statusText: response.statusText || getStatusText(response.status),
      body: responseBody,
      duration,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      statusCode: 0,
      statusText: "Error",
      body: null,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Compare two API responses and return the differences
 */
export function compareResponses(
  reference: ApiResponse,
  target: ApiResponse,
  useNormalizedComparison: boolean = false
): Difference[] {
  const differences: Difference[] = [];

  // Compare status codes
  if (reference.statusCode !== target.statusCode) {
    differences.push({
      type: "status_code",
      message: `Status code mismatch: expected ${reference.statusCode}, got ${target.statusCode}`,
      expected: reference.statusCode,
      actual: target.statusCode,
    });
  }

  // Compare bodies based on content type
  const isReferenceJson = isJsonContent(reference.body);
  const isTargetJson = isJsonContent(target.body);

  if (isReferenceJson && isTargetJson) {
    // Both are JSON
    if (useNormalizedComparison) {
      // Use deep equality comparison (normalized, ignores key order)
      if (!equal(reference.body, target.body)) {
        const diffBlocks = calculateDiff(reference.body, target.body, true);
        differences.push({
          type: "body",
          message: "Response body differs (normalized comparison)",
          expected: reference.body,
          actual: target.body,
          diffBlocks,
        });
      }
    } else {
      // Use strict JSON string comparison (key order matters)
      const refString = JSON.stringify(reference.body);
      const targetString = JSON.stringify(target.body);
      if (refString !== targetString) {
        const diffBlocks = calculateDiff(reference.body, target.body, false);
        differences.push({
          type: "body",
          message: "Response body differs (strict comparison)",
          expected: reference.body,
          actual: target.body,
          diffBlocks,
        });
      }
    }
  } else if (!isReferenceJson && !isTargetJson) {
    // Both are strings - use direct string comparison
    if (reference.body !== target.body) {
      const diffBlocks = calculateDiff(reference.body, target.body, false);
      differences.push({
        type: "body",
        message: "Response body differs (string comparison)",
        expected: reference.body,
        actual: target.body,
        diffBlocks,
      });
    }
  } else {
    // Mixed types - one is JSON, other is string
    const diffBlocks = calculateDiff(reference.body, target.body, false);
    differences.push({
      type: "body",
      message: `Response body type mismatch: reference is ${isReferenceJson ? "JSON" : "string"}, target is ${isTargetJson ? "JSON" : "string"}`,
      expected: reference.body,
      actual: target.body,
      diffBlocks,
    });
  }

  return differences;
}

/**
 * Check if content is JSON (object or array, not a string)
 */
function isJsonContent(data: unknown): boolean {
  return typeof data === "object" && data !== null;
}

/**
 * Normalize JSON by parsing and stringifying to ensure consistent comparison
 */
export function normalizeJson(data: unknown): unknown {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

/**
 * Sort JSON object keys recursively for normalized comparison
 */
function sortJsonKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sortJsonKeys(item));
  }
  
  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortJsonKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  
  return obj;
}

/**
 * Calculate diff lines between two values with proper alignment
 */
function calculateDiff(expected: unknown, actual: unknown, useNormalizedComparison: boolean = false): DiffBlock[] {
  let expectedStr: string;
  let actualStr: string;
  
  if (useNormalizedComparison && typeof expected === "object" && typeof actual === "object") {
    // Sort keys for normalized comparison
    expectedStr = JSON.stringify(sortJsonKeys(expected), null, 2);
    actualStr = JSON.stringify(sortJsonKeys(actual), null, 2);
  } else {
    expectedStr = typeof expected === "string" 
      ? expected 
      : JSON.stringify(expected, null, 2);
    actualStr = typeof actual === "string" 
      ? actual 
      : JSON.stringify(actual, null, 2);
  }

  const diff = diffLines(expectedStr, actualStr);
  
  // Create aligned lines for both sides
  interface AlignedLine {
    left: DiffLine | null;
    right: DiffLine | null;
  }
  
  const alignedLines: AlignedLine[] = [];
  let leftLineNum = 0;
  let rightLineNum = 0;

  for (const part of diff) {
    const lines = part.value.split('\n');
    // Remove last empty line if exists
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    for (const lineContent of lines) {
      if (part.added) {
        // Added line: only on the right (target)
        rightLineNum++;
        alignedLines.push({
          left: null,
          right: { type: "added", content: lineContent, lineNumber: rightLineNum }
        });
      } else if (part.removed) {
        // Removed line: only on the left (reference)
        leftLineNum++;
        alignedLines.push({
          left: { type: "removed", content: lineContent, lineNumber: leftLineNum },
          right: null
        });
      } else {
        // Unchanged line: on both sides
        leftLineNum++;
        rightLineNum++;
        alignedLines.push({
          left: { type: "unchanged", content: lineContent, lineNumber: leftLineNum },
          right: { type: "unchanged", content: lineContent, lineNumber: rightLineNum }
        });
      }
    }
  }

  // Now create context-aware blocks (±5 lines around changes)
  const CONTEXT_LINES = 5;
  const blocks: DiffBlock[] = [];
  const changedIndices = new Set<number>();
  
  // Find all changed line indices
  alignedLines.forEach((line, idx) => {
    if (line.left?.type !== "unchanged" || line.right?.type !== "unchanged") {
      changedIndices.add(idx);
    }
  });

  if (changedIndices.size === 0) {
    // No changes, return all aligned lines in one block
    return [{ lines: alignedLines, skipped: false }];
  }

  // Expand to include context lines
  const includedIndices = new Set<number>();
  changedIndices.forEach(idx => {
    for (let i = Math.max(0, idx - CONTEXT_LINES); i <= Math.min(alignedLines.length - 1, idx + CONTEXT_LINES); i++) {
      includedIndices.add(i);
    }
  });

  // Create blocks from continuous ranges - store aligned lines
  const sortedIndices = Array.from(includedIndices).sort((a, b) => a - b);
  let currentBlock: AlignedLine[] = [];
  let lastIdx = -2;

  for (const idx of sortedIndices) {
    if (idx !== lastIdx + 1 && currentBlock.length > 0) {
      // Gap detected, save current block and add separator
      blocks.push({ 
        lines: currentBlock as any, // We'll handle AlignedLine[] in the template
        skipped: false 
      });
      blocks.push({ lines: [], skipped: true });
      currentBlock = [];
    }
    currentBlock.push(alignedLines[idx]);
    lastIdx = idx;
  }

  // Add the last block
  if (currentBlock.length > 0) {
    blocks.push({ 
      lines: currentBlock as any,
      skipped: false 
    });
  }

  return blocks;
}
