# API Comparator

A command-line tool built with Bun to compare API responses between reference and target environments. Perfect for testing API migrations, version upgrades, or comparing different deployment stages.

## Features

- 🔍 Compare API responses between two environments
- 📊 Status code comparison
- 📝 Normalized JSON body comparison
- ⏱️ Response time tracking
- 📄 Detailed JSON report generation
- 🎯 Optional request limiting for quick tests
- 📋 Support for generic JSON format (default) and Restfox export format

## Installation

```bash
bun install
```

## Usage

### Compare APIs (generates JSON + HTML reports)

```shell
bun run dev -- compare \
  --input-file example-requests.json \
  --reference-base-url https://api-current.example.com \
  --target-base-url https://api-next.example.com
```

### Using Restfox Export Format

If you want to use Restfox export files, specify the type:

```shell
bun run dev -- compare \
  --input-file Restfox_2025-11-11.json \
  --input-file-type restfox \
  --reference-base-url https://api-current.example.com \
  --target-base-url https://api-next.example.com
```

### Generate HTML Report from JSON

If you already have a JSON comparison report, you can generate just the HTML report:

```shell
bun run dev -- report \
  --input-file comparison-report-example-requests.json
```

### With Limit

To test only a subset of requests:

```shell
bun run dev -- compare \
  --input-file example-requests.json \
  --reference-base-url https://api-current.example.com \
  --target-base-url https://api-next.example.com \
  --limit 1
```

### Without Timestamp in Filenames

To generate reports with predictable filenames (useful for automation/scripting):

```shell
bun run dev -- compare \
  --input-file example-requests.json \
  --reference-base-url https://api-current.example.com \
  --target-base-url https://api-next.example.com \
  --no-timestamp-in-report-filenames
```

This generates `comparison-report-example-requests.json` and `comparison-report-example-requests.html` instead of timestamped filenames.

### Command Actions

| Action | Description |
|--------|-------------|
| `compare` | Compare API responses and generate both JSON and HTML reports |
| `report` | Generate HTML report from an existing JSON comparison report |

### Command-Line Options

**For `compare` action:**

| Option | Description | Required |
|--------|-------------|----------|
| `--input-file <file>` | Path to the JSON request file | ✅ Yes |
| `--input-file-type <type>` | Type of input file: `generic` (default) or `restfox` | No |
| `--reference-base-url <url>` | Base URL for the current/reference API | ✅ Yes |
| `--target-base-url <url>` | Base URL for the next/target API | ✅ Yes |
| `--limit <number>` | Limit the number of URLs to compare | No |
| `--no-timestamp-in-report-filenames` | Omit timestamp from report filenames | No |
| `--normalized-json-comparison` | Use normalized JSON comparison (ignore key order) | No (default: false/strict) |

**For `report` action:**

| Option | Description | Required |
|--------|-------------|----------|
| `--input-file <file>` | Path to the JSON comparison report | ✅ Yes |

**General options:**

| Option | Description |
|--------|-------------|
| `--help, -h` | Show help message |

## Input Format

The tool supports two input formats:

### 1. Generic JSON Format (Default)

A simple JSON array of request objects:

```json
[
  {
    "url": "https://api.example.com/users/123",
    "method": "GET"
  },
  {
    "url": "https://api.example.com/users",
    "method": "POST",
    "body": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token123"
    }
  }
]
```

**Fields:**
- `url` (required): The full URL to request
- `method` (optional): HTTP method (default: GET)
- `body` (optional): Request body as a string
- `headers` (optional): Object with header key-value pairs
- `name` (optional): Display name for the request (defaults to URL)

### 2. Restfox Export Format

Use `--input-file-type restfox` to parse Restfox export files. The tool reads the exported JSON file and extracts all HTTP requests with the following:

- Request method (GET, POST, PUT, PATCH, DELETE, etc.)
- URL with `{{baseUrl}}` placeholder support
- Request headers (with placeholder support)
- Request body (for POST/PUT/PATCH requests)
- Query parameters

Example Restfox export structure:
```json
{
  "exportedFrom": "Restfox-1.0.0",
  "collection": [
    {
      "_type": "request",
      "name": "Get User",
      "method": "GET",
      "url": "{{baseUrl}}/api/users/123",
      "body": {
        "mimeType": "No Body"
      }
    },
    {
      "_type": "request",
      "name": "Create User",
      "method": "POST",
      "url": "{{baseUrl}}/api/users",
      "body": {
        "mimeType": "application/json",
        "text": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}"
      }
    }
  ]
}
```

## Output

### Reports Generated

The `compare` action generates **two reports**:

1. **JSON Report** - Machine-readable detailed comparison data
2. **HTML Report** - Beautiful, interactive visual report

By default, both reports are timestamped (e.g., `comparison-report-Restfox_2025-11-11-2025-11-11T10-30-45-123Z.json` and `.html`). Use `--no-timestamp-in-report-filenames` to generate reports without timestamps for easier automation.

### Console Output

The tool provides:
- Progress indicator showing which request is being processed
- Summary with total, passed, and failed requests
- List of failed requests with their differences

### JSON Report

A detailed JSON report is saved with a timestamp filename (e.g., `comparison-report-example-requests.json`).

### HTML Report

An interactive HTML report is also generated with the same timestamp. Features include:

- **Visual Dashboard** - Summary cards showing total, passed, and failed requests
- **Filter Tabs** - View all results, only passed, or only failed
- **Side-by-side Comparison** - Expected vs actual values for failures
- **Response Duration** - Duration shown for both reference and target
- **Pretty JSON** - Formatted JSON diffs when applicable

Simply open the HTML file in any browser to view the interactive report.

## Comparison Logic

The tool compares the following aspects:

### 1. Status Code
Direct comparison of HTTP status codes between reference and target responses.

### 2. Response Body

**Strict JSON Comparison (default):**
- JSON responses are converted to strings and compared exactly
- Key order matters (e.g., `{"a":1,"b":2}` is different from `{"b":2,"a":1}`)
- Useful when exact JSON structure must match

**Normalized JSON Comparison (with `--normalized-json-comparison` flag):**
- **JSON responses** are compared using deep structural equality
  - Ignores key order (e.g., `{"a":1,"b":2}` equals `{"b":2,"a":1}`)
  - Detects differences in values, nested objects, and arrays
  - Uses the `fast-deep-equal` library

**Other comparisons:**
- **String responses** (plain text, HTML, XML, etc.) use direct string comparison
- **Mixed types** are flagged as a type mismatch error

### 3. Request Execution
- Requests are executed **sequentially** (reference first, then target)
- This prevents potential conflicts or performance measurement issues when both APIs share the same backend

## Building

To build the project:

```shell
bun run build
```

This creates a distributable version in the `dist/` directory.

### Running Built Version

After building:

```shell
bun run start -- compare \
  --input-file example-requests.json \
  --reference-base-url https://api-current.example.com \
  --target-base-url https://api-next.example.com
```

## Development

Project structure:
```
src/
├── index.ts          # Main entry point and action orchestration
├── cli.ts            # Command-line argument parsing
├── parser.ts         # Restfox file parser
├── comparator.ts     # API comparison logic
├── reporter.ts       # JSON report generation
├── html-reporter.ts  # HTML report generation using Eta templates
└── types.ts          # TypeScript type definitions

templates/
├── report.html       # Main HTML template
├── header.html       # Header partial
├── summary.html      # Summary cards partial
├── config.html       # Configuration section partial
├── results.html      # Results container partial
├── result-item.html  # Individual result item partial
├── footer.html       # Footer partial
├── styles.css        # CSS styles
└── scripts.js        # JavaScript for interactivity
```

## Exit Codes

- `0`: All comparisons passed
- `1`: One or more comparisons failed or an error occurred

This makes the tool suitable for CI/CD pipelines.

## License

MIT

## Template Engine

The HTML reports are generated using [**Eta**](https://eta.js.org/) - a lightweight, fast, and TypeScript-native template engine. Templates are located in the `templates/` directory and are organized into:

- **Partials**: Reusable components (header, footer, result items)
- **Styles**: Separated CSS file for easy customization
- **Scripts**: JavaScript for interactive features

This makes it easy to customize the HTML report appearance and behavior without touching the TypeScript code.
