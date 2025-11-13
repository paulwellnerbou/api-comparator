#!/usr/bin/env bun

import { parseArgs } from "./cli";
import { parseGenericFile, parseRestfoxFile } from "./parser";
import { makeRequest, compareResponses } from "./comparator";
import { generateReport, printSummary } from "./reporter";
import { generateHtmlReport } from "./html-reporter";
import type { ComparisonReport, ComparisonResult, GenericRequest } from "./types";

async function main() {
  console.log("API Comparator v1.0.0\n");

  // Parse command line arguments
  const options = parseArgs(process.argv.slice(2));

  if (options.action === "compare") {
    await runCompare(options);
  } else if (options.action === "report") {
    await runReport(options);
  }
}

async function runCompare(options: any) {
  console.log("Configuration:");
  console.log(`  Input file:        ${options.inputFile}`);
  console.log(`  Input file type:   ${options.inputFileType}`);
  console.log(`  Reference URL:     ${options.referenceBaseUrl}`);
  console.log(`  Target URL:        ${options.targetBaseUrl}`);
  if (options.referenceHeaders && Object.keys(options.referenceHeaders).length > 0) {
    console.log(`  Reference headers: ${JSON.stringify(options.referenceHeaders)}`);
  }
  if (options.targetHeaders && Object.keys(options.targetHeaders).length > 0) {
    console.log(`  Target headers:    ${JSON.stringify(options.targetHeaders)}`);
  }
  if (options.limit) {
    console.log(`  Limit:             ${options.limit}`);
  }
  console.log("");

  // Parse the input file - all formats are converted to GenericRequest[]
  let requests: GenericRequest[];
  
  if (options.inputFileType === "restfox") {
    requests = await parseRestfoxFile(options.inputFile);
  } else {
    requests = await parseGenericFile(options.inputFile);
  }
  
  // Apply limit if specified
  if (options.limit && options.limit > 0) {
    requests = requests.slice(0, options.limit);
  }

  console.log(`Processing ${requests.length} requests...\n`);

  // Process each request
  const results: ComparisonResult[] = [];
  let completed = 0;
  let lastLineLength = 0;

  for (const request of requests) {
    completed++;
    const url = request.url || request.referenceUrl || request.targetUrl || '';
    const progressText = `[${completed}/${requests.length}] ${url}`;
    // Clear line completely by padding to the length of the previous line
    const padding = ' '.repeat(Math.max(0, lastLineLength - progressText.length));
    process.stdout.write(`\r${progressText}${padding}`);
    lastLineLength = progressText.length;

    // Make requests sequentially to avoid backend conflicts
    // (both APIs might share the same backend)
    const referenceResponse = await makeRequest(
      request, 
      options.referenceBaseUrl, 
      {},
      options.referenceHeaders || {},
      'reference'
    );
    const targetResponse = await makeRequest(
      request, 
      options.targetBaseUrl,
      {},
      options.targetHeaders || {},
      'target'
    );

    // Compare the responses
    const differences = compareResponses(
      referenceResponse, 
      targetResponse,
      options.normalizedJsonComparison === true // Default to false (strict) if not specified
    );

    // Extract name and method based on format
    const name = request.name || url;
    const method = request.method || "GET";

    // Determine actual URLs used
    const referenceUrl = request.referenceUrl;
    const targetUrl = request.targetUrl;

    // Store the result
    results.push({
      name,
      method,
      url,
      referenceUrl,
      targetUrl,
      referenceBaseUrl: options.referenceBaseUrl,
      targetBaseUrl: options.targetBaseUrl,
      reference: {
        statusCode: referenceResponse.statusCode,
        statusText: referenceResponse.statusText,
        body: referenceResponse.body,
        duration: referenceResponse.duration,
        error: referenceResponse.error,
      },
      target: {
        statusCode: targetResponse.statusCode,
        statusText: targetResponse.statusText,
        body: targetResponse.body,
        duration: targetResponse.duration,
        error: targetResponse.error,
      },
      differences,
    });
  }

  process.stdout.write("\n");

  // Build command line string
  const args = process.argv.slice(2);
  const commandLine = `bun run dev -- ${args.join(' ')}`;

  // Generate the report
  const report: ComparisonReport = {
    timestamp: new Date().toISOString(),
    commandLine,
    options,
    inputRequests: requests,  // Include the input requests in generic format
    summary: {
      total: results.length,
      passed: results.filter((r) => r.differences.length === 0).length,
      failed: results.filter((r) => r.differences.length > 0).length,
    },
    results,
  };

  // Save JSON report to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const inputFileName = options.inputFile.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'report';
  
  let jsonOutputPath: string;
  let htmlOutputPath: string;
  
  if (options.outputFile) {
    // User specified output file - use it as base name
    const outputBase = options.outputFile.replace(/\.(json|html)$/, '');
    const outputDir = options.outputDir || '.';
    jsonOutputPath = `${outputDir}/${outputBase}.json`;
    htmlOutputPath = `${outputDir}/${outputBase}.html`;
  } else if (options.outputDir) {
    // User specified only output dir
    const baseFileName = `comparison-report-${inputFileName}`;
    jsonOutputPath = options.noTimestampInReportFilenames 
      ? `${options.outputDir}/${baseFileName}.json`
      : `${options.outputDir}/${baseFileName}-${timestamp}.json`;
    htmlOutputPath = options.noTimestampInReportFilenames
      ? `${options.outputDir}/${baseFileName}.html`
      : `${options.outputDir}/${baseFileName}-${timestamp}.html`;
  } else {
    // No output options specified - use default behavior
    const baseFileName = `comparison-report-${inputFileName}`;
    jsonOutputPath = options.noTimestampInReportFilenames 
      ? `${baseFileName}.json`
      : `${baseFileName}-${timestamp}.json`;
    htmlOutputPath = options.noTimestampInReportFilenames
      ? `${baseFileName}.html`
      : `${baseFileName}-${timestamp}.html`;
  }
  
  await generateReport(report, jsonOutputPath);

  // Generate HTML report - always use the same name as JSON, just different extension
  await generateHtmlReport(report, htmlOutputPath);

  // Print summary to console
  printSummary(report);

  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

async function runReport(options: any) {
  console.log("Generating HTML report from JSON...\n");
  console.log(`  Input file: ${options.inputFile}`);

  // Read the JSON report
  const file = Bun.file(options.inputFile);
  const content = await file.text();
  const report: ComparisonReport = JSON.parse(content);

  // Generate HTML report
  let htmlOutputPath: string;
  
  if (options.outputFile) {
    // User specified output file
    const outputFileName = options.outputFile.endsWith('.html') 
      ? options.outputFile 
      : `${options.outputFile}.html`;
    const outputDir = options.outputDir || '.';
    htmlOutputPath = `${outputDir}/${outputFileName}`;
  } else {
    // Match the JSON filename exactly, but with .html extension
    // and use the same directory as the JSON file
    const inputPath = options.inputFile;
    const lastSlashIndex = inputPath.lastIndexOf('/');
    const inputDir = options.outputDir || (lastSlashIndex >= 0 ? inputPath.substring(0, lastSlashIndex) : '.');
    const inputFileName = lastSlashIndex >= 0 ? inputPath.substring(lastSlashIndex + 1) : inputPath;
    const baseFileName = inputFileName.replace(/\.json$/, '');
    htmlOutputPath = `${inputDir}/${baseFileName}.html`;
  }
  
  await generateHtmlReport(report, htmlOutputPath);

  console.log("\n✓ HTML report generated successfully");
}

// Run the main function
main().catch((error) => {
  console.error("\nError:", error.message);
  process.exit(1);
});
