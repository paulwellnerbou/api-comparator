import { Eta } from "eta";
import { join } from "path";
import type { ComparisonReport } from "./types";

// Read package.json for version
const packageJson = await Bun.file(join(import.meta.dir, "../package.json")).json();
const version = packageJson.version;

// Initialize Eta with the templates directory
const eta = new Eta({
  views: join(import.meta.dir, "../templates"),
  cache: false, // Disable cache for development, enable for production
});

/**
 * Generate an HTML report from the comparison results using Eta templates
 */
export async function generateHtmlReport(
  report: ComparisonReport,
  outputPath: string
): Promise<void> {
  const html = await eta.renderAsync("report.html", { report, version });
  await Bun.write(outputPath, html);
  console.log(`HTML report saved to: ${outputPath}`);
}
