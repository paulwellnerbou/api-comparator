import type { CliOptions } from "./types";

/**
 * Parse headers from command line string format "Header1: value1, Header2: value2"
 */
function parseHeaders(headerString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Split by comma to get individual headers
  const headerPairs = headerString.split(',').map(h => h.trim());
  
  for (const pair of headerPairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) {
      console.error(`Error: Invalid header format '${pair}'. Expected 'Header: value'`);
      process.exit(1);
    }
    
    const name = pair.substring(0, colonIndex).trim();
    const value = pair.substring(colonIndex + 1).trim();
    
    if (!name) {
      console.error(`Error: Empty header name in '${pair}'`);
      process.exit(1);
    }
    
    headers[name] = value;
  }
  
  return headers;
}

/**
 * Parse command line arguments
 */
export function parseArgs(args: string[]): CliOptions {
  const options: Partial<CliOptions> = {
    inputFileType: "generic",
  };

  // Check for help flag first
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  // First argument should be the action
  if (args.length === 0 || args[0].startsWith("--")) {
    console.error("Error: Action is required (compare or report)");
    printHelp();
    process.exit(1);
  }

  const action = args[0];
  if (action !== "compare" && action !== "report") {
    console.error(`Error: Unknown action '${action}'. Must be 'compare' or 'report'`);
    printHelp();
    process.exit(1);
  }

  options.action = action;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--input-file":
        options.inputFile = args[++i];
        break;
      case "--input-file-type":
        const fileType = args[++i];
        if (fileType !== "generic" && fileType !== "restfox") {
          console.error(`Error: Invalid input file type '${fileType}'. Must be 'generic' or 'restfox'`);
          process.exit(1);
        }
        options.inputFileType = fileType;
        break;
      case "--reference-base-url":
        options.referenceBaseUrl = args[++i];
        break;
      case "--target-base-url":
        options.targetBaseUrl = args[++i];
        break;
      case "--reference-headers":
        options.referenceHeaders = parseHeaders(args[++i]);
        break;
      case "--target-headers":
        options.targetHeaders = parseHeaders(args[++i]);
        break;
      case "--limit":
        options.limit = parseInt(args[++i], 10);
        break;
      case "--no-timestamp-in-report-filenames":
        options.noTimestampInReportFilenames = true;
        break;
      case "--normalized-json-comparison":
        options.normalizedJsonComparison = true;
        break;
      case "--output-file":
        options.outputFile = args[++i];
        break;
      case "--output-dir":
        options.outputDir = args[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown option: ${arg}`);
          printHelp();
          process.exit(1);
        }
    }
  }

  // Validate required options based on action
  if (!options.inputFile) {
    console.error("Error: --input-file is required");
    printHelp();
    process.exit(1);
  }

  if (options.action === "compare") {
    if (!options.referenceBaseUrl) {
      console.error("Error: --reference-base-url is required for 'compare' action");
      printHelp();
      process.exit(1);
    }

    if (!options.targetBaseUrl) {
      console.error("Error: --target-base-url is required for 'compare' action");
      printHelp();
      process.exit(1);
    }
  }

  return options as CliOptions;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
API Comparator - Compare API responses between environments

Usage:
  api-comparator <action> [options]

Actions:
  compare    Compare API responses and generate JSON + HTML reports
  report     Generate HTML report from existing JSON comparison report

Options for 'compare':
  --input-file <file>              Path to the JSON request file (required)
  --input-file-type <type>         Type of input file: 'generic' or 'restfox' (default: generic)
  --reference-base-url <url>       Base URL for the reference/current API (required)
  --target-base-url <url>          Base URL for the target/next API (required)
  --reference-headers <headers>    Headers to add to all reference requests (format: "Header1: value1, Header2: value2")
  --target-headers <headers>       Headers to add to all target requests (format: "Header1: value1, Header2: value2")
  --limit <number>                 Limit the number of URLs to compare
  --output-file <file>             Output filename for reports (without extension)
  --output-dir <dir>               Output directory for reports (default: current directory)
  --no-timestamp-in-report-filenames   Omit timestamp from report filenames
  --normalized-json-comparison     Use normalized JSON comparison (ignore key order)

Options for 'report':
  --input-file <file>              Path to the JSON comparison report (required)
  --output-file <file>             Output filename for HTML report (with or without .html extension)
  --output-dir <dir>               Output directory for HTML report (default: same as input file)

General Options:
  --help, -h                       Show this help message

Examples:
  # Compare APIs and generate reports
  api-comparator compare \\
    --input-file Restfox_2025-11-11.json \\
    --reference-base-url https://api-current.example.com \\
    --target-base-url https://api-next.example.com \\
    --limit 10

  # Compare with custom headers
  api-comparator compare \\
    --input-file requests.json \\
    --reference-base-url https://api-current.example.com \\
    --target-base-url https://api-next.example.com \\
    --reference-headers "API-Key: xyz123, User-Agent: MyApp" \\
    --target-headers "API-Key: abc456"

  # Compare without timestamp in filenames
  api-comparator compare \
    --input-file Restfox_2025-11-11.json \
    --reference-base-url https://api-current.example.com \
    --target-base-url https://api-next.example.com \
    --no-timestamp-in-report-filenames

  # Generate HTML report from existing JSON
  api-comparator report \\
    --input-file comparison-report-2025-11-11T10-30-45-123Z.json
`);
}
