import type { GenericRequest, RestfoxExport, RestfoxRequest } from "./types";

/**
 * Parse a generic JSON file with request array
 */
export async function parseGenericFile(filePath: string): Promise<GenericRequest[]> {
  const file = Bun.file(filePath);
  const content = await file.text();
  const data: GenericRequest[] = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error("Generic JSON file must be an array of requests");
  }

  return data;
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
