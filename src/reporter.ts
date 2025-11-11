import type { ComparisonReport } from "./types";

/**
 * Generate a JSON report and save it to a file
 */
export async function generateReport(
  report: ComparisonReport,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(report, null, 2);
  await Bun.write(outputPath, json);
  console.log(`\nReport saved to: ${outputPath}`);
}

/**
 * Print a summary to the console
 */
export function printSummary(report: ComparisonReport): void {
  console.log("\n" + "=".repeat(80));
  console.log("COMPARISON SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total requests:   ${report.summary.total}`);
  console.log(`Passed:           ${report.summary.passed} ✓`);
  console.log(`Failed:           ${report.summary.failed} ✗`);
  console.log("=".repeat(80));

  if (report.summary.failed > 0) {
    console.log("\nFailed requests:");
    for (const result of report.results) {
      if (result.differences.length > 0) {
        console.log(`\n  ✗ ${result.name}`);
        console.log(`    URL: ${result.url}`);
        for (const diff of result.differences) {
          console.log(`    - ${diff.message}`);
        }
      }
    }
  }

  console.log("");
}
